import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

const ALLOWED_ROLES = ["DIRECTOR", "PARTNER", "ADMIN"];

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function sortByPriorityThenDate<T extends { priority: string; dueDate?: Date | null }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const pd = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
    if (pd !== 0) return pd;
    if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });
}

export const GET = handler(async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) return new Response("Forbidden", { status: 403 });

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
  });

  if (!profile) return new Response("Profile not found. Run setup first.", { status: 404 });

  const now = new Date();

  const [allTasks, upcomingMilestones, achievedMilestones] = await Promise.all([
    prisma.founderTask.findMany({
      where: { founderId: profile.id },
    }),
    prisma.founderMilestone.findMany({
      where: {
        founderId: profile.id,
        status: "pending",
        targetDate: { gte: now },
      },
      orderBy: { targetDate: "asc" },
      take: 5,
    }),
    prisma.founderMilestone.findMany({
      where: { founderId: profile.id, status: "achieved" },
      orderBy: { achievedAt: "desc" },
      take: 10,
    }),
  ]);

  const daysInBusiness = Math.floor(
    (now.getTime() - profile.startDate.getTime()) / 86400000
  );

  const phaseProgressMap: Record<string, number> = {
    Phase0_Foundation: 100,
    Phase1_MVP: 63,
  };

  const phaseProgress = {
    percent: phaseProgressMap[profile.currentPhase] ?? 0,
    weekNumber: 5,
    totalWeeks: 8,
  };

  const nonCompletedTasks = allTasks.filter((t) => t.status !== "completed");
  const sorted = sortByPriorityThenDate(nonCompletedTasks);
  const todaysPriority = sorted[0] ?? null;

  const thisWeekTasks = sortByPriorityThenDate(
    allTasks.filter(
      (t) => t.status !== "completed" && t.week === 5 && t.phase === "Phase1_MVP"
    )
  );

  const taskStats = {
    total: allTasks.length,
    completed: allTasks.filter((t) => t.status === "completed").length,
    inProgress: allTasks.filter((t) => t.status === "in_progress").length,
    pending: allTasks.filter((t) => t.status === "pending").length,
  };

  const launchDate = new Date("2026-04-13");
  const daysToLaunch = Math.ceil((launchDate.getTime() - now.getTime()) / 86400000);

  const quickStats = {
    consultants: 12,
    revenue: 0,
    revenueTarget: 150000,
    projects: 0,
    projectsTarget: 3,
    daysToLaunch,
  };

  return Response.json({
    daysInBusiness,
    currentPhase: profile.currentPhase,
    phaseProgress,
    todaysPriority,
    thisWeekTasks,
    upcomingMilestones,
    achievedMilestones,
    taskStats,
    quickStats,
  });
});
