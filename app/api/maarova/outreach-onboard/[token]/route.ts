import { prisma } from "@/lib/prisma";
import { signMaarovaJWT } from "@/lib/maarovaAuth";
import { isRateLimited } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// NO AUTH REQUIRED - token-based access for outreach targets

/**
 * GET - Validate token and return pre-filled data
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip, "outreach-onboard", { windowMs: 60_000, max: 15 })) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { token } = await params;

  const target = await prisma.outreachTarget.findUnique({
    where: { inviteToken: token },
    include: {
      campaign: { select: { id: true, name: true } },
    },
  });

  if (!target) {
    return Response.json({ error: "invalid_token", message: "This invitation link is not valid." }, { status: 404 });
  }

  if (target.tokenExpiresAt && new Date() > target.tokenExpiresAt) {
    return Response.json({ error: "expired", message: "This invitation has expired. Please contact hello@consultforafrica.com for a new one." }, { status: 400 });
  }

  // If they already onboarded, tell them to log in
  if (target.maarovaUserId) {
    return Response.json({ error: "already_onboarded", message: "You have already created your account. Please log in to continue." }, { status: 400 });
  }

  // Check if email is already a MaarovaUser (they might have been added via org)
  if (target.email) {
    const existing = await prisma.maarovaUser.findUnique({ where: { email: target.email.toLowerCase() } });
    if (existing) {
      return Response.json({
        error: "already_registered",
        message: "An account with this email already exists. Please log in at the Maarova portal.",
      }, { status: 400 });
    }
  }

  return Response.json({
    name: target.name,
    email: target.email ?? "",
    title: target.title ?? "",
    organization: target.organization ?? "",
    city: target.city ?? "",
    campaignName: target.campaign.name,
  });
}

/**
 * POST - Create account, log in, redirect to assessment
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip, "outreach-onboard-submit", { windowMs: 3_600_000, max: 5 })) {
    return Response.json({ error: "Too many attempts" }, { status: 429 });
  }

  const { token } = await params;
  const body = await req.json();
  const { password, name, title, organization, city, yearsInHealthcare, clinicalBackground } = body;

  if (!password || password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const target = await prisma.outreachTarget.findUnique({
    where: { inviteToken: token },
    include: { campaign: { select: { id: true, name: true } } },
  });

  if (!target) {
    return Response.json({ error: "Invalid invitation link" }, { status: 404 });
  }
  if (target.tokenExpiresAt && new Date() > target.tokenExpiresAt) {
    return Response.json({ error: "This invitation has expired" }, { status: 400 });
  }
  if (target.maarovaUserId) {
    return Response.json({ error: "Account already created. Please log in." }, { status: 400 });
  }
  if (!target.email) {
    return Response.json({ error: "No email on file for this invitation" }, { status: 400 });
  }

  const email = target.email.toLowerCase();

  // Double-check no existing user
  const existing = await prisma.maarovaUser.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "An account with this email already exists" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Create an "Individual / Outreach" organisation for this person
  const orgName = organization?.trim() || `${name.trim()} (Individual)`;

  const result = await prisma.$transaction(async (tx) => {
    // Create or find organisation
    const org = await tx.maarovaOrganisation.create({
      data: {
        name: orgName,
        type: "outreach",
        contactName: name.trim(),
        contactEmail: email,
        city: city?.trim() || null,
        stream: "RECRUITMENT",
        maxAssessments: 1,
      },
    });

    // Create the MaarovaUser
    const user = await tx.maarovaUser.create({
      data: {
        organisationId: org.id,
        email,
        name: name.trim(),
        passwordHash,
        title: title?.trim() || null,
        yearsInHealthcare: yearsInHealthcare ? parseInt(yearsInHealthcare) : null,
        clinicalBackground: clinicalBackground?.trim() || null,
        isPortalEnabled: true,
        invitedAt: target.invitedAt,
        lastLoginAt: new Date(),
        outreachCampaignId: target.campaignId,
        outreachTargetId: target.id,
      },
    });

    // Link outreach target to the new user + update status
    await tx.outreachTarget.update({
      where: { id: target.id },
      data: {
        maarovaUserId: user.id,
        status: "RESPONDED",
        respondedAt: new Date(),
      },
    });

    // Update campaign responded count
    const respondedCount = await tx.outreachTarget.count({
      where: {
        campaignId: target.campaignId,
        status: { in: ["RESPONDED", "ASSESSMENT_STARTED", "ASSESSMENT_COMPLETED"] },
      },
    });
    await tx.outreachCampaign.update({
      where: { id: target.campaignId },
      data: { respondedCount },
    });

    return { user, org };
  });

  // Sign JWT and set cookie (same as normal Maarova login)
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
}
