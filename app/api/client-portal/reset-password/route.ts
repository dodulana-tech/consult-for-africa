import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,}$/;

export const POST = handler(async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return new Response("Token and password are required", { status: 400 });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return new Response("Password must be at least 10 characters with uppercase, lowercase, number, and special character", { status: 400 });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const contact = await prisma.clientContact.findFirst({
    where: {
      resetToken: tokenHash,
      resetTokenExpiry: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!contact) {
    return new Response("Invalid or expired reset link. Please request a new one.", { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.clientContact.update({
    where: { id: contact.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return Response.json({ ok: true });
});
