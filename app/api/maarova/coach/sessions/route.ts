import { getMaarovaCoachSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { emailCoachingSessionScheduled } from "@/lib/email";
import { NextRequest } from "next/server";

/**
 * Determine the session template based on session number and total sessions.
 * Session 1: goal_setting
 * Sessions 2 through (total - 2): working
 * Session (total - 1): progress_review
 * Session total: integration
 */
function getSessionTemplate(sessionNumber: number, total: number): string {
  if (sessionNumber === 1) return "goal_setting";
  if (sessionNumber === total) return "integration";
  if (sessionNumber === total - 1) return "progress_review";
  return "working";
}

/**
 * POST /api/maarova/coach/sessions
 * Schedule a new coaching session. Coach provides matchId, date/time, focus areas, and meeting link.
 * Auto-assigns session number and template. Transitions MATCHED to ACTIVE on first session.
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

  // Verify the match belongs to this coach and is in an eligible status
  const match = await prisma.maarovaCoachingMatch.findFirst({
    where: { id: matchId, coachId: session.sub, status: { in: ["MATCHED", "ACTIVE"] } },
    select: { id: true, userId: true, sessionsScheduled: true, sessionsCompleted: true, status: true },
  });

  if (!match) {
    return Response.json({ error: "Match not found or not eligible for scheduling" }, { status: 404 });
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    return Response.json({ error: "Invalid date" }, { status: 400 });
  }

  // Count currently scheduled (not yet completed/cancelled) sessions for this match
  const scheduledCount = await prisma.maarovaCoachingSession.count({
    where: { matchId, status: "SCHEDULED" },
  });

  // Auto-calculate session number: completed + currently scheduled + 1
  const sessionNumber = match.sessionsCompleted + scheduledCount + 1;

  // Total sessions from the match (sessionsScheduled tracks the programme total)
  // We use sessionsScheduled + 1 since we are about to increment it
  const total = match.sessionsScheduled + 1;
  const sessionTemplate = getSessionTemplate(sessionNumber, total);

  // Create the session
  const coachingSession = await prisma.maarovaCoachingSession.create({
    data: {
      matchId,
      scheduledAt: scheduledDate,
      focusAreas: Array.isArray(focusAreas) ? focusAreas : [],
      meetingLink: meetingLink?.trim() || null,
      status: "SCHEDULED",
      sessionNumber,
      sessionTemplate,
    },
  });

  // Update match: increment scheduled count, set nextSessionAt, activate if needed
  const updateData: Record<string, unknown> = {
    sessionsScheduled: { increment: 1 },
    nextSessionAt: scheduledDate,
  };

  // If first session is being scheduled on a MATCHED engagement, transition to ACTIVE
  if (match.status === "MATCHED") {
    updateData.status = "ACTIVE";
    updateData.startDate = new Date();
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
