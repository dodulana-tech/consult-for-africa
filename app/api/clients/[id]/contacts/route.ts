import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["DIRECTOR", "PARTNER", "ADMIN", "ENGAGEMENT_MANAGER"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id: clientId } = await params;
  const { name, email, title, phone, isPrimary } = await req.json();

  if (!name?.trim() || !email?.trim()) {
    return new Response("name and email are required", { status: 400 });
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

  return Response.json(
    { ok: true, contact: { ...contact, lastLoginAt: contact.lastLoginAt?.toISOString() ?? null, createdAt: contact.createdAt.toISOString() } },
    { status: 201 }
  );
}
