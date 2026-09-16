import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateGoogleMeetMeeting, cancelGoogleMeetMeeting } from "@/lib/google";
import { sendMeetingInvite } from "@/lib/email";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";
import { MEETING_ORGANIZER_ROLES } from "@/lib/constants";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/meetings/:id
 * Get a single meeting with full details.
 */
export const GET = handler(async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true, email: true } },
      participants: {
        select: {
          id: true, name: true, email: true, role: true,
          attended: true, joinedAt: true, leftAt: true, userId: true,
        },
      },
      engagement: { select: { id: true, name: true } },
      discoveryCall: { select: { id: true, organizationName: true, contactName: true } },
    },
  });

  if (!meeting) {
    return Response.json({ error: "Meeting not found" }, { status: 404 });
  }

  return Response.json({ meeting });
});

/**
 * PATCH /api/meetings/:id
 * Update meeting details. Syncs changes back to Google Calendar.
 */
export const PATCH = handler(async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const existing = await prisma.meeting.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Meeting not found" }, { status: 404 });
  }

  // Only organizer or elevated roles can edit. The Executive Assistant holds
  // organiser rights outright; the Administrative Assistant does not, so she is
  // held to the meeting she scheduled.
  const ELEVATED: readonly string[] = MEETING_ORGANIZER_ROLES;
  if (existing.organizerId !== session.user.id && !ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, scheduledAt, durationMinutes, status, addParticipants, removeParticipantIds } = body;

  // Scheduling and minutes, not organiser rights: she can write the meeting up,
  // she cannot move it or call it off.
  if (session.user.role === "ADMINISTRATIVE_ASSISTANT") {
    if (scheduledAt || status === "CANCELLED") {
      return Response.json(
        { error: "Rescheduling and cancelling sit with the Executive Assistant." },
        { status: 403 },
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (title) data.title = title.trim();
  if (description !== undefined) data.description = description?.trim() || null;
  if (status) data.status = status;

  if (scheduledAt) {
    data.scheduledAt = new Date(scheduledAt);
    const dur = durationMinutes ?? existing.duration ?? 60;
    data.scheduledEndAt = new Date(data.scheduledAt.getTime() + dur * 60 * 1000);
  }

  // Status transitions
  if (status === "IN_PROGRESS" && !existing.startedAt) {
    data.startedAt = new Date();
  }
  if (status === "COMPLETED" && !existing.endedAt) {
    data.endedAt = new Date();
    if (existing.startedAt) {
      data.duration = Math.round(
        (data.endedAt.getTime() - new Date(existing.startedAt).getTime()) / 60000
      );
    }
  }

  // Adding and removing people is scheduling work, not organiser rights, so the
  // Administrative Assistant can do it. Moving or cancelling the meeting is
  // still blocked above.
  if (Array.isArray(removeParticipantIds) && removeParticipantIds.length > 0) {
    await prisma.meetingParticipant.deleteMany({
      where: { id: { in: removeParticipantIds }, meetingId: id },
    });
  }

  let added: { name: string; email: string }[] = [];
  if (Array.isArray(addParticipants) && addParticipants.length > 0) {
    const existingEmails = new Set(
      (await prisma.meetingParticipant.findMany({ where: { meetingId: id }, select: { email: true } }))
        .map((p) => p.email.toLowerCase()),
    );
    added = addParticipants
      .filter((p: { name?: string; email?: string }) => p?.email?.trim() && p?.name?.trim())
      .filter((p: { email: string }) => !existingEmails.has(p.email.trim().toLowerCase()))
      .map((p: { name: string; email: string; role?: string; userId?: string }) => ({
        name: p.name.trim(),
        email: p.email.trim(),
        role: p.role?.trim() || null,
        userId: p.userId || null,
      })) as { name: string; email: string }[];
    if (added.length > 0) {
      await prisma.meetingParticipant.createMany({
        data: added.map((p) => ({ ...p, meetingId: id })),
      });
    }
  }

  const meeting = await prisma.meeting.update({
    where: { id },
    data,
    include: {
      organizer: { select: { id: true, name: true, email: true } },
      participants: true,
    },
  });

  // Sync to Google Calendar (non-blocking). The attendee list goes too, so
  // somebody added here actually appears on the calendar invitation rather than
  // only in our database.
  const peopleChanged = added.length > 0 || (Array.isArray(removeParticipantIds) && removeParticipantIds.length > 0);
  if (existing.calendarEventId && (title || scheduledAt || peopleChanged)) {
    updateGoogleMeetMeeting({
      calendarEventId: existing.calendarEventId,
      title: data.title,
      description: data.description,
      startTime: data.scheduledAt,
      endTime: data.scheduledEndAt,
      attendeeEmails: peopleChanged ? meeting.participants.map((p) => p.email) : undefined,
    }).catch((err) =>
      console.error("[meetings] Google Calendar sync failed:", err)
    );
  }

  // Somebody added late still needs telling. Only the new people, so nobody
  // already going gets a duplicate.
  if (added.length > 0 && meeting.meetLink) {
    for (const p of added) {
      sendMeetingInvite({
        to: p.email,
        participantName: p.name,
        meetingTitle: meeting.title,
        meetLink: meeting.meetLink,
        scheduledAt: meeting.scheduledAt,
        scheduledEndAt: meeting.scheduledEndAt,
        organizerName: meeting.organizer?.name ?? "C4A",
        nuruEnabled: meeting.nuruEnabled,
      }).catch((err) => console.error(`[meetings] invite to ${p.email} failed:`, err));
    }
  }

  return Response.json({ meeting });
});

/**
 * DELETE /api/meetings/:id
 * Cancel a meeting. Removes from Google Calendar.
 */
export const DELETE = handler(async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const existing = await prisma.meeting.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Meeting not found" }, { status: 404 });
  }

  const ELEVATED: readonly string[] = MEETING_ORGANIZER_ROLES;
  if (
    session.user.role === "ADMINISTRATIVE_ASSISTANT" ||
    (existing.organizerId !== session.user.id && !ELEVATED.includes(session.user.role))
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Cancel in Google Calendar
  if (existing.calendarEventId) {
    cancelGoogleMeetMeeting(existing.calendarEventId).catch((err) =>
      console.error("[meetings] Google Calendar cancel failed:", err)
    );
  }

  await prisma.meeting.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return Response.json({ success: true });
});
