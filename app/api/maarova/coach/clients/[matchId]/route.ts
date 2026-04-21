import { getMaarovaCoachSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

/**
 * GET /api/maarova/coach/clients/[matchId]
 * Client detail: assessment summary (limited), goals, sessions.
 */
export const GET = handler(async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const session = await getMaarovaCoachSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await params;

  const match = await prisma.maarovaCoachingMatch.findFirst({
    where: { id: matchId, coachId: session.sub },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          title: true,
          department: true,
          organisation: { select: { name: true } },
        },
      },
      sessions: {
        orderBy: { scheduledAt: "asc" },
        select: {
          id: true,
          scheduledAt: true,
          completedAt: true,
          duration: true,
          notes: true,
          focusAreas: true,
          status: true,
        },
      },
    },
  });

  if (!match) {
    return Response.json({ error: "Client not found" }, { status: 404 });
  }

  // Assessment summary (limited - archetype, strengths, dimension scores only)
  const report = await prisma.maarovaReport.findFirst({
    where: { userId: match.userId, status: "READY" },
    orderBy: { createdAt: "desc" },
    select: {
      leadershipArchetype: true,
      signatureStrengths: true,
      dimensionScores: true,
    },
  });

  // Goals
  const goals = await prisma.maarovaDevelopmentGoal.findMany({
    where: { userId: match.userId },
    include: {
      ratings: {
        orderBy: { createdAt: "desc" },
        select: { id: true, raterType: true, score: true, note: true, createdAt: true },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return Response.json({
    match: {
      id: match.id,
      status: match.status,
      programme: match.programme,
      startDate: match.startDate,
      endDate: match.endDate,
      sessionsCompleted: match.sessionsCompleted,
      sessionsScheduled: match.sessionsScheduled,
      matchRationale: match.matchRationale,
    },
    user: match.user,
    sessions: match.sessions.map((s) => JSON.parse(JSON.stringify(s))),
    assessmentSummary: report ? {
      archetype: report.leadershipArchetype,
      strengths: report.signatureStrengths,
      dimensionScores: report.dimensionScores,
    } : null,
    goals: goals.map((g) => JSON.parse(JSON.stringify(g))),
  });
});
