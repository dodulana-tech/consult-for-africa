import { NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendCadreEmail } from "@/lib/cadreEmail";

export async function POST() {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const professional = await prisma.cadreProfessional.findUnique({
      where: { id: session.sub },
    });

    if (!professional) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (professional.emailVerified) {
      return NextResponse.json({ message: "Email already verified." });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await prisma.cadreProfessional.update({
      where: { id: professional.id },
      data: { emailVerifyToken: token },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "https://consultforafrica.com";
    const verifyLink = `${baseUrl}/api/cadre/verify-email?token=${token}`;

    await sendCadreEmail({
      to: professional.email,
      subject: "Verify your CadreHealth email",
      heading: "Verify Your Email",
      body: `Hi ${professional.firstName}, please verify your email address to get the most out of CadreHealth. Click the button below to confirm.`,
      ctaText: "Verify Email",
      ctaHref: verifyLink,
      footer: "If you did not create a CadreHealth account, you can ignore this email.",
    });

    return NextResponse.json({ message: "Verification email sent." });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email." },
      { status: 500 }
    );
  }
}
