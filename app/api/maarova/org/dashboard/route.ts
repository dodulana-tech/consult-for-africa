import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

/**
 * GET /api/maarova/org/dashboard
 * Org-level stats for HR admin: user counts, assessment funnel, coaching status, goal progress.
 */
export const GET = handler(async function GET() {
  const session = await getMaarovaSession();
  if (!session || session.role !== "HR_ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const orgId = session.organisationId;

  const [users, sessions, matches, goals] = await Promise.all([
    prisma.maarovaUser.findMany({
      where: { organisationId: orgId },
      select: { id: true, isPortalEnabled: true },
    }),
    prisma.maarovaAssessmentSession.findMany({
      where: { user: { organisationId: orgId } },
      select: { userId: true, status: true },
    }),
    prisma.maarovaCoachingMatch.findMany({
      where: { user: { organisationId: orgId }, status: { in: ["PENDING_MATCH", "MATCHED", "ACTIVE", "COMPLETED"] } },
      select: { userId: true, status: true },
    }),
    prisma.maarovaDevelopmentGoal.findMany({
      where: { user: { organisationId: orgId } },
      select: { status: true, progress: true },
    }),
  ]);

  const totalUsers = users.length;
  const portalEnabled = users.filter((u) => u.isPortalEnabled).length;

  // Assessment funnel
  const completedUserIds = new Set(sessions.filter((s) => s.status === "COMPLETED").map((s) => s.userId));
  const inProgressUserIds = new Set(sessions.filter((s) => s.status === "IN_PROGRESS").map((s) => s.userId));
  const assessmentCompleted = completedUserIds.size;
  const assessmentInProgress = [...inProgressUserIds].filter((id) => !completedUserIds.has(id)).length;
  const assessmentNotStarted = totalUsers - assessmentCompleted - assessmentInProgress;

  // Coaching status
  const coachingActive = new Set(matches.filter((m) => m.status === "ACTIVE").map((m) => m.userId)).size;
  const coachingMatched = new Set(matches.filter((m) => ["PENDING_MATCH", "MATCHED"].includes(m.status)).map((m) => m.userId)).size;
  const coachingCompleted = new Set(matches.filter((m) => m.status === "COMPLETED").map((m) => m.userId)).size;

  // Goals
  const totalGoals = goals.length;
  const goalsCompleted = goals.filter((g) => g.status === "COMPLETED").length;
  const avgProgress = totalGoals > 0 ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / totalGoals) : 0;

  return Response.json({
    totalUsers,
    portalEnabled,
    assessment: { completed: assessmentCompleted, inProgress: assessmentInProgress, notStarted: assessmentNotStarted },
    coaching: { active: coachingActive, matched: coachingMatched, completed: coachingCompleted },
    goals: { total: totalGoals, completed: goalsCompleted, avgProgress },
  });
});
