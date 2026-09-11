/**
 * Claiming one of the five free Maarova assessments the weekly digest gives out.
 *
 * The digest promises a prize; this is the thing that makes the promise real.
 * The claim token is the only credential: a member can be reading the digest on
 * a phone that is not signed in to CadreHealth, and making them log in first is
 * a step at which the prize evaporates.
 *
 * Provisioning mirrors app/api/maarova/outreach-onboard/[token]/route.ts: an
 * individual MaarovaOrganisation, then the MaarovaUser inside it, then the
 * portal cookie so they land straight in the assessment.
 */

import { prisma } from "@/lib/prisma";
import { signMaarovaJWT } from "@/lib/maarovaAuth";
import { greetingFor } from "@/lib/cadreSalutation";
import { isRateLimited } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

// NO AUTH REQUIRED - the claim token is the credential.

const AWARD_SELECT = {
  id: true,
  status: true,
  expiresAt: true,
  earnedFor: true,
  claimedAt: true,
  professional: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      cadre: true,
      city: true,
      currentFacility: true,
      yearsOfExperience: true,
    },
  },
} as const;

/** The full name to put on the Maarova record, falling back to the greeting. */
function displayName(p: { firstName: string | null; lastName: string | null; cadre: string | null }): string {
  const full = [p.firstName, p.lastName].map((s) => s?.trim()).filter(Boolean).join(" ");
  return full || greetingFor(p);
}

/**
 * GET - validate the token and describe the prize, or say plainly why it
 * cannot be claimed.
 */
export const GET = handler(async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip, "maarova-award", { windowMs: 60_000, max: 15 })) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { token } = await params;

  const award = await prisma.cadreMaarovaAward.findUnique({
    where: { claimToken: token },
    select: AWARD_SELECT,
  });

  if (!award) {
    return Response.json(
      { error: "invalid_token", message: "This claim link is not valid. If you copied it out of an email, check nothing was left behind." },
      { status: 404 },
    );
  }

  if (award.status === "CLAIMED") {
    return Response.json(
      { error: "already_claimed", message: "This assessment has already been claimed. Sign in to the Maarova portal to pick up where you left off." },
      { status: 400 },
    );
  }

  if (award.status === "EXPIRED" || new Date() > award.expiresAt) {
    return Response.json(
      { error: "expired", message: "This assessment expired. Answer the ask in this Friday's email and you are back in the running for the next five." },
      { status: 400 },
    );
  }

  const email = award.professional.email.toLowerCase();
  const existing = await prisma.maarovaUser.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return Response.json(
      { error: "already_registered", message: "You already have a Maarova account on this email. Sign in at the Maarova portal and your assessment will be waiting." },
      { status: 400 },
    );
  }

  return Response.json({
    name: displayName(award.professional),
    greeting: greetingFor(award.professional),
    email,
    expiresAt: award.expiresAt.toISOString(),
    earnedFor: award.earnedFor,
  });
});

/**
 * POST - set a password, provision the Maarova account, and sign them in.
 */
export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip, "maarova-award-submit", { windowMs: 3_600_000, max: 5 })) {
    return Response.json({ error: "Too many attempts" }, { status: 429 });
  }

  const { token } = await params;
  const body = await req.json();
  const password: unknown = body?.password;

  if (typeof password !== "string" || password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const award = await prisma.cadreMaarovaAward.findUnique({
    where: { claimToken: token },
    select: AWARD_SELECT,
  });

  if (!award) {
    return Response.json({ error: "This claim link is not valid" }, { status: 404 });
  }
  if (award.status === "CLAIMED") {
    return Response.json({ error: "This assessment has already been claimed. Please sign in." }, { status: 400 });
  }
  if (award.status === "EXPIRED" || new Date() > award.expiresAt) {
    return Response.json({ error: "This assessment has expired" }, { status: 400 });
  }
  if (!award.professional.email) {
    return Response.json({ error: "No email on file for this award" }, { status: 400 });
  }

  const email = award.professional.email.toLowerCase();

  const existing = await prisma.maarovaUser.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return Response.json({ error: "An account with this email already exists" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const name = displayName(award.professional);

  let result: { user: { id: string; name: string; email: string; role: string }; org: { id: string } };
  try {
    result = await prisma.$transaction(async (tx) => {
      const org = await tx.maarovaOrganisation.create({
        data: {
          name: `${name} (Individual)`,
          type: "individual",
          contactName: name,
          contactEmail: email,
          city: award.professional.city?.trim() || null,
          stream: "DEVELOPMENT",
          maxAssessments: 1,
        },
      });

      const user = await tx.maarovaUser.create({
        data: {
          organisationId: org.id,
          email,
          name,
          passwordHash,
          title: award.professional.currentFacility?.trim() || null,
          yearsInHealthcare: award.professional.yearsOfExperience ?? null,
          isPortalEnabled: true,
          invitedAt: new Date(),
          lastLoginAt: new Date(),
        },
      });

      // Guarded on status so two tabs racing the same link cannot mint two
      // accounts: the second update matches nothing and the transaction rolls
      // the orphan organisation back with it.
      const claimed = await tx.cadreMaarovaAward.updateMany({
        where: { id: award.id, status: "AWARDED" },
        data: { status: "CLAIMED", claimedAt: new Date(), maarovaUserId: user.id },
      });
      if (claimed.count === 0) throw new Error("ALREADY_CLAIMED");

      return { user, org };
    });
  } catch (err) {
    if (err instanceof Error && err.message === "ALREADY_CLAIMED") {
      return Response.json({ error: "This assessment has already been claimed. Please sign in." }, { status: 400 });
    }
    throw err;
  }

  const jwt = signMaarovaJWT({
    sub: result.user.id,
    organisationId: result.org.id,
    name: result.user.name,
    email: result.user.email,
    role: result.user.role,
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
    user: { name: result.user.name, email: result.user.email },
  });
});
