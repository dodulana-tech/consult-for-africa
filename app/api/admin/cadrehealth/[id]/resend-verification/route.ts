import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { sendCadreEmail } from "@/lib/cadreEmail";
import { logAudit } from "@/lib/audit";
import crypto from "crypto";

/**
 * POST /api/admin/cadrehealth/[id]/resend-verification
 *
 * Generates a fresh email-verification token for a CadreHealth professional,
 * sends the verification email, and returns the link inline so the admin can
 * share it via another channel if SMTP delivery is unreliable.
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
    select: { id: true, firstName: true, email: true, emailVerified: true },
  });
  if (!professional) {
    return NextResponse.json({ error: "Professional not found" }, { status: 404 });
  }

  if (professional.emailVerified) {
    return NextResponse.json(
      { ok: true, alreadyVerified: true, message: "Email is already verified." },
      { status: 200 },
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.cadreProfessional.update({
    where: { id: professional.id },
    data: { emailVerifyToken: token, emailVerifyTokenExpiry: expiry },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://consultforafrica.com";
  const verifyLink = `${baseUrl}/api/cadre/verify-email?token=${token}`;

  let emailSent = true;
  let emailError: string | undefined;
  try {
    await sendCadreEmail({
      to: professional.email,
      subject: "Verify your CadreHealth email",
      heading: "Verify your email",
      body: `Hi ${professional.firstName}, please verify your CadreHealth email to unlock all features. This link expires in 24 hours.`,
      ctaText: "Verify Email",
      ctaHref: verifyLink,
      footer: "If you did not create a CadreHealth account, you can ignore this email.",
    });
  } catch (err) {
    emailSent = false;
    emailError = err instanceof Error ? err.message : "Unknown error";
    console.error("[admin resend-verification] email send failed:", err);
  }

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "CadreProfessional",
    entityId: professional.id,
    entityName: professional.email,
    details: { reason: "admin resend verification", emailSent },
  });

  return NextResponse.json({
    ok: true,
    verifyLink,
    expiresAt: expiry.toISOString(),
    emailSent,
    ...(emailError && { emailError }),
  });
});
