import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendCadreEmail } from "@/lib/cadreEmail";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const employer = await prisma.cadreEmployerAccount.findUnique({
      where: { contactEmail: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration.
    if (!employer) {
      return NextResponse.json({
        message: "If that email is registered, you will receive a reset link shortly.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.cadreEmployerAccount.update({
      where: { id: employer.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiry: expiry,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "https://consultforafrica.com";
    const resetLink = `${baseUrl}/oncadre/employer/reset-password/${token}`;

    // Catch SMTP failures so a transient Zoho/ZeptoMail issue does not
    // bubble into a 500 -- the token is already in the DB and the user
    // can retry, generating a fresh token cleanly.
    try {
      await sendCadreEmail({
        to: employer.contactEmail,
        subject: "Reset your CadreHealth employer password",
        heading: "Password Reset Request",
        body: `Hi ${employer.contactName}, we received a request to reset the password for your ${employer.companyName} employer account. Click the button below to choose a new password. This link expires in 1 hour.`,
        ctaText: "Reset Password",
        ctaHref: resetLink,
        footer: "If you did not request this, you can safely ignore this email.",
      });
    } catch (err) {
      console.error(
        `[employer-forgot-password] email send failed for ${employer.contactEmail}:`,
        err,
      );
    }

    return NextResponse.json({
      message: "If that email is registered, you will receive a reset link shortly.",
    });
  } catch (error) {
    console.error("Employer forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
});
