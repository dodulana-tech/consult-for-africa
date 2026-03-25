import { prisma } from "@/lib/prisma";
import { emailClientPortalPasswordReset } from "@/lib/email";
import { isRateLimited } from "@/lib/rate-limit";
import crypto from "crypto";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip, "client-forgot-password", { windowMs: 3_600_000, max: 5 })) {
    return Response.json({ ok: true });
  }

  const { email } = await req.json();

  if (!email?.trim()) {
    return new Response("Email is required", { status: 400 });
  }

  // Always return 200 to prevent email enumeration
  const okResponse = Response.json({ ok: true });

  const contact = await prisma.clientContact.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, email: true, isPortalEnabled: true, passwordHash: true },
  });

  // Only proceed if contact exists, has portal enabled, and has a password set
  if (!contact || !contact.isPortalEnabled || !contact.passwordHash) {
    return okResponse;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.clientContact.update({
    where: { id: contact.id },
    data: {
      resetToken: tokenHash,
      resetTokenExpiry: expiry,
    },
  });

  const BASE_URL = process.env.NEXTAUTH_URL ?? "https://platform.consultforafrica.com";
  const resetUrl = `${BASE_URL}/client/reset-password?token=${token}`;

  emailClientPortalPasswordReset({
    email: contact.email,
    name: contact.name,
    resetUrl,
  }).catch((err) => console.error("Failed to send password reset email:", err));

  return okResponse;
}
