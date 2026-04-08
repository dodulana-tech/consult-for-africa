import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return new Response("Token and password are required", { status: 400 });
  }

  if (password.length < 8) {
    return new Response("Password must be at least 8 characters", { status: 400 });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const agent = await prisma.salesAgent.findFirst({
    where: {
      resetToken: tokenHash,
      resetTokenExpiry: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!agent) {
    return new Response("Invalid or expired reset link. Please request a new one.", { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.salesAgent.update({
    where: { id: agent.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });

  return Response.json({ ok: true });
}
