import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleMeetMeeting } from "@/lib/google";
import { sendMeetingInvite } from "@/lib/email";
import { NextRequest } from "next/server";

const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];

/**
 * GET /api/meetings
 * List meetings. DIRECTOR+ sees all, others see meetings they organize or participate in.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const engagementId = searchParams.get("engagementId");
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const upcoming = searchParams.get("upcoming");

  const isElevated = ELEVATED.includes(session.user.role);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (!isElevated) {
    where.OR = [
      { organizerId: session.user.id },
      { participants: { some: { userId: session.user.id } } },
    ];
  }

  if (engagementId) where.engagementId = engagementId;
  if (status) where.status = status;
  if (type) where.type = type;
  if (upcoming === "true") {
    where.scheduledAt = { gte: new Date() };
    where.status = { in: ["SCHEDULED", "IN_PROGRESS"] };
  }

  const meetings = await prisma.meeting.findMany({
    where,
    orderBy: { scheduledAt: upcoming === "true" ? "asc" : "desc" },
    include: {
      organizer: { select: { id: true, name: true, email: true } },
      participants: {
        select: { id: true, name: true, email: true, role: true, attended: true },
      },
      engagement: { select: { id: true, name: true } },
      discoveryCall: { select: { id: true, organizationName: true } },
    },
    take: 50,
  });

  return Response.json({ meetings });
}

/**
 * POST /api/meetings
 * Create a new meeting with auto-generated Google Meet link.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    title,
    description,
    type,
    scheduledAt,
    durationMinutes,
    participants,
    engagementId,
    discoveryCallId,
    clientId,
    nuruEnabled,
  } = body;

  // Validate required fields
  if (!title?.trim()) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }
  if (!scheduledAt) {
    return Response.json({ error: "Scheduled time is required" }, { status: 400 });
  }
  if (!type) {
    return Response.json({ error: "Meeting type is required" }, { status: 400 });
  }
  if (!participants?.length) {
    return Response.json({ error: "At least one participant is required" }, { status: 400 });
  }

  const startTime = new Date(scheduledAt);
  const duration = durationMinutes ?? 60;
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

  // Collect all attendee emails for Google Calendar
  const attendeeEmails: string[] = participants
    .map((p: { email?: string }) => p.email)
    .filter(Boolean);

  // Create Google Meet
  let meetLink = "";
  let calendarEventId = "";
  try {
    const googleResult = await createGoogleMeetMeeting({
      title: title.trim(),
      description: description?.trim(),
      startTime,
      endTime,
      attendeeEmails,
    });
    meetLink = googleResult.meetLink;
    calendarEventId = googleResult.calendarEventId;
  } catch (err) {
    console.error("[meetings] Google Meet creation failed:", err);
    // Continue without Google Meet - meeting still gets created in DB
  }

  // Create meeting in database
  const meeting = await prisma.meeting.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      type,
      scheduledAt: startTime,
      scheduledEndAt: endTime,
      meetLink: meetLink || null,
      calendarEventId: calendarEventId || null,
      organizerId: session.user.id,
      engagementId: engagementId || null,
      clientId: clientId || null,
      nuruEnabled: nuruEnabled ?? true,
      participants: {
        create: participants.map((p: { name: string; email: string; userId?: string; role?: string }) => ({
          name: p.name,
          email: p.email,
          userId: p.userId || null,
          role: p.role || null,
        })),
      },
    },
    include: {
      organizer: { select: { id: true, name: true, email: true } },
      participants: true,
    },
  });

  // Link to discovery call if specified
  if (discoveryCallId) {
    await prisma.discoveryCall.update({
      where: { id: discoveryCallId },
      data: { meetingId: meeting.id },
    });
  }

  // Send email invites (non-blocking)
  if (meetLink) {
    for (const participant of meeting.participants) {
      sendMeetingInvite({
        to: participant.email,
        participantName: participant.name,
        meetingTitle: meeting.title,
        meetLink,
        scheduledAt: startTime,
        scheduledEndAt: endTime,
        organizerName: meeting.organizer?.name ?? "C4A",
        nuruEnabled: meeting.nuruEnabled,
      }).catch((err) =>
        console.error(`[meetings] Failed to send invite to ${participant.email}:`, err)
      );
    }
  }

  return Response.json({ meeting }, { status: 201 });
}
