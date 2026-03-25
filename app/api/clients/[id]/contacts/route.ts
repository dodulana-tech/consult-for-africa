import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { emailContactAdded } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["DIRECTOR", "PARTNER", "ADMIN", "ENGAGEMENT_MANAGER"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id: clientId } = await params;

  // EMs can only manage contacts for clients they have engagements with
  if (session.user.role === "ENGAGEMENT_MANAGER") {
    const hasEngagement = await prisma.engagement.findFirst({
      where: { clientId, engagementManagerId: session.user.id },
      select: { id: true },
    });
    if (!hasEngagement) return new Response("Forbidden", { status: 403 });
  }

  const { name, email, title, phone, isPrimary } = await req.json();

  if (!name?.trim() || !email?.trim()) {
    return new Response("name and email are required", { status: 400 });
  }

  // Check for duplicate email within this client's contacts
  const normalizedEmail = email.trim().toLowerCase();
  const existingContact = await prisma.clientContact.findFirst({
    where: { clientId, email: normalizedEmail },
  });
  if (existingContact) {
    return new Response("A contact with this email already exists for this client.", { status: 409 });
  }

  // If marking as primary, unset others
  if (isPrimary) {
    await prisma.clientContact.updateMany({
      where: { clientId },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.clientContact.create({
    data: {
      clientId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      title: title?.trim() ?? null,
      phone: phone?.trim() ?? null,
      isPrimary: isPrimary ?? false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      title: true,
      phone: true,
      isPrimary: true,
      isPortalEnabled: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  // Send notification email to new contact
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { name: true } });
  if (client) {
    emailContactAdded({
      contactEmail: contact.email,
      contactName: contact.name,
      clientName: client.name,
    }).catch((err) => console.error("[email] contact added error:", err));
  }

  return Response.json(
    { ok: true, contact: { ...contact, lastLoginAt: contact.lastLoginAt?.toISOString() ?? null, createdAt: contact.createdAt.toISOString() } },
    { status: 201 }
  );
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["DIRECTOR", "PARTNER", "ADMIN", "ENGAGEMENT_MANAGER"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id: clientId } = await params;

  // EMs can only manage contacts for clients they have engagements with
  if (session.user.role === "ENGAGEMENT_MANAGER") {
    const hasEngagement = await prisma.engagement.findFirst({
      where: { clientId, engagementManagerId: session.user.id },
      select: { id: true },
    });
    if (!hasEngagement) return new Response("Forbidden", { status: 403 });
  }

  const { contactId, name, email, title, phone, isPrimary } = await req.json();

  if (!contactId) return new Response("contactId is required", { status: 400 });
  if (!name?.trim() || !email?.trim()) {
    return new Response("name and email are required", { status: 400 });
  }

  // Verify contact belongs to this client
  const existing = await prisma.clientContact.findFirst({
    where: { id: contactId, clientId },
  });
  if (!existing) return new Response("Contact not found", { status: 404 });

  // Check for duplicate email (excluding this contact)
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== existing.email) {
    const duplicate = await prisma.clientContact.findFirst({
      where: { clientId, email: normalizedEmail, id: { not: contactId } },
    });
    if (duplicate) {
      return new Response("A contact with this email already exists for this client.", { status: 409 });
    }
  }

  // If marking as primary, unset others
  if (isPrimary && !existing.isPrimary) {
    await prisma.clientContact.updateMany({
      where: { clientId, id: { not: contactId } },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.clientContact.update({
    where: { id: contactId },
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      title: title?.trim() || null,
      phone: phone?.trim() || null,
      isPrimary: isPrimary ?? existing.isPrimary,
    },
    select: {
      id: true,
      name: true,
      email: true,
      title: true,
      phone: true,
      isPrimary: true,
      isPortalEnabled: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return Response.json({
    ok: true,
    contact: { ...contact, lastLoginAt: contact.lastLoginAt?.toISOString() ?? null, createdAt: contact.createdAt.toISOString() },
  });
}
