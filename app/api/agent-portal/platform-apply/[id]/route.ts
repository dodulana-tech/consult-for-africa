import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Find the SalesAgent linked to this user
  const agent = await prisma.salesAgent.findFirst({
    where: {
      OR: [
        { userId: session.user.id },
        { email: session.user.email! },
      ],
    },
    select: { id: true, status: true },
  });

  if (!agent || agent.status !== "APPROVED") {
    return NextResponse.json(
      { error: "You need an approved agent profile to apply." },
      { status: 403 }
    );
  }

  // Check opportunity is open
  const opp = await prisma.agentOpportunity.findUnique({
    where: { id },
    select: {
      status: true,
      maxAgents: true,
      _count: { select: { assignments: true } },
    },
  });

  if (!opp || !["OPEN", "ASSIGNED"].includes(opp.status)) {
    return NextResponse.json(
      { error: "This opportunity is not accepting applications." },
      { status: 400 }
    );
  }

  if (opp.maxAgents && opp._count.assignments >= opp.maxAgents) {
    return NextResponse.json(
      { error: "This opportunity has reached its agent limit." },
      { status: 400 }
    );
  }

  // Check not already applied
  const existing = await prisma.agentOpportunityAssignment.findUnique({
    where: {
      opportunityId_agentId: { opportunityId: id, agentId: agent.id },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You have already applied." },
      { status: 409 }
    );
  }

  const assignment = await prisma.agentOpportunityAssignment.create({
    data: {
      opportunityId: id,
      agentId: agent.id,
      status: "APPLIED",
    },
  });

  return NextResponse.json(assignment);
}
