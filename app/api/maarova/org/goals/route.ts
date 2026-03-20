import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/maarova/org/goals
 * Aggregate org goals by dimension. Auth: HR_ADMIN only.
 */
export async function GET() {
  const session = await getMaarovaSession();
  if (!session || session.role !== "HR_ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const goals = await prisma.maarovaDevelopmentGoal.findMany({
    where: { user: { organisationId: session.organisationId } },
    select: {
      id: true,
      dimension: true,
      title: true,
      status: true,
      progress: true,
      source: true,
      managerValidated: true,
      createdAt: true,
      user: { select: { id: true, name: true, department: true } },
    },
    orderBy: [{ dimension: "asc" }, { createdAt: "desc" }],
  });

  // Aggregate by dimension
  const dimensionMap = new Map<string, { count: number; avgProgress: number; completed: number; totalProgress: number }>();
  for (const g of goals) {
    const existing = dimensionMap.get(g.dimension) ?? { count: 0, avgProgress: 0, completed: 0, totalProgress: 0 };
    existing.count++;
    existing.totalProgress += g.progress;
    if (g.status === "COMPLETED") existing.completed++;
    dimensionMap.set(g.dimension, existing);
  }

  const dimensions = Array.from(dimensionMap.entries()).map(([dimension, data]) => ({
    dimension,
    count: data.count,
    completed: data.completed,
    avgProgress: Math.round(data.totalProgress / data.count),
  }));

  return Response.json({ goals, dimensions });
}
