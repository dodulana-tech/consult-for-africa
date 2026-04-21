import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

/**
 * GET /api/maarova/manager/reports
 * List direct reports with goal summary. Auth: MANAGER or HR_ADMIN.
 */
export const GET = handler(async function GET() {
  const session = await getMaarovaSession();
  if (!session || !["MANAGER", "HR_ADMIN"].includes(session.role)) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const reports = await prisma.maarovaUser.findMany({
    where: { managerId: session.sub, organisationId: session.organisationId },
    select: {
      id: true,
      name: true,
      email: true,
      title: true,
      department: true,
      lastLoginAt: true,
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true },
      },
      coachingMatches: {
        where: { status: { in: ["PENDING_MATCH", "MATCHED", "ACTIVE"] } },
        take: 1,
        select: { status: true, sessionsCompleted: true, sessionsScheduled: true },
      },
      developmentGoals: {
        select: { id: true, title: true, dimension: true, status: true, progress: true, managerValidated: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const formatted = reports.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    title: r.title,
    department: r.department,
    assessmentStatus: r.sessions[0]?.status ?? "NOT_STARTED",
    coachingStatus: r.coachingMatches[0]?.status ?? null,
    goalCount: r.developmentGoals.length,
    goalsCompleted: r.developmentGoals.filter((g) => g.status === "COMPLETED").length,
    goalsValidated: r.developmentGoals.filter((g) => g.managerValidated).length,
    avgGoalProgress: r.developmentGoals.length > 0
      ? Math.round(r.developmentGoals.reduce((s, g) => s + g.progress, 0) / r.developmentGoals.length)
      : 0,
  }));

  return Response.json({ reports: formatted });
});
