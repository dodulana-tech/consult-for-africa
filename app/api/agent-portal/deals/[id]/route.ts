import { prisma } from "@/lib/prisma";
import { getAgentSession } from "@/lib/agentPortalAuth";
import { createCommissionForDeal } from "@/lib/agentCommission";
import { emailAgentDealClosed } from "@/lib/email";
import { handler } from "@/lib/api-handler";

/** Ordered pipeline stages for validation */
const STAGE_ORDER = [
  "PROSPECT",
  "CONTACTED",
  "PITCHED",
  "NEGOTIATING",
  "VERBAL_COMMIT",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;

function isValidTransition(from: string, to: string): boolean {
  // Any stage can move to DISQUALIFIED
  if (to === "DISQUALIFIED") return true;

  // Terminal stages cannot transition further
  if (["CLOSED_WON", "CLOSED_LOST", "DISQUALIFIED"].includes(from)) return false;

  const fromIdx = STAGE_ORDER.indexOf(from as (typeof STAGE_ORDER)[number]);
  const toIdx = STAGE_ORDER.indexOf(to as (typeof STAGE_ORDER)[number]);

  if (fromIdx === -1 || toIdx === -1) return false;

  // Can only advance exactly one step (or move to CLOSED_LOST from VERBAL_COMMIT)
  if (to === "CLOSED_LOST") {
    return from === "VERBAL_COMMIT";
  }

  return toIdx === fromIdx + 1;
}

export const PATCH = handler(async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  // Validate stage transition
  if (stage && stage !== deal.stage) {
    if (!isValidTransition(deal.stage, stage)) {
      return Response.json(
        { error: `Invalid stage transition from ${deal.stage.replace(/_/g, " ")} to ${stage.replace(/_/g, " ")}. Stages must progress sequentially.` },
        { status: 400 }
      );
    }
  }

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

    // Send deal closed email notification
    const agent = await prisma.salesAgent.findUnique({
      where: { id: session.sub },
      select: { email: true, firstName: true, lastName: true },
    });
    const latestCommission = await prisma.agentCommission.findFirst({
      where: { dealId: id },
      select: { amount: true },
      orderBy: { createdAt: "desc" },
    });
    if (agent) {
      emailAgentDealClosed({
        email: agent.email,
        name: `${agent.firstName} ${agent.lastName}`,
        dealTitle: updated.prospectName ?? id,
        commissionAmount: latestCommission
          ? Number(latestCommission.amount).toLocaleString()
          : "0",
      }).catch((err) => console.error("[email] deal closed notification failed:", err));
    }
  }

  return Response.json(updated);
});
