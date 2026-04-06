import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signCadreJWT } from "@/lib/cadreAuth";
import crypto from "crypto";
import { cookies } from "next/headers";
import { rateLimit, getClientIp } from "@/lib/cadreHealth/rateLimit";

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const computed = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computed));
}

export async function POST(req: NextRequest) {
  // Rate limit: 10 login attempts per hour per IP
  const ip = getClientIp(req.headers);
  if (!rateLimit(`login:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const professional = await prisma.cadreProfessional.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!professional || !verifyPassword(password, professional.passwordHash)) {
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
}
