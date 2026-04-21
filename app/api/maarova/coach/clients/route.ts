import { getMaarovaCoachSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

/**
 * GET /api/maarova/coach/clients
 * List active coaching matches for the authenticated coach.
 */
export const GET = handler(async function GET() {
  const session = await getMaarovaCoachSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matches = await prisma.maarovaCoachingMatch.findMany({
    where: {
      coachId: session.sub,
      status: { in: ["PENDING_MATCH", "MATCHED", "ACTIVE"] },
    },
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
        orderBy: { scheduledAt: "desc" },
        take: 1,
        select: { scheduledAt: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get goal counts per user
  const userIds = matches.map((m) => m.userId);
  const goalCounts = await prisma.maarovaDevelopmentGoal.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds } },
    _count: true,
  });
  const goalMap = new Map(goalCounts.map((g) => [g.userId, g._count]));

  const clients = matches.map((m) => ({
    matchId: m.id,
    status: m.status,
    programme: m.programme,
    sessionsCompleted: m.sessionsCompleted,
    sessionsScheduled: m.sessionsScheduled,
    startDate: m.startDate,
    user: {
      id: m.user.id,
      name: m.user.name,
      title: m.user.title,
      department: m.user.department,
      organisation: m.user.organisation.name,
    },
    nextSession: m.sessions[0]?.status === "SCHEDULED" ? m.sessions[0].scheduledAt : null,
    goalCount: goalMap.get(m.userId) ?? 0,
  }));

  return Response.json({ clients });
});
