import { prisma } from "@/lib/prisma";
import { getAgentSession } from "@/lib/agentPortalAuth";
import { generateDealCode } from "@/lib/agentCodes";

export async function POST(req: Request) {
  const session = await getAgentSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { opportunityId, prospectName, prospectOrg, prospectEmail, prospectPhone, prospectTitle, dealValue, dealDescription } = body;

  if (!opportunityId || !prospectName?.trim()) {
    return Response.json({ error: "Opportunity and prospect name are required." }, { status: 400 });
  }

  // Verify the opportunity is still open
  const opportunity = await prisma.agentOpportunity.findUnique({
    where: { id: opportunityId },
    select: { status: true },
  });

  if (!opportunity) {
    return Response.json({ error: "Opportunity not found." }, { status: 404 });
  }

  if (opportunity.status !== "OPEN" && opportunity.status !== "ASSIGNED") {
    return Response.json(
      { error: `This opportunity is ${opportunity.status.toLowerCase()} and no longer accepting new deals.` },
      { status: 400 }
    );
  }

  // Verify agent is assigned to this opportunity
  const assignment = await prisma.agentOpportunityAssignment.findUnique({
    where: { opportunityId_agentId: { opportunityId, agentId: session.sub } },
  });

  if (!assignment || assignment.status !== "ACTIVE") {
    return Response.json({ error: "You are not active on this opportunity." }, { status: 403 });
  }

  const dealCode = await generateDealCode();

  const deal = await prisma.agentDeal.create({
    data: {
      dealCode,
      opportunityId,
      agentId: session.sub,
      prospectName: prospectName.trim(),
      prospectOrg: prospectOrg?.trim() || null,
      prospectEmail: prospectEmail?.trim() || null,
      prospectPhone: prospectPhone?.trim() || null,
      prospectTitle: prospectTitle?.trim() || null,
      dealValue: dealValue ? parseFloat(dealValue) : null,
      dealDescription: dealDescription?.trim() || null,
      stage: "PROSPECT",
      stageHistory: [{ stage: "PROSPECT", changedAt: new Date().toISOString(), notes: "Deal created" }],
    },
  });

  return Response.json(deal);
}
