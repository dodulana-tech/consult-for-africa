import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signCadreJWT } from "@/lib/cadreAuth";
import crypto from "crypto";
import { cookies } from "next/headers";
import { handler } from "@/lib/api-handler";
import { notifyAdmins } from "@/lib/admin-notify";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

export const POST = handler(async function POST(req: NextRequest) {
  // Validate the JWT secret BEFORE any DB write. The earlier version did
  // the DB updates first and then signed the JWT; if the secret was
  // missing the user saw a 500 but the record was already CONVERTED,
  // leaving them locked out without a clean retry path. Fail fast here.
  if (!process.env.CADRE_PORTAL_SECRET) {
    console.error("[cadre-claim] Refusing to claim: CADRE_PORTAL_SECRET is not set");
    return NextResponse.json(
      {
        error:
          "We could not activate your profile. Please email hello@consultforafrica.com and we will fix this for you.",
        ref: "ENV_MISCONFIGURED",
      },
      { status: 503 },
    );
  }

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

    // Notify admins of conversion
    try {
      await notifyAdmins({
        type: "CADRE_CLAIM_CONVERTED",
        severity: "SUCCESS",
        title: `${professional.firstName} ${professional.lastName} claimed their CadreHealth account`,
        body: `${professional.cadre.replace(/_/g, " ")}${hasCredentials > 0 ? " · added credentials (PENDING_REVIEW)" : " · awaiting credentials"}`,
        href: `/admin/cadrehealth/${professional.id}`,
        metadata: { professionalId: professional.id, hasCredentials: hasCredentials > 0 },
      });
    } catch (e) {
      console.error("[claim] admin notify failed:", e);
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
    // Log with full context so support can trace a specific failed claim
    // attempt back to a professional ID (the user has no other handle).
    const detail = error instanceof Error ? error.message : String(error);
    const code =
      error && typeof error === "object" && "code" in error
        ? (error as { code: string }).code
        : null;
    console.error(
      `[cadre-claim] Failed claim. detail=${detail} code=${code ?? "none"}`,
      error,
    );
    return NextResponse.json(
      {
        error:
          "We could not activate your profile. Please email hello@consultforafrica.com and we will fix this for you.",
        // Surface a short fingerprint the support team can grep against
        // without exposing internal stack traces.
        ref: code ?? "INTERNAL",
      },
      { status: 500 }
    );
  }
});
