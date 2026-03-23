import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { NextRequest } from "next/server";
import { emailClientPortalInvite } from "@/lib/email";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "DIRECTOR", "ENGAGEMENT_MANAGER"];

/** Generate a secure 14-char password meeting complexity requirements */
function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*?";
  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  const all = upper + lower + digits + special;
  const rest = Array.from(randomBytes(10), (b) => all[b % all.length]);
  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { contactId } = await req.json();
  if (!contactId) {
    return new Response("contactId is required", { status: 400 });
  }

  const contact = await prisma.clientContact.findUnique({
    where: { id: contactId as string },
    select: { id: true, name: true, email: true, isPortalEnabled: true, client: { select: { name: true } } },
  });

  if (!contact) return new Response("Contact not found", { status: 404 });

  // Generate new password and update
  const tempPassword = generatePassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.clientContact.update({
    where: { id: contactId as string },
    data: { passwordHash, isPortalEnabled: true },
  });

  await emailClientPortalInvite({
    contactEmail: contact.email,
    contactName: contact.name,
    clientName: contact.client.name,
    password: tempPassword,
  });

  return Response.json({ ok: true });
}
