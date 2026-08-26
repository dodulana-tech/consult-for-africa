import { prisma } from "@/lib/prisma";
import { signMaarovaJWT } from "@/lib/maarovaAuth";
import { isRateLimited } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

// NO AUTH REQUIRED - one shared org join token, handed to a whole staff body.
// Unlike /api/maarova/outreach-onboard/[token] (one token per named person,
// which spins up an individual org), this token belongs to an existing
// MaarovaOrganisation and every person who uses it lands inside that org.

type OrgForJoin = {
  id: string;
  name: string;
  contactEmail: string;
  maxAssessments: number;
  isActive: boolean;
  joinEnabled: boolean;
  joinExpiresAt: Date | null;
};

/** Seats are counted by registered staff, excluding the org admin contact. */
async function seatsUsed(org: OrgForJoin): Promise<number> {
  return prisma.maarovaUser.count({
    where: {
      organisationId: org.id,
      email: { not: org.contactEmail },
    },
  });
}

function gateOrg(org: OrgForJoin | null): { error: string; message: string; status: number } | null {
  if (!org) {
    return { error: "invalid_token", message: "This link is not valid. Please check with whoever shared it.", status: 404 };
  }
  if (!org.isActive || !org.joinEnabled) {
    return { error: "closed", message: "This link is no longer open. Please contact hello@consultforafrica.com.", status: 400 };
  }
  if (org.joinExpiresAt && new Date() > org.joinExpiresAt) {
    return { error: "expired", message: "This link has expired. Please contact hello@consultforafrica.com for a new one.", status: 400 };
  }
  return null;
}

const ORG_SELECT = {
  id: true,
  name: true,
  contactEmail: true,
  maxAssessments: true,
  isActive: true,
  joinEnabled: true,
  joinExpiresAt: true,
} as const;

/**
 * GET - Validate the join link and return what the sign-up page needs.
 */
export const GET = handler(async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip, "maarova-join", { windowMs: 60_000, max: 20 })) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { token } = await params;

  const org = await prisma.maarovaOrganisation.findUnique({
    where: { joinToken: token },
    select: ORG_SELECT,
  });

  const gate = gateOrg(org);
  if (gate) return Response.json({ error: gate.error, message: gate.message }, { status: gate.status });

  const used = await seatsUsed(org!);
  if (used >= org!.maxAssessments) {
    return Response.json(
      { error: "full", message: "All places on this assessment have been taken. Please contact hello@consultforafrica.com." },
      { status: 400 }
    );
  }

  return Response.json({
    organisationName: org!.name,
    placesRemaining: org!.maxAssessments - used,
  });
});

/**
 * POST - Register a member of staff into the org, log them in, send them
 * straight into the assessment.
 */
export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip, "maarova-join-submit", { windowMs: 3_600_000, max: 10 })) {
    return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const { token } = await params;
  const body = await req.json();
  const { name, email, password, title, department, yearsInHealthcare, clinicalBackground } = body;

  if (!name?.trim()) return Response.json({ error: "Your name is required" }, { status: 400 });
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return Response.json({ error: "A valid email address is required" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const org = await prisma.maarovaOrganisation.findUnique({
    where: { joinToken: token },
    select: ORG_SELECT,
  });

  const gate = gateOrg(org);
  if (gate) return Response.json({ error: gate.message }, { status: gate.status });

  const cleanEmail = email.trim().toLowerCase();

  const existing = await prisma.maarovaUser.findUnique({
    where: { email: cleanEmail },
    select: { id: true },
  });
  if (existing) {
    return Response.json(
      { error: "An account with this email already exists. Please log in instead." },
      { status: 409 }
    );
  }

  const used = await seatsUsed(org!);
  if (used >= org!.maxAssessments) {
    return Response.json(
      { error: "All places on this assessment have been taken. Please contact hello@consultforafrica.com." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.maarovaUser.create({
    data: {
      organisationId: org!.id,
      email: cleanEmail,
      name: name.trim(),
      passwordHash,
      title: title?.trim() || null,
      department: department?.trim() || null,
      yearsInHealthcare: yearsInHealthcare ? parseInt(String(yearsInHealthcare), 10) : null,
      clinicalBackground:
        clinicalBackground && clinicalBackground !== "__non_clinical__"
          ? String(clinicalBackground).trim()
          : null,
      role: "USER",
      isPortalEnabled: true,
      invitedAt: new Date(),
      lastLoginAt: new Date(),
    },
    select: { id: true, name: true, email: true, role: true },
  });

  const jwt = signMaarovaJWT({
    sub: user.id,
    organisationId: org!.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set("maarova_portal_token", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return Response.json({
    ok: true,
    redirect: "/maarova/portal/dashboard",
    user: { name: user.name, email: user.email },
  });
});
