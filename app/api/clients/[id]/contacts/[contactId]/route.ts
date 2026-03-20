import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canDelete = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canDelete) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id, contactId } = await params;

  const contact = await prisma.clientContact.findFirst({
    where: { id: contactId, clientId: id },
  });

  if (!contact) return Response.json({ error: "Contact not found" }, { status: 404 });

  await prisma.clientContact.delete({ where: { id: contactId } });

  return Response.json({ ok: true });
}
