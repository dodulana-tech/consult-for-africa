import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { status, paymentRef, paymentMethod, notes } = body;

  const payout = await prisma.agentPayout.findUnique({
    where: { id },
    include: { commissions: true },
  });

  if (!payout) {
    return Response.json({ error: "Payout not found" }, { status: 404 });
  }

  // Validate transitions
  const validTransitions: Record<string, string[]> = {
    PENDING: ["PROCESSING"],
    PROCESSING: ["PAID", "PENDING"],
  };

  if (status && !(validTransitions[payout.status]?.includes(status))) {
    return Response.json(
      { error: `Cannot transition from ${payout.status} to ${status}` },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = {};

  if (status) data.status = status;
  if (paymentRef !== undefined) data.paymentRef = paymentRef;
  if (paymentMethod !== undefined) data.paymentMethod = paymentMethod;
  if (notes !== undefined) data.notes = notes;

  if (status === "PROCESSING") {
    data.processedById = session.user.id;
    data.processedAt = new Date();
  }

  if (status === "PAID") {
    data.confirmedAt = new Date();

    // Update all linked commissions to PAID
    await prisma.agentCommission.updateMany({
      where: { payoutId: id },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });
  }

  const updated = await prisma.agentPayout.update({
    where: { id },
    data,
    include: {
      agent: {
        select: {
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
          deal: { select: { dealCode: true, prospectName: true } },
        },
      },
    },
  });

  return Response.json(updated);
}
