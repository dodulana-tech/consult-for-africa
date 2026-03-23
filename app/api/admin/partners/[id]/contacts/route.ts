import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "DIRECTOR"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return new Response("Forbidden", { status: 403 });

  const { id: partnerId } = await params;
  const body = await req.json();
  const { name, email, title, phone, isPrimary } = body;

  if (!name?.trim() || !email?.trim()) {
    return new Response("name and email are required", { status: 400 });
  }

  // Check partner exists
  const partner = await prisma.partnerFirm.findUnique({
    where: { id: partnerId },
    select: { id: true, name: true },
  });
  if (!partner) return new Response("Partner not found", { status: 404 });

  // Check email uniqueness
  const existing = await prisma.partnerContact.findUnique({
    where: { email: email.trim() },
  });
  if (existing) return new Response("Email already in use", { status: 409 });

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
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return new Response("Forbidden", { status: 403 });

  const { id: partnerId } = await params;
  const body = await req.json();
  const { contactId, name, email, title, phone, isPrimary } = body;

  if (!contactId) return new Response("contactId required", { status: 400 });

  const existing = await prisma.partnerContact.findFirst({
    where: { id: contactId, partnerId },
  });
  if (!existing) return new Response("Contact not found", { status: 404 });

  // If email changed, check uniqueness
  if (email?.trim() && email.trim() !== existing.email) {
    const dup = await prisma.partnerContact.findUnique({
      where: { email: email.trim() },
    });
    if (dup) return new Response("Email already in use", { status: 409 });
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
}
