import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import AgentOpportunityList from "./AgentOpportunityList";

export default async function AgentOpportunitiesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "CONSULTANT") redirect("/dashboard");

  const opportunities = await prisma.agentOpportunity.findMany({
    where: { status: "OPEN" },
    select: {
      id: true,
      title: true,
      description: true,
      clientName: true,
      commissionType: true,
      commissionValue: true,
      commissionCurrency: true,
      territories: true,
      targetIndustries: true,
      productType: true,
      startDate: true,
      endDate: true,
      _count: { select: { assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Check if this consultant already has a SalesAgent profile
  const existingAgent = await prisma.salesAgent.findFirst({
    where: {
      OR: [
        { userId: session.user.id },
        { email: session.user.email! },
      ],
    },
    select: { id: true, status: true },
  });

  // Check which opportunities the agent has already applied to
  const appliedIds = existingAgent
    ? (
        await prisma.agentOpportunityAssignment.findMany({
          where: { agentId: existingAgent.id },
          select: { opportunityId: true },
        })
      ).map((a) => a.opportunityId)
    : [];

  const serialized = opportunities.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description.length > 200 ? o.description.slice(0, 200) + "..." : o.description,
    clientName: o.clientName,
    commissionType: o.commissionType,
    commissionValue: Number(o.commissionValue),
    commissionCurrency: o.commissionCurrency as "NGN" | "USD",
    territories: o.territories,
    targetIndustries: o.targetIndustries,
    productType: o.productType,
    agentCount: o._count.assignments,
    startDate: o.startDate.toISOString(),
    endDate: o.endDate?.toISOString() ?? null,
    hasApplied: appliedIds.includes(o.id),
  }));

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Agent Opportunities"
        subtitle="Refer clients and earn commissions"
      />
      <AgentOpportunityList
        opportunities={serialized}
        hasAgentProfile={!!existingAgent}
        agentStatus={existingAgent?.status ?? null}
      />
    </div>
  );
}
