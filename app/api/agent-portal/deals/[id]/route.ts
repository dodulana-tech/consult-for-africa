import { prisma } from "@/lib/prisma";
import { getAgentSession } from "@/lib/agentPortalAuth";
import { createCommissionForDeal } from "@/lib/agentCommission";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAgentSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const deal = await prisma.agentDeal.findUnique({
    where: { id },
    select: { agentId: true, stage: true, stageHistory: true },
  });

  if (!deal || deal.agentId !== session.sub) {
    return new Response("Not found", { status: 404 });
  }

  const { stage, dealValue, closedValue, proofDocUrl, notes, prospectName, prospectOrg, prospectEmail, prospectPhone } = body;

  // Build stage history if stage changed
  let stageHistory = (deal.stageHistory as Array<{ stage: string; changedAt: string; notes?: string }>) ?? [];
  if (stage && stage !== deal.stage) {
    stageHistory = [...stageHistory, {
      stage,
      changedAt: new Date().toISOString(),
      notes: notes || undefined,
    }];
  }

  const updated = await prisma.agentDeal.update({
    where: { id },
    data: {
      ...(stage ? { stage } : {}),
      ...(stage ? { stageHistory } : {}),
      ...(stage === "CLOSED_WON" ? { closedAt: new Date(), closedValue: closedValue ?? dealValue } : {}),
      ...(dealValue !== undefined ? { dealValue: parseFloat(dealValue) } : {}),
      ...(closedValue !== undefined ? { closedValue: parseFloat(closedValue) } : {}),
      ...(proofDocUrl ? { proofDocUrl } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(prospectName ? { prospectName } : {}),
      ...(prospectOrg !== undefined ? { prospectOrg } : {}),
      ...(prospectEmail !== undefined ? { prospectEmail } : {}),
      ...(prospectPhone !== undefined ? { prospectPhone } : {}),
    },
  });

  // Auto-create commission when deal closes
  if (stage === "CLOSED_WON") {
    await createCommissionForDeal(id);

    // Update agent stats
    const wonDeals = await prisma.agentDeal.count({
      where: { agentId: session.sub, stage: "CLOSED_WON" },
    });
    const revenue = await prisma.agentDeal.aggregate({
      where: { agentId: session.sub, stage: "CLOSED_WON" },
      _sum: { closedValue: true },
    });
    const commissions = await prisma.agentCommission.aggregate({
      where: { agentId: session.sub },
      _sum: { amount: true },
    });

    await prisma.salesAgent.update({
      where: { id: session.sub },
      data: {
        totalDeals: wonDeals,
        totalRevenue: revenue._sum.closedValue ?? 0,
        totalCommission: commissions._sum.amount ?? 0,
      },
    });
  }

  return Response.json(updated);
}
