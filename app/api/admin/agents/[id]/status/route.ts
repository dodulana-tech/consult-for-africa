import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emailAgentApproved } from "@/lib/email";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const PATCH = handler(async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { status, notes } = await req.json();

  const validStatuses = ["APPLIED", "VETTING", "APPROVED", "SUSPENDED", "DEACTIVATED"];
  if (!validStatuses.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const agent = await prisma.salesAgent.update({
    where: { id },
    data: {
      status,
      ...(status === "APPROVED" ? {
        vettedById: session.user.id,
        vettedAt: new Date(),
        isPortalEnabled: true,
      } : {}),
      ...(notes ? { vetNotes: notes } : {}),
    },
    select: { email: true, firstName: true, lastName: true },
  });

  if (status === "APPROVED") {
    emailAgentApproved({
      email: agent.email,
      name: `${agent.firstName} ${agent.lastName}`,
    }).catch((err) => console.error("[email] agent approved notification failed:", err));
  }

  return Response.json({ ok: true });
});
