import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalCoaches,
    appliedCount,
    underReviewCount,
    interviewScheduledCount,
    approvedCount,
    rejectedCount,
    activeMatchCount,
    completedEngagementCount,
    allCoachRatings,
    sessionsThisMonth,
    revenueThisMonth,
    topCoaches,
    allCoachUtilisation,
  ] = await Promise.all([
    prisma.maarovaCoach.count(),
    prisma.maarovaCoach.count({ where: { vettingStatus: "APPLIED" } }),
    prisma.maarovaCoach.count({ where: { vettingStatus: "UNDER_REVIEW" } }),
    prisma.maarovaCoach.count({ where: { vettingStatus: "INTERVIEW_SCHEDULED" } }),
    prisma.maarovaCoach.count({ where: { vettingStatus: "APPROVED" } }),
    prisma.maarovaCoach.count({ where: { vettingStatus: "REJECTED" } }),
    prisma.maarovaCoachingMatch.count({ where: { status: "ACTIVE" } }),
    prisma.maarovaCoachingMatch.count({ where: { status: "COMPLETED" } }),
    prisma.maarovaCoach.aggregate({
      _avg: { avgSessionRating: true },
      where: { avgSessionRating: { not: null } },
    }),
    prisma.maarovaCoachingSession.count({
      where: { scheduledAt: { gte: startOfMonth } },
    }),
    prisma.maarovaCoachingInvoice.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", paidAt: { gte: startOfMonth } },
    }),
    prisma.maarovaCoach.findMany({
      where: { avgSessionRating: { not: null }, isActive: true },
      orderBy: { avgSessionRating: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        avgSessionRating: true,
        totalSessions: true,
        completedEngagements: true,
      },
    }),
    prisma.maarovaCoach.aggregate({
      _avg: { activeClients: true, maxClients: true },
      where: { isActive: true, vettingStatus: "APPROVED" },
    }),
  ]);

  const avgRating = allCoachRatings._avg.avgSessionRating
    ? Number(allCoachRatings._avg.avgSessionRating)
    : null;

  const avgActive = allCoachUtilisation._avg.activeClients ?? 0;
  const avgMax = allCoachUtilisation._avg.maxClients ?? 1;
  const utilisationRate = avgMax > 0 ? Math.round((Number(avgActive) / Number(avgMax)) * 100) : 0;

  return Response.json({
    totalCoaches,
    vettingBreakdown: {
      applied: appliedCount,
      underReview: underReviewCount,
      interviewScheduled: interviewScheduledCount,
      approved: approvedCount,
      rejected: rejectedCount,
    },
    activeMatches: activeMatchCount,
    completedEngagements: completedEngagementCount,
    avgSessionRating: avgRating,
    sessionsThisMonth,
    revenueThisMonth: revenueThisMonth._sum.amount
      ? Number(revenueThisMonth._sum.amount)
      : 0,
    topCoaches: topCoaches.map((c) => ({
      id: c.id,
      name: c.name,
      avatarUrl: c.avatarUrl,
      avgSessionRating: c.avgSessionRating ? Number(c.avgSessionRating) : null,
      totalSessions: c.totalSessions,
      completedEngagements: c.completedEngagements,
    })),
    coachUtilisationRate: utilisationRate,
  });
}
