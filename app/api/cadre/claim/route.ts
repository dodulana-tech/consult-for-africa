import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signCadreJWT } from "@/lib/cadreAuth";
import crypto from "crypto";
import { cookies } from "next/headers";
import { handler } from "@/lib/api-handler";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

export const POST = handler(async function POST(req: NextRequest) {
  try {
    const { professionalId, password } = await req.json();

    if (!professionalId || !password) {
      return NextResponse.json(
        { error: "Professional ID and password are required" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find the professional
    const professional = await prisma.cadreProfessional.findUnique({
      where: { id: professionalId },
      include: { outreachRecord: true },
    });

    if (!professional) {
      return NextResponse.json(
        { error: "Professional not found" },
        { status: 404 }
      );
    }

    // Hash password and update professional
    const passwordHash = hashPassword(password);

    // Determine account status based on credentials
    const hasCredentials = await prisma.cadreCredential.count({
      where: { professionalId },
    });

    await prisma.cadreProfessional.update({
      where: { id: professionalId },
      data: {
        passwordHash,
        accountStatus: hasCredentials > 0 ? "PENDING_REVIEW" : "UNVERIFIED",
      },
    });

    // Update outreach record if it exists
    if (professional.outreachRecord) {
      await prisma.cadreOutreachRecord.update({
        where: { id: professional.outreachRecord.id },
        data: {
          status: "CONVERTED",
          convertedAt: new Date(),
          profileClaimedAt: new Date(),
        },
      });
    }

    // Sign JWT and set cookie
    const token = signCadreJWT({
      sub: professional.id,
      email: professional.email,
      firstName: professional.firstName,
      lastName: professional.lastName,
      cadre: professional.cadre,
      accountStatus: hasCredentials > 0 ? "PENDING_REVIEW" : "UNVERIFIED",
    });

    const cookieStore = await cookies();
    cookieStore.set("cadre_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      id: professional.id,
      firstName: professional.firstName,
      lastName: professional.lastName,
    });
  } catch (error) {
    console.error("CadreHealth claim error:", error);
    return NextResponse.json(
      { error: "Failed to claim profile. Please try again." },
      { status: 500 }
    );
  }
});
