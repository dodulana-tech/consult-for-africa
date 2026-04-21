import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "DIRECTOR"];

export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id: partnerId } = await params;
  const body = await req.json();
  const { name, email, title, phone, isPrimary } = body;

  if (!name?.trim() || !email?.trim()) {
    return Response.json({ error: "name and email are required" }, { status: 400 });
  }

  // Check partner exists
  const partner = await prisma.partnerFirm.findUnique({
    where: { id: partnerId },
    select: { id: true, name: true },
  });
  if (!partner) return Response.json({ error: "Partner not found" }, { status: 404 });

  // Check email uniqueness
  const existing = await prisma.partnerContact.findUnique({
    where: { email: email.trim() },
  });
  if (existing) return Response.json({ error: "Email already in use" }, { status: 409 });

  // If marking as primary, unmark others
  if (isPrimary) {
    await prisma.partnerContact.updateMany({
      where: { partnerId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.partnerContact.create({
    data: {
      partnerId,
      name: name.trim(),
      email: email.trim(),
      title: title?.trim() || null,
      phone: phone?.trim() || null,
      isPrimary: isPrimary ?? false,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "PartnerContact",
    entityId: contact.id,
    entityName: contact.name,
    details: { partnerId, partnerName: partner.name },
  });

  return Response.json({
    ok: true,
    contact: {
      ...contact,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
      lastLoginAt: null,
      passwordHash: undefined,
      resetToken: undefined,
      resetTokenExpiry: undefined,
    },
  }, { status: 201 });
});

export const PATCH = handler(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id: partnerId } = await params;
  const body = await req.json();
  const { contactId, name, email, title, phone, isPrimary } = body;

  if (!contactId) return Response.json({ error: "contactId required" }, { status: 400 });

  const existing = await prisma.partnerContact.findFirst({
    where: { id: contactId, partnerId },
  });
  if (!existing) return Response.json({ error: "Contact not found" }, { status: 404 });

  // If email changed, check uniqueness
  if (email?.trim() && email.trim() !== existing.email) {
    const dup = await prisma.partnerContact.findUnique({
      where: { email: email.trim() },
    });
    if (dup) return Response.json({ error: "Email already in use" }, { status: 409 });
  }

  // If marking as primary, unmark others
  if (isPrimary && !existing.isPrimary) {
    await prisma.partnerContact.updateMany({
      where: { partnerId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const updateData: Record<string, unknown> = {};
  if (name?.trim()) updateData.name = name.trim();
  if (email?.trim()) updateData.email = email.trim();
  if (title !== undefined) updateData.title = title?.trim() || null;
  if (phone !== undefined) updateData.phone = phone?.trim() || null;
  if (isPrimary !== undefined) updateData.isPrimary = isPrimary;

  const contact = await prisma.partnerContact.update({
    where: { id: contactId },
    data: updateData,
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "PartnerContact",
    entityId: contact.id,
    entityName: contact.name,
    details: { fields: Object.keys(updateData) },
  });

  return Response.json({
    ok: true,
    contact: {
      ...contact,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
      lastLoginAt: contact.lastLoginAt?.toISOString() ?? null,
      passwordHash: undefined,
      resetToken: undefined,
      resetTokenExpiry: undefined,
    },
  });
});

export const DELETE = handler(async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id: partnerId } = await params;
  const body = await req.json();
  const { contactId } = body;

  if (!contactId) return Response.json({ error: "contactId required" }, { status: 400 });

  const existing = await prisma.partnerContact.findFirst({
    where: { id: contactId, partnerId },
  });
  if (!existing) return Response.json({ error: "Contact not found" }, { status: 404 });

  await prisma.partnerContact.delete({
    where: { id: contactId },
  });

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "PartnerContact",
    entityId: contactId,
    entityName: existing.name,
    details: { partnerId },
  });

  return Response.json({ ok: true });
});
