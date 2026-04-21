import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emailAgentCommissionApproved } from "@/lib/email";
import { handler } from "@/lib/api-handler";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["VERIFIED", "APPROVED", "CANCELLED"],
  VERIFIED: ["APPROVED", "CANCELLED"],
  APPROVED: ["CANCELLED"],
  DISPUTED: ["PENDING", "CANCELLED"],
};

export const PATCH = handler(async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { status, notes } = body as { status: string; notes?: string };

  if (!status) {
    return Response.json({ error: "Status is required" }, { status: 400 });
  }

  const commission = await prisma.agentCommission.findUnique({
    where: { id },
    include: {
      deal: {
        select: {
          id: true,
          verifiedAt: true,
          verifiedById: true,
          stage: true,
        },
      },
    },
  });

  if (!commission) {
    return Response.json({ error: "Commission not found" }, { status: 404 });
  }

  // Validate transition
  const allowed = VALID_TRANSITIONS[commission.status];
  if (!allowed || !allowed.includes(status)) {
    return Response.json(
      {
        error: `Cannot transition commission from ${commission.status} to ${status}`,
      },
      { status: 400 }
    );
  }

  // Block approval unless the deal has been verified by admin
  if (status === "APPROVED" && !commission.deal.verifiedAt) {
    return Response.json(
      {
        error:
          "Deal must be verified before commission can be approved. Verify the deal first.",
      },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = { status };

  if (notes !== undefined) data.notes = notes;

  if (status === "VERIFIED") {
    data.verifiedAt = new Date();
  }

  if (status === "APPROVED") {
    data.approvedAt = new Date();
    data.approvedById = session.user.id;
  }

  const updated = await prisma.agentCommission.update({
    where: { id },
    data,
    include: {
      deal: {
        select: { dealCode: true, prospectName: true, prospectOrg: true },
      },
      agent: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });

  if (status === "APPROVED") {
    emailAgentCommissionApproved({
      email: updated.agent.email,
      name: `${updated.agent.firstName} ${updated.agent.lastName}`,
      amount: Number(updated.amount).toLocaleString(),
    }).catch((err) => console.error("[email] commission approved notification failed:", err));
  }

  return Response.json(updated);
});
