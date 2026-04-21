import { prisma } from "@/lib/prisma";
import { emailMaarovaPasswordReset } from "@/lib/email";
import { isRateLimited } from "@/lib/rate-limit";
import crypto from "crypto";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip, "maarova-forgot-password", { windowMs: 3_600_000, max: 5 })) {
    return Response.json({ ok: true });
  }

  const { email } = await req.json();

  if (!email?.trim()) {
    return new Response("Email is required", { status: 400 });
  }

  const okResponse = Response.json({ ok: true });

  const user = await prisma.maarovaUser.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, email: true, passwordHash: true, isPortalEnabled: true },
  });

  if (!user || !user.passwordHash || !user.isPortalEnabled) return okResponse;

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.maarovaUser.update({
    where: { id: user.id },
    data: { resetToken: tokenHash, resetTokenExpiry: expiry },
  });

  const BASE_URL = process.env.NEXTAUTH_URL;
  const resetUrl = `${BASE_URL}/maarova/portal/reset-password?token=${token}`;

  emailMaarovaPasswordReset({
    email: user.email,
    name: user.name,
    resetUrl,
  }).catch((err) => console.error("Failed to send Maarova password reset:", err));

  return okResponse;
});
