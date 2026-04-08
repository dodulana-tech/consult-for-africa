import { prisma } from "@/lib/prisma";
import { emailAgentPasswordReset } from "@/lib/email";
import { isRateLimited } from "@/lib/rate-limit";
import crypto from "crypto";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip, "agent-forgot-password", { windowMs: 3_600_000, max: 5 })) {
    return Response.json({ ok: true }); // silent rate limit to prevent enumeration
  }

  const { email } = await req.json();

  if (!email?.trim()) {
    return new Response("Email is required", { status: 400 });
  }

  const okResponse = Response.json({ ok: true });

  const agent = await prisma.salesAgent.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, firstName: true, email: true, passwordHash: true },
  });

  if (!agent || !agent.passwordHash) return okResponse;

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.salesAgent.update({
    where: { id: agent.id },
    data: { resetToken: tokenHash, resetTokenExpiry: expiry },
  });

  const BASE_URL = process.env.NEXTAUTH_URL;
  const resetUrl = `${BASE_URL}/agent/reset-password?token=${token}`;

  emailAgentPasswordReset({
    email: agent.email,
    name: agent.firstName,
    resetUrl,
  }).catch((err) => console.error("Failed to send agent password reset:", err));

  return okResponse;
}
