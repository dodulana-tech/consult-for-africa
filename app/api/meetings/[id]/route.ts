import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateGoogleMeetMeeting, cancelGoogleMeetMeeting } from "@/lib/google";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/meetings/:id
 * Get a single meeting with full details.
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
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
}

/**
 * PATCH /api/meetings/:id
 * Update meeting details. Syncs changes back to Google Calendar.
 */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const existing = await prisma.meeting.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Meeting not found" }, { status: 404 });
  }

  // Only organizer or elevated roles can edit
  const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];
  if (existing.organizerId !== session.user.id && !ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, scheduledAt, durationMinutes, status } = body;

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

  const meeting = await prisma.meeting.update({
    where: { id },
    data,
    include: {
      organizer: { select: { id: true, name: true, email: true } },
      participants: true,
    },
  });

  // Sync to Google Calendar (non-blocking)
  if (existing.calendarEventId && (title || scheduledAt)) {
    updateGoogleMeetMeeting({
      calendarEventId: existing.calendarEventId,
      title: data.title,
      description: data.description,
      startTime: data.scheduledAt,
      endTime: data.scheduledEndAt,
    }).catch((err) =>
      console.error("[meetings] Google Calendar sync failed:", err)
    );
  }

  return Response.json({ meeting });
}

/**
 * DELETE /api/meetings/:id
 * Cancel a meeting. Removes from Google Calendar.
 */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const existing = await prisma.meeting.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Meeting not found" }, { status: 404 });
  }

  const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];
  if (existing.organizerId !== session.user.id && !ELEVATED.includes(session.user.role)) {
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
}
