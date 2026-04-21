import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/oncadre/login?error=invalid-token", req.url)
      );
    }

    const professional = await prisma.cadreProfessional.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!professional) {
      return NextResponse.redirect(
        new URL("/oncadre/login?error=invalid-token", req.url)
      );
    }

    // Check token expiry (if set)
    if (professional.emailVerifyTokenExpiry && professional.emailVerifyTokenExpiry < new Date()) {
      return NextResponse.redirect(
        new URL("/oncadre/login?error=token-expired", req.url)
      );
    }

    await prisma.cadreProfessional.update({
      where: { id: professional.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyTokenExpiry: null,
      },
    });

    return NextResponse.redirect(
      new URL("/oncadre/dashboard?verified=true", req.url)
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(
      new URL("/oncadre/login?error=verification-failed", req.url)
    );
  }
});
