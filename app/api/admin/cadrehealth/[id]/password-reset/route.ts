import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { sendCadreEmail } from "@/lib/cadreEmail";
import { logAudit } from "@/lib/audit";
import crypto from "crypto";

/**
 * POST /api/admin/cadrehealth/[id]/password-reset
 *
 * Admin-initiated password reset for a CadreHealth professional. Generates a
 * 1-hour token, attempts to send the reset email, and returns the link inline
 * so the admin can share it manually if email delivery is unreliable.
 */
export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["PARTNER", "ADMIN", "DIRECTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const professional = await prisma.cadreProfessional.findUnique({
    where: { id },
    select: { id: true, firstName: true, email: true },
  });
  if (!professional) {
    return NextResponse.json({ error: "Professional not found" }, { status: 404 });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.cadreProfessional.update({
    where: { id: professional.id },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://consultforafrica.com";
  const resetLink = `${baseUrl}/oncadre/reset-password/${token}`;

  let emailSent = true;
  let emailError: string | undefined;
  try {
    await sendCadreEmail({
      to: professional.email,
      subject: "Reset your CadreHealth password",
      heading: "Password Reset Request",
      body: `Hi ${professional.firstName}, an admin has generated a password reset link for your account. Click the button below to choose a new password. This link expires in 1 hour.`,
      ctaText: "Reset Password",
      ctaHref: resetLink,
      footer: "If you did not request this, please contact support.",
    });
  } catch (err) {
    emailSent = false;
    emailError = err instanceof Error ? err.message : "Unknown error";
    console.error("[admin password-reset] email send failed:", err);
  }

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "CadreProfessional",
    entityId: professional.id,
    entityName: professional.email,
    details: { reason: "admin password reset", emailSent },
  });

  return NextResponse.json({
    ok: true,
    resetLink,
    expiresAt: expiry.toISOString(),
    emailSent,
    ...(emailError && { emailError }),
  });
});
