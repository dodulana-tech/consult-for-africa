import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { NextRequest } from "next/server";
import { emailPartnerPortalInvite } from "@/lib/email";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "DIRECTOR"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { contactId, password } = await req.json();
  if (!contactId || !password) {
    return new Response("contactId and password required", { status: 400 });
  }
  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,}$/;
  if (!PASSWORD_REGEX.test(password as string)) {
    return new Response("Password must be at least 10 characters with uppercase, lowercase, number, and special character", { status: 400 });
  }

  const contact = await prisma.partnerContact.findUnique({
    where: { id: contactId as string },
    select: { id: true, name: true, email: true, partner: { select: { name: true } } },
  });

  if (!contact) return new Response("Contact not found", { status: 404 });

  const passwordHash = await bcrypt.hash(password as string, 12);

  await prisma.partnerContact.update({
    where: { id: contactId as string },
    data: { passwordHash, isPortalEnabled: true },
  });

  await emailPartnerPortalInvite({
    contactEmail: contact.email,
    contactName: contact.name,
    partnerName: contact.partner.name,
    password: password as string,
  });

  return Response.json({ ok: true });
}
