import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendCadreEmail } from "@/lib/cadreEmail";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const professional = await prisma.cadreProfessional.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    if (!professional) {
      return NextResponse.json({
        message: "If that email is registered, you will receive a reset link shortly.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.cadreProfessional.update({
      where: { id: professional.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiry: expiry,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "https://consultforafrica.com";
    const resetLink = `${baseUrl}/oncadre/reset-password/${token}`;

    await sendCadreEmail({
      to: professional.email,
      subject: "Reset your CadreHealth password",
      heading: "Password Reset Request",
      body: `Hi ${professional.firstName}, we received a request to reset your password. Click the button below to choose a new password. This link expires in 1 hour.`,
      ctaText: "Reset Password",
      ctaHref: resetLink,
      footer: "If you did not request this, you can safely ignore this email.",
    });

    return NextResponse.json({
      message: "If that email is registered, you will receive a reset link shortly.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
