import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signCadreJWT } from "@/lib/cadreAuth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { sendCadreEmail } from "@/lib/cadreEmail";
import { rateLimit, getClientIp } from "@/lib/cadreHealth/rateLimit";
import { z } from "zod";

const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  cadre: z.enum([
    "MEDICINE", "DENTISTRY", "NURSING", "MIDWIFERY", "PHARMACY",
    "MEDICAL_LABORATORY_SCIENCE", "RADIOGRAPHY_IMAGING", "REHABILITATION_THERAPY",
    "OPTOMETRY", "COMMUNITY_HEALTH", "ENVIRONMENTAL_HEALTH", "NUTRITION_DIETETICS",
    "PSYCHOLOGY_SOCIAL_WORK", "PUBLIC_HEALTH", "HEALTH_ADMINISTRATION", "BIOMEDICAL_ENGINEERING",
  ]),
  subSpecialty: z.string().trim().optional(),
  yearsOfExperience: z.number().nullable().optional(),
  state: z.string().optional(),
  city: z.string().trim().optional(),
  isDiaspora: z.boolean().optional().default(false),
  diasporaCountry: z.string().trim().optional(),
  openTo: z.array(z.enum([
    "PERMANENT", "LOCUM", "CONSULTING", "INTERNATIONAL", "SHORT_MISSION", "MEDEVAC", "REMOTE",
  ])).optional().default([]),
  referralCode: z.string().trim().optional(),
});

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
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
    const parsed = registerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

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
    } = parsed.data;

    // Check for existing email
    const existing = await prisma.cadreProfessional.findUnique({
      where: { email: email.toLowerCase() },
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
        where: { referralCode: referralCode.toUpperCase() },
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
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone: phone || null,
        passwordHash: await hashPassword(password),
        cadre,
        subSpecialty: subSpecialty || null,
        yearsOfExperience: yearsOfExperience || null,
        state: isDiaspora ? null : state || null,
        city: isDiaspora ? null : city || null,
        isDiaspora,
        diasporaCountry: isDiaspora ? diasporaCountry || null : null,
        country: isDiaspora && diasporaCountry ? diasporaCountry : "Nigeria",
        openTo,
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
    const isDbError = error instanceof Error && (
      error.message.includes("Can't reach database") ||
      error.message.includes("Connection") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("timeout")
    );
    return NextResponse.json(
      {
        error: isDbError
          ? "Our servers are experiencing high traffic. Please try again in a minute."
          : "Registration failed. Please try again.",
      },
      { status: isDbError ? 503 : 500 }
    );
  }
}
