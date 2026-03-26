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
    select: { id: true, userId: true, sessionsScheduled: true, sessionsCompleted: true, status: true, programme: true },
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

  // Look up programme's fixed session count
  const PROGRAMME_SESSIONS: Record<string, number> = {
    coaching_lite_3_month: 6,
    standard_6_month: 12,
    intensive_12_month: 24,
  };
  const programmeTotal = PROGRAMME_SESSIONS[match.programme] ?? 12;

  if (sessionNumber > programmeTotal) {
    return Response.json({ error: `Programme limit of ${programmeTotal} sessions reached` }, { status: 400 });
  }

  const sessionTemplate = getSessionTemplate(sessionNumber, programmeTotal);

  // Update match: set nextSessionAt, activate if needed
  const matchUpdateData: Record<string, unknown> = {
    nextSessionAt: scheduledDate,
  };

  // If first session is being scheduled on a MATCHED engagement, transition to ACTIVE
  if (match.status === "MATCHED") {
    matchUpdateData.status = "ACTIVE";
    matchUpdateData.startDate = new Date();
  }

  // Create session and update match in a transaction to prevent duplicate session numbers
  const coachingSession = await prisma.$transaction(async (tx) => {
    const created = await tx.maarovaCoachingSession.create({
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

    await tx.maarovaCoachingMatch.update({
      where: { id: matchId },
      data: matchUpdateData,
    });

    return created;
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
