import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signCadreJWT } from "@/lib/cadreAuth";
import crypto from "crypto";
import { cookies } from "next/headers";
import { sendCadreEmail } from "@/lib/cadreEmail";
import { rateLimit, getClientIp } from "@/lib/cadreHealth/rateLimit";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

function generateReferralCode(): string {
  return "CH" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

export async function POST(req: NextRequest) {
  // Rate limit: 5 registrations per hour per IP
  const ip = getClientIp(req.headers);
  if (!rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      cadre,
      subSpecialty,
      yearsOfExperience,
      state,
      city,
      isDiaspora,
      diasporaCountry,
      openTo,
      referralCode,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !cadre) {
      return NextResponse.json(
        { error: "First name, last name, email, password, and cadre are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check for existing email
    const existing = await prisma.cadreProfessional.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Resolve referrer
    let referredById: string | undefined;
    if (referralCode) {
      const referrer = await prisma.cadreProfessional.findUnique({
        where: { referralCode: referralCode.toUpperCase().trim() },
      });
      if (referrer) referredById = referrer.id;
    }

    // Compute initial profile completeness
    let completeness = 20; // base for registering
    if (phone) completeness += 5;
    if (cadre) completeness += 10;
    if (yearsOfExperience) completeness += 5;
    if (state) completeness += 5;
    if (openTo?.length > 0) completeness += 5;

    // Generate email verification token
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");

    // Create professional
    const professional = await prisma.cadreProfessional.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        passwordHash: hashPassword(password),
        cadre,
        subSpecialty: subSpecialty?.trim() || null,
        yearsOfExperience: yearsOfExperience || null,
        state: isDiaspora ? null : state || null,
        city: isDiaspora ? null : city?.trim() || null,
        isDiaspora: !!isDiaspora,
        diasporaCountry: isDiaspora ? diasporaCountry?.trim() || null : null,
        country: isDiaspora && diasporaCountry ? diasporaCountry.trim() : "Nigeria",
        openTo: openTo || [],
        referralCode: generateReferralCode(),
        referredById: referredById || null,
        profileCompleteness: completeness,
        emailVerifyToken,
      },
    });

    // Send verification email (non-blocking)
    const baseUrl = process.env.NEXTAUTH_URL ?? "https://consultforafrica.com";
    const verifyLink = `${baseUrl}/api/cadre/verify-email?token=${emailVerifyToken}`;
    sendCadreEmail({
      to: professional.email,
      subject: "Verify your CadreHealth email",
      heading: "Welcome to CadreHealth",
      body: `Hi ${professional.firstName}, welcome to CadreHealth. Please verify your email address to unlock all features.`,
      ctaText: "Verify Email",
      ctaHref: verifyLink,
      footer: "If you did not create a CadreHealth account, you can ignore this email.",
    }).catch((err) => console.error("Verification email error:", err));

    // Sign JWT
    const token = signCadreJWT({
      sub: professional.id,
      email: professional.email,
      firstName: professional.firstName,
      lastName: professional.lastName,
      cadre: professional.cadre,
      accountStatus: professional.accountStatus,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("cadre_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({
      id: professional.id,
      referralCode: professional.referralCode,
    });
  } catch (error) {
    console.error("CadreHealth registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
