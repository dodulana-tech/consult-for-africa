import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { notes } = body as { notes?: string };

  const deal = await prisma.agentDeal.findUnique({
    where: { id },
    select: { id: true, stage: true, verifiedAt: true },
  });

  if (!deal) {
    return Response.json({ error: "Deal not found" }, { status: 404 });
  }

  if (deal.stage !== "CLOSED_WON") {
    return Response.json(
      { error: "Only closed (won) deals can be verified" },
      { status: 400 }
    );
  }

  if (deal.verifiedAt) {
    return Response.json(
      { error: "Deal is already verified" },
      { status: 400 }
    );
  }

  const updated = await prisma.agentDeal.update({
    where: { id },
    data: {
      verifiedAt: new Date(),
      verifiedById: session.user.id,
      verificationNotes: notes || null,
    },
  });

  return Response.json({ ok: true, verifiedAt: updated.verifiedAt });
});
