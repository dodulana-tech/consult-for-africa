import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { sendCadreEmail } from "@/lib/cadreEmail";
import { logAudit } from "@/lib/audit";
import crypto from "crypto";

/**
 * POST /api/admin/cadre-employers/[id]/password-reset
 *
 * Admin-initiated password reset for a CadreHealth employer account. Returns
 * the link inline so admins can share it manually if email delivery fails.
 */
export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["PARTNER", "ADMIN", "ASSOCIATE_DIRECTOR", "DIRECTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const employer = await prisma.cadreEmployerAccount.findUnique({
    where: { id },
    select: { id: true, contactName: true, contactEmail: true, companyName: true },
  });
  if (!employer) {
    return NextResponse.json({ error: "Employer not found" }, { status: 404 });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.cadreEmployerAccount.update({
    where: { id: employer.id },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://consultforafrica.com";
  const resetLink = `${baseUrl}/oncadre/employer/reset-password/${token}`;

  let emailSent = true;
  let emailError: string | undefined;
  try {
    await sendCadreEmail({
      to: employer.contactEmail,
      subject: "Reset your CadreHealth employer password",
      heading: "Password Reset Request",
      body: `Hi ${employer.contactName}, an admin has generated a password reset link for the ${employer.companyName} employer account. Click the button below to choose a new password. This link expires in 1 hour.`,
      ctaText: "Reset Password",
      ctaHref: resetLink,
      footer: "If you did not request this, please contact support.",
    });
  } catch (err) {
    emailSent = false;
    emailError = err instanceof Error ? err.message : "Unknown error";
    console.error("[admin employer password-reset] email send failed:", err);
  }

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "CadreEmployerAccount",
    entityId: employer.id,
    entityName: employer.contactEmail,
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
