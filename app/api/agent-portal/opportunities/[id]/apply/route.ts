import { prisma } from "@/lib/prisma";
import { getAgentSession } from "@/lib/agentPortalAuth";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAgentSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Must be approved agent
  const agent = await prisma.salesAgent.findUnique({
    where: { id: session.sub },
    select: { status: true },
  });
  if (!agent || agent.status !== "APPROVED") {
    return Response.json({ error: "Your account must be approved to apply." }, { status: 403 });
  }

  // Check opportunity is open
  const opp = await prisma.agentOpportunity.findUnique({
    where: { id },
    select: { status: true, maxAgents: true, _count: { select: { assignments: true } } },
  });
  if (!opp || !["OPEN", "ASSIGNED"].includes(opp.status)) {
    return Response.json({ error: "This opportunity is not accepting applications." }, { status: 400 });
  }
  if (opp.maxAgents && opp._count.assignments >= opp.maxAgents) {
    return Response.json({ error: "This opportunity has reached its agent limit." }, { status: 400 });
  }

  // Check not already applied
  const existing = await prisma.agentOpportunityAssignment.findUnique({
    where: { opportunityId_agentId: { opportunityId: id, agentId: session.sub } },
  });
  if (existing) {
    return Response.json({ error: "You have already applied." }, { status: 409 });
  }

  const assignment = await prisma.agentOpportunityAssignment.create({
    data: {
      opportunityId: id,
      agentId: session.sub,
      status: "APPLIED",
    },
  });

  return Response.json(assignment);
});
