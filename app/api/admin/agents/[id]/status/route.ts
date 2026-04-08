import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const { status, notes } = await req.json();

  const validStatuses = ["APPLIED", "VETTING", "APPROVED", "SUSPENDED", "DEACTIVATED"];
  if (!validStatuses.includes(status)) {
    return new Response("Invalid status", { status: 400 });
  }

  await prisma.salesAgent.update({
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
  });

  return Response.json({ ok: true });
}
