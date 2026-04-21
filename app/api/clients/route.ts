import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { emailClientPortalInvite } from "@/lib/email";
import { z } from "zod";
import { handler } from "@/lib/api-handler";

const createClientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  type: z.enum(["PRIVATE_ELITE", "PRIVATE_MIDTIER", "STARTUP", "SME", "GOVERNMENT", "DEVELOPMENT"]),
  primaryContact: z.string().trim().min(1, "Primary contact is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  address: z.string().trim().min(1, "Address is required"),
  paymentTerms: z.coerce.number().optional().default(30),
  currency: z.enum(["USD", "NGN"]).optional().default("NGN"),
  notes: z.string().trim().nullable().optional(),
});

/** Generate a secure 14-char password meeting complexity requirements */
function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*?";
  // Guarantee one of each category
  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  const all = upper + lower + digits + special;
  const rest = Array.from(randomBytes(10), (b) => all[b % all.length]);
  // Shuffle
  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export const GET = handler(async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;

  let where = {};
  if (role === "ENGAGEMENT_MANAGER") {
    where = { projects: { some: { engagementManagerId: session.user.id } } };
  } else if (role === "CONSULTANT") {
    where = { projects: { some: { assignments: { some: { consultantId: session.user.id } } } } };
  }

  const clients = await prisma.client.findMany({
    where,
    select: {
      id: true,
      name: true,
      currency: true,
      status: true,
      type: true,
      primaryContact: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });

  return Response.json({ clients });
});

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canCreate = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canCreate) return Response.json({ error: "Forbidden" }, { status: 403 });

  const parsed = createClientSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, type, primaryContact, email, phone, address, paymentTerms, currency, notes } = parsed.data;

  const client = await prisma.client.create({
    data: {
      name,
      type,
      primaryContact,
      email: email.toLowerCase(),
      phone,
      address,
      paymentTerms,
      currency,
      notes: notes ?? null,
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

  // Auto-create primary ClientContact with portal access
  const tempPassword = generatePassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.clientContact.create({
    data: {
      clientId: client.id,
      name: client.primaryContact,
      email: client.email,
      phone: phone.trim(),
      isPrimary: true,
      isPortalEnabled: true,
      passwordHash,
    },
  });

  // Send portal invite with credentials
  emailClientPortalInvite({
    contactEmail: client.email,
    contactName: client.primaryContact,
    clientName: client.name,
    password: tempPassword,
  }).catch((err) => console.error("[email] client portal invite error:", err));

  return Response.json(
    { ok: true, client: { ...client, createdAt: client.createdAt.toISOString() } },
    { status: 201 }
  );
});
