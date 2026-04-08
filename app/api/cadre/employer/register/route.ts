import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signCadreEmployerJWT } from "@/lib/cadreEmployerAuth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, contactName, contactEmail, contactPhone, password, facilityId } = body;

    if (!companyName || !contactName || !contactEmail || !password) {
      return NextResponse.json(
        { error: "Company name, contact name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check existing email
    const existing = await prisma.cadreEmployerAccount.findUnique({
      where: { contactEmail: contactEmail.toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Optionally verify facility exists
    let validFacilityId: string | null = null;
    if (facilityId) {
      const facility = await prisma.cadreFacility.findUnique({
        where: { id: facilityId },
        select: { id: true },
      });
      if (facility) validFacilityId = facility.id;
    }

    const employer = await prisma.cadreEmployerAccount.create({
      data: {
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.toLowerCase().trim(),
        contactPhone: contactPhone?.trim() || null,
        passwordHash: await hashPassword(password),
        facilityId: validFacilityId,
      },
    });

    const token = signCadreEmployerJWT({
      sub: employer.id,
      email: employer.contactEmail,
      companyName: employer.companyName,
      contactName: employer.contactName,
      isVerified: employer.isVerified,
      facilityId: employer.facilityId,
    });

    const cookieStore = await cookies();
    cookieStore.set("cadre_employer_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return NextResponse.json({ id: employer.id });
  } catch (error) {
    console.error("Employer registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
