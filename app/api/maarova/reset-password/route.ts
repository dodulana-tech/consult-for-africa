import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest } from "next/server";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,}$/;

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return new Response("Token and password are required", { status: 400 });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return new Response("Password must be at least 10 characters with uppercase, lowercase, number, and special character", { status: 400 });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.maarovaUser.findFirst({
    where: {
      resetToken: tokenHash,
      resetTokenExpiry: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    return new Response("Invalid or expired reset link. Please request a new one.", { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.maarovaUser.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });

  return Response.json({ ok: true });
}
