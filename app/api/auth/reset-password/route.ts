import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,}$/;

export const POST = handler(async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return Response.json({ error: "Token and password are required" }, { status: 400 });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return Response.json({ error: "Password must be at least 10 characters with uppercase, lowercase, number, and special character" }, { status: 400 });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      resetToken: tokenHash,
      resetTokenExpiry: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    return Response.json({ error: "Invalid or expired reset link. Please request a new one." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });

  return Response.json({ ok: true });
});
