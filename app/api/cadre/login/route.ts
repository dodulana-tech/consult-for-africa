import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signCadreJWT } from "@/lib/cadreAuth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { rateLimit, getClientIp } from "@/lib/cadreHealth/rateLimit";
import { handler } from "@/lib/api-handler";

function verifyPasswordPbkdf2(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const computed = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computed));
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // Bcrypt hashes start with $2a$ or $2b$
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$")) {
    return bcrypt.compare(password, stored);
  }
  // Legacy PBKDF2 fallback
  return verifyPasswordPbkdf2(password, stored);
}

export const POST = handler(async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit by email (10 failed attempts per hour) and IP (30 per hour
    // for shared networks/NAT). Only checked here so that we can decide later
    // whether to count this attempt against the email bucket on failure.
    const ip = getClientIp(req.headers);
    if (!rateLimit(`login-ip:${ip}`, 50, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many login attempts from this network. Please try again later." },
        { status: 429 }
      );
    }
    if (!rateLimit(`login-email:${normalizedEmail}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many login attempts for this account. Please try again in an hour or reset your password." },
        { status: 429 }
      );
    }

    const professional = await prisma.cadreProfessional.findUnique({
      where: { email: normalizedEmail },
    });

    const storedHash = professional?.passwordHash;
    if (!professional || !storedHash || !(await verifyPassword(password, storedHash))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (professional.accountStatus === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your account has been suspended. Please contact support." },
        { status: 403 }
      );
    }

    const token = signCadreJWT({
      sub: professional.id,
      email: professional.email,
      firstName: professional.firstName,
      lastName: professional.lastName,
      cadre: professional.cadre,
      accountStatus: professional.accountStatus,
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
      id: professional.id,
      firstName: professional.firstName,
      lastName: professional.lastName,
    });
  } catch (error) {
    console.error("CadreHealth login error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
});
