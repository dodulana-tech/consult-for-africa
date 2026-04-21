import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signPartnerPortalJWT } from "@/lib/partnerPortalAuth";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password)
    return new Response("Email and password required", { status: 400 });

  const contact = await prisma.partnerContact.findUnique({
    where: { email: (email as string).toLowerCase() },
    select: {
      id: true,
      partnerId: true,
      name: true,
      email: true,
      passwordHash: true,
      isPortalEnabled: true,
    },
  });

  if (!contact || !contact.isPortalEnabled || !contact.passwordHash) {
    return new Response("Invalid credentials or portal not enabled", {
      status: 401,
    });
  }

  const valid = await bcrypt.compare(password as string, contact.passwordHash);
  if (!valid) return new Response("Invalid credentials", { status: 401 });

  const token = signPartnerPortalJWT({
    sub: contact.id,
    partnerId: contact.partnerId,
    name: contact.name,
    email: contact.email,
  });

  const cookieStore = await cookies();
  cookieStore.set("partner_portal_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/partner",
  });

  await prisma.partnerContact.update({
    where: { id: contact.id },
    data: { lastLoginAt: new Date() },
  });

  return Response.json({ ok: true, name: contact.name, partnerId: contact.partnerId });
});

export const DELETE = handler(async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("partner_portal_token");
  return Response.json({ ok: true });
});
