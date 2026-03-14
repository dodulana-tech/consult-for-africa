import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const role = session.user.role;

  let where = {};
  if (role === "ENGAGEMENT_MANAGER") {
    where = { projects: { some: { engagementManagerId: session.user.id } } };
  } else if (role === "CONSULTANT") {
    where = { projects: { some: { assignments: { some: { consultantId: session.user.id } } } } };
  }

  const clients = await prisma.client.findMany({
    where,
    select: { id: true, name: true, currency: true, status: true, type: true },
    orderBy: { name: "asc" },
  });

  return Response.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canCreate = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canCreate) return new Response("Forbidden", { status: 403 });

  const {
    name,
    type,
    primaryContact,
    email,
    phone,
    address,
    paymentTerms,
    currency,
    notes,
  } = await req.json();

  if (!name?.trim() || !type || !primaryContact?.trim() || !email?.trim() || !phone?.trim() || !address?.trim()) {
    return new Response("name, type, primaryContact, email, phone, address are required", { status: 400 });
  }

  const client = await prisma.client.create({
    data: {
      name: name.trim(),
      type,
      primaryContact: primaryContact.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      paymentTerms: paymentTerms ? Number(paymentTerms) : 30,
      currency: currency || "NGN",
      notes: notes?.trim() ?? null,
    },
    select: {
      id: true,
      name: true,
      type: true,
      primaryContact: true,
      email: true,
      phone: true,
      address: true,
      paymentTerms: true,
      currency: true,
      status: true,
      createdAt: true,
    },
  });

  return Response.json(
    { ok: true, client: { ...client, createdAt: client.createdAt.toISOString() } },
    { status: 201 }
  );
}
