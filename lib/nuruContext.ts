import { prisma } from "@/lib/prisma";

/**
 * Build a context string for Nuru that includes platform intelligence.
 * All Nuru AI endpoints should call this to get smarter over time.
 */
export async function getNuruContext(): Promise<string> {
  try {
    // Get latest pricing intelligence
    const pricingIntel = await prisma.pricingIntelligence.findFirst({
      orderBy: { computedAt: "desc" },
    });

    // Get platform stats
    const [projectCount, consultantCount, clientCount, deliverableCount, paidEntryCount] = await Promise.all([
      prisma.engagement.count({ where: { status: { in: ["ACTIVE", "COMPLETED"] } } }),
      prisma.consultantProfile.count(),
      prisma.client.count({ where: { status: "ACTIVE" } }),
      prisma.deliverable.count({ where: { status: { in: ["APPROVED", "DELIVERED_TO_CLIENT"] } } }),
      prisma.timeEntry.count({ where: { status: "PAID" } }),
    ]);

    // Get recent successful patterns
    const recentProjects = await prisma.engagement.findMany({
      where: { status: { in: ["ACTIVE", "COMPLETED"] } },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        serviceType: true,
        budgetSensitivity: true,
        client: { select: { type: true } },
      },
    });

    const serviceTypeDistribution = recentProjects.reduce((acc, p) => {
      acc[p.serviceType] = (acc[p.serviceType] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const clientTypeDistribution = recentProjects.reduce((acc, p) => {
      acc[p.client.type] = (acc[p.client.type] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let context = `\nCFA PLATFORM INTELLIGENCE (live data):
- Active projects: ${projectCount}
- Consultant network: ${consultantCount}
- Active clients: ${clientCount}
- Deliverables completed: ${deliverableCount}
- Payments processed: ${paidEntryCount}
- Common service lines: ${Object.entries(serviceTypeDistribution).map(([k, v]) => `${k.replace(/_/g, " ")} (${v})`).join(", ") || "N/A"}
- Client type mix: ${Object.entries(clientTypeDistribution).map(([k, v]) => `${k.replace(/_/g, " ")} (${v})`).join(", ") || "N/A"}`;

    if (pricingIntel && pricingIntel.dataPoints > 0) {
      context += `\nHistorical pricing data (${pricingIntel.dataPoints} data points): ${JSON.stringify(pricingIntel.stats).substring(0, 500)}`;
    }

    return context;
  } catch {
    return "\nCFA Platform: no historical data available yet.";
  }
}
