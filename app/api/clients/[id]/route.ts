import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const MANAGEMENT = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];

export const PATCH = handler(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!MANAGEMENT.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const client = await prisma.client.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!client) return Response.json({ error: "Client not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) updateData.name = body.name.trim();
  if (body.primaryContact !== undefined) updateData.primaryContact = body.primaryContact.trim();
  if (body.email !== undefined) updateData.email = body.email.trim();
  if (body.phone !== undefined) updateData.phone = body.phone.trim();
  if (body.address !== undefined) updateData.address = body.address.trim();
  if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
  if (body.paymentTerms !== undefined) {
    const terms = parseInt(String(body.paymentTerms), 10);
    if (!isNaN(terms) && terms > 0) updateData.paymentTerms = terms;
  }
  if (body.currency !== undefined) {
    if (["NGN", "USD"].includes(body.currency)) updateData.currency = body.currency;
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.client.update({
    where: { id },
    data: updateData,
    select: {
      id: true, name: true, primaryContact: true, email: true, phone: true,
      address: true, paymentTerms: true, currency: true, notes: true,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Client",
    entityId: id,
    entityName: client.name,
    details: { fields: Object.keys(updateData) },
  });

  return Response.json({ client: updated });
});
