import { prisma } from "@/lib/prisma";
import { emailPlatformPasswordReset } from "@/lib/email";
import crypto from "crypto";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email?.trim()) {
    return new Response("Email is required", { status: 400 });
  }

  const okResponse = Response.json({ ok: true });

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, email: true, passwordHash: true },
  });

  if (!user || !user.passwordHash) return okResponse;

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: tokenHash, resetTokenExpiry: expiry },
  });

  const BASE_URL = process.env.NEXTAUTH_URL ?? "https://platform.consultforafrica.com";
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

  emailPlatformPasswordReset({
    email: user.email,
    name: user.name,
    resetUrl,
  }).catch((err) => console.error("Failed to send platform password reset:", err));

  return okResponse;
}
