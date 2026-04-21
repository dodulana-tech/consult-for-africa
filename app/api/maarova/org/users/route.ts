import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

/**
 * GET /api/maarova/org/users
 * List all users in the org with assessment, coaching, and goal summaries.
 * Auth: HR_ADMIN only.
 */
export const GET = handler(async function GET() {
  const session = await getMaarovaSession();
  if (!session || session.role !== "HR_ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await prisma.maarovaUser.findMany({
    where: { organisationId: session.organisationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      title: true,
      department: true,
      managerId: true,
      manager: { select: { id: true, name: true } },
      isPortalEnabled: true,
      lastLoginAt: true,
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true },
      },
      coachingMatches: {
        where: { status: { in: ["PENDING_MATCH", "MATCHED", "ACTIVE", "COMPLETED"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, sessionsCompleted: true, sessionsScheduled: true },
      },
      developmentGoals: {
        select: { status: true, progress: true },
      },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  const formatted = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    title: u.title,
    department: u.department,
    managerId: u.managerId,
    managerName: u.manager?.name ?? null,
    isPortalEnabled: u.isPortalEnabled,
    lastLoginAt: u.lastLoginAt,
    assessmentStatus: u.sessions[0]?.status ?? "NOT_STARTED",
    coachingStatus: u.coachingMatches[0]?.status ?? null,
    coachingProgress: u.coachingMatches[0]
      ? { completed: u.coachingMatches[0].sessionsCompleted, scheduled: u.coachingMatches[0].sessionsScheduled }
      : null,
    goalCount: u.developmentGoals.length,
    goalsCompleted: u.developmentGoals.filter((g) => g.status === "COMPLETED").length,
    avgGoalProgress: u.developmentGoals.length > 0
      ? Math.round(u.developmentGoals.reduce((s, g) => s + g.progress, 0) / u.developmentGoals.length)
      : 0,
  }));

  return Response.json({ users: formatted });
});
