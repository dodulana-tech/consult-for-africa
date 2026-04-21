import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

/**
 * GET /api/ai/pricing-intelligence
 * Returns aggregated pricing stats from historical platform data.
 * Used by Nuru to make informed pricing suggestions.
 *
 * POST /api/ai/pricing-intelligence
 * Recomputes pricing stats from all deliverables and time entries.
 */
export const GET = handler(async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const latest = await prisma.pricingIntelligence.findFirst({
    orderBy: { computedAt: "desc" },
  });

  if (!latest) {
    return Response.json({ stats: null, message: "No pricing data computed yet. Run POST to compute." });
  }

  return Response.json({ stats: latest.stats, computedAt: latest.computedAt, dataPoints: latest.dataPoints });
});

export const POST = handler(async function POST() {
  const session = await auth();
  if (!session || !["PARTNER", "ADMIN"].includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Aggregate from deliverables with fees
  const deliverables = await prisma.deliverable.findMany({
    where: { fee: { not: null } },
    select: {
      name: true,
      fee: true,
      feeCurrency: true,
      status: true,
      assignment: {
        select: {
          rateType: true,
          rateAmount: true,
          rateCurrency: true,
          consultant: {
            select: {
              consultantProfile: { select: { tier: true } },
            },
          },
        },
      },
      engagement: {
        select: {
          serviceType: true,
          budgetSensitivity: true,
          client: { select: { type: true } },
        },
      },
    },
  });

  // Aggregate from paid time entries
  const paidEntries = await prisma.timeEntry.findMany({
    where: { status: "PAID", billableAmount: { not: null } },
    select: {
      hours: true,
      billableAmount: true,
      currency: true,
      assignment: {
        select: {
          rateType: true,
          rateAmount: true,
          engagement: {
            select: {
              serviceType: true,
              budgetSensitivity: true,
              client: { select: { type: true } },
            },
          },
          consultant: {
            select: {
              consultantProfile: { select: { tier: true } },
            },
          },
        },
      },
    },
  });

  // Compute stats
  const deliverableStats: Record<string, { totalFee: number; count: number; tiers: Record<string, number> }> = {};
  for (const d of deliverables) {
    const serviceType = d.engagement.serviceType;
    if (!deliverableStats[serviceType]) {
      deliverableStats[serviceType] = { totalFee: 0, count: 0, tiers: {} };
    }
    deliverableStats[serviceType].totalFee += Number(d.fee);
    deliverableStats[serviceType].count++;
    const tier = d.assignment?.consultant?.consultantProfile?.tier ?? "UNKNOWN";
    deliverableStats[serviceType].tiers[tier] = (deliverableStats[serviceType].tiers[tier] ?? 0) + 1;
  }

  const ratesByTier: Record<string, { totalAmount: number; totalHours: number; count: number }> = {};
  for (const e of paidEntries) {
    const tier = e.assignment.consultant?.consultantProfile?.tier ?? "UNKNOWN";
    if (!ratesByTier[tier]) {
      ratesByTier[tier] = { totalAmount: 0, totalHours: 0, count: 0 };
    }
    ratesByTier[tier].totalAmount += Number(e.billableAmount);
    ratesByTier[tier].totalHours += Number(e.hours);
    ratesByTier[tier].count++;
  }

  const clientTypeStats: Record<string, { totalSpend: number; count: number }> = {};
  for (const e of paidEntries) {
    const clientType = e.assignment.engagement.client.type;
    if (!clientTypeStats[clientType]) {
      clientTypeStats[clientType] = { totalSpend: 0, count: 0 };
    }
    clientTypeStats[clientType].totalSpend += Number(e.billableAmount);
    clientTypeStats[clientType].count++;
  }

  const stats = {
    deliverablesByServiceType: Object.entries(deliverableStats).map(([serviceType, data]) => ({
      serviceType,
      avgFee: data.count > 0 ? Math.round(data.totalFee / data.count) : 0,
      count: data.count,
      tiers: data.tiers,
    })),
    ratesByTier: Object.entries(ratesByTier).map(([tier, data]) => ({
      tier,
      avgAmount: data.count > 0 ? Math.round(data.totalAmount / data.count) : 0,
      avgHours: data.totalHours > 0 ? Math.round((data.totalHours / data.count) * 10) / 10 : 0,
      effectiveHourlyRate: data.totalHours > 0 ? Math.round(data.totalAmount / data.totalHours) : 0,
      entries: data.count,
    })),
    clientTypeSpend: Object.entries(clientTypeStats).map(([clientType, data]) => ({
      clientType,
      avgSpend: data.count > 0 ? Math.round(data.totalSpend / data.count) : 0,
      entries: data.count,
    })),
    totalDeliverables: deliverables.length,
    totalPaidEntries: paidEntries.length,
  };

  // Save
  const record = await prisma.pricingIntelligence.create({
    data: {
      dataPoints: deliverables.length + paidEntries.length,
      stats: stats as unknown as import("@prisma/client/runtime/library").InputJsonValue,
    },
  });

  return Response.json({ stats, computedAt: record.computedAt, dataPoints: record.dataPoints });
});
