import { getAgentSession } from "@/lib/agentPortalAuth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAgentSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const assignment = await prisma.agentOpportunityAssignment.findFirst({
    where: {
      opportunityId: id,
      agentId: session.sub,
    },
  });

  if (!assignment) {
    return Response.json({ error: "Assignment not found" }, { status: 404 });
  }

  // Only allow withdrawal from APPLIED or ACTIVE status
  if (!["APPLIED", "ACTIVE"].includes(assignment.status)) {
    return Response.json(
      { error: "Cannot withdraw from this assignment" },
      { status: 400 }
    );
  }

  await prisma.agentOpportunityAssignment.delete({
    where: { id: assignment.id },
  });

  return Response.json({ ok: true });
});
