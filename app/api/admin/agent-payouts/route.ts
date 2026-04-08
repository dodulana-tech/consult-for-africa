import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // PENDING, PROCESSING, PAID

  const payouts = await prisma.agentPayout.findMany({
    where: status ? { status } : undefined,
    include: {
      agent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          bankName: true,
          accountNumber: true,
          accountName: true,
        },
      },
      commissions: {
        include: {
          deal: { select: { dealCode: true, prospectName: true, prospectOrg: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(payouts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const body = await req.json();
  const { commissionIds } = body as { commissionIds: string[] };

  if (!commissionIds || commissionIds.length === 0) {
    return Response.json({ error: "No commission IDs provided" }, { status: 400 });
  }

  // Fetch commissions and validate they are all APPROVED and belong to same agent
  const commissions = await prisma.agentCommission.findMany({
    where: {
      id: { in: commissionIds },
      status: "APPROVED",
      payoutId: null,
    },
    include: {
      agent: {
        select: {
          id: true,
          bankName: true,
          accountNumber: true,
          accountName: true,
        },
      },
    },
  });

  if (commissions.length === 0) {
    return Response.json(
      { error: "No eligible commissions found. Commissions must be APPROVED and not already in a payout." },
      { status: 400 }
    );
  }

  // Group by agent
  const byAgent = new Map<string, typeof commissions>();
  for (const c of commissions) {
    const existing = byAgent.get(c.agentId) ?? [];
    existing.push(c);
    byAgent.set(c.agentId, existing);
  }

  const payouts: unknown[] = [];

  for (const [agentId, agentCommissions] of byAgent) {
    const totalAmount = agentCommissions.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );

    const agent = agentCommissions[0].agent;

    // Generate payout code
    const count = await prisma.agentPayout.count();
    const payoutCode = `PO-${String(count + 1 + payouts.length).padStart(5, "0")}`;

    const payout = await prisma.agentPayout.create({
      data: {
        payoutCode,
        agentId,
        totalAmount,
        bankName: agent.bankName,
        accountNumber: agent.accountNumber,
        accountName: agent.accountName,
        commissions: {
          connect: agentCommissions.map((c) => ({ id: c.id })),
        },
      },
      include: {
        agent: {
          select: { firstName: true, lastName: true, email: true },
        },
        commissions: true,
      },
    });

    // Update commission statuses to PROCESSING
    await prisma.agentCommission.updateMany({
      where: { id: { in: agentCommissions.map((c) => c.id) } },
      data: { status: "PROCESSING" },
    });

    payouts.push(payout);
  }

  return Response.json(payouts, { status: 201 });
}
