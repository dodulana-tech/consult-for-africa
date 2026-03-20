import { getMaarovaCoachSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { emailCoachingSessionScheduled } from "@/lib/email";
import { NextRequest } from "next/server";

/**
 * POST /api/maarova/coach/sessions
 * Schedule a new coaching session. Coach provides matchId, date/time, focus areas, and meeting link.
 */
export async function POST(req: NextRequest) {
  const session = await getMaarovaCoachSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { matchId, scheduledAt, focusAreas, meetingLink } = body;

  if (!matchId || !scheduledAt) {
    return Response.json({ error: "matchId and scheduledAt are required" }, { status: 400 });
  }

  // Verify the match belongs to this coach and is active
  const match = await prisma.maarovaCoachingMatch.findFirst({
    where: { id: matchId, coachId: session.sub, status: { in: ["PENDING_MATCH", "MATCHED", "ACTIVE"] } },
    select: { id: true, userId: true, sessionsScheduled: true, status: true },
  });

  if (!match) {
    return Response.json({ error: "Match not found or not active" }, { status: 404 });
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    return Response.json({ error: "Invalid date" }, { status: 400 });
  }

  // Create the session
  const coachingSession = await prisma.maarovaCoachingSession.create({
    data: {
      matchId,
      scheduledAt: scheduledDate,
      focusAreas: Array.isArray(focusAreas) ? focusAreas : [],
      meetingLink: meetingLink?.trim() || null,
      status: "SCHEDULED",
    },
  });

  // Update match: increment scheduled count, set nextSessionAt, activate if needed
  const updateData: Record<string, unknown> = {
    sessionsScheduled: { increment: 1 },
    nextSessionAt: scheduledDate,
  };

  // If first session is being scheduled and status is MATCHED, activate the engagement
  if (match.status === "MATCHED" || match.status === "PENDING_MATCH") {
    updateData.status = "ACTIVE";
    if (match.status === "PENDING_MATCH" || match.status === "MATCHED") {
      updateData.startDate = new Date();
    }
  }

  await prisma.maarovaCoachingMatch.update({
    where: { id: matchId },
    data: updateData,
  });

  // Email the coachee about the scheduled session
  const coachee = await prisma.maarovaUser.findUnique({ where: { id: match.userId }, select: { email: true, name: true } });
  if (coachee) {
    emailCoachingSessionScheduled({
      coacheeEmail: coachee.email,
      coacheeName: coachee.name,
      coachName: session.name,
      scheduledAt: scheduledDate.toISOString(),
      meetingLink: meetingLink?.trim() || undefined,
    }).catch(() => {});
  }

  return Response.json({ session: JSON.parse(JSON.stringify(coachingSession)) }, { status: 201 });
}
