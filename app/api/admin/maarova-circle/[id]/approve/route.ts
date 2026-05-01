import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { handler } from "@/lib/api-handler";
import { emailMaarovaCircleApproved } from "@/lib/email";

const TOTAL_SLOTS = 50;
const FOUNDING_CIRCLE_CAMPAIGN_NAME = "2026-05 Maarova Founding Circle";

export const POST = handler(async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const application = await prisma.maarovaCircleApplication.findUnique({ where: { id } });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (application.status === "APPROVED" || application.status === "COMPLETED") {
    return NextResponse.json({ error: "Already approved" }, { status: 400 });
  }

  // Check slot availability
  const approvedCount = await prisma.maarovaCircleApplication.count({
    where: { status: { in: ["APPROVED", "COMPLETED"] } },
  });
  if (approvedCount >= TOTAL_SLOTS) {
    return NextResponse.json({ error: "All slots are full" }, { status: 400 });
  }

  // Get/create campaign
  let campaign = await prisma.outreachCampaign.findFirst({
    where: { name: FOUNDING_CIRCLE_CAMPAIGN_NAME },
  });
  if (!campaign) {
    campaign = await prisma.outreachCampaign.create({
      data: {
        name: FOUNDING_CIRCLE_CAMPAIGN_NAME,
        description: "Public-apply Founding Circle.",
        month: "2026-05",
        status: "ACTIVE",
        targetCount: TOTAL_SLOTS,
      },
    });
  }

  // Create OutreachTarget so it appears in /admin/outreach
  const inviteToken = randomBytes(32).toString("base64url");
  const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const discountCode = `FOUNDING-${randomBytes(3).toString("hex").toUpperCase()}`;
  const invitedAt = new Date();

  const target = await prisma.outreachTarget.create({
    data: {
      campaignId: campaign.id,
      name: `${application.firstName} ${application.lastName}`,
      title: application.currentRole,
      organization: application.currentEmployer,
      email: application.email,
      phone: application.phone,
      linkedinUrl: application.linkedinUrl,
      city: application.city,
      source: "Maarova Founding Circle (manual approve)",
      status: "INVITED",
      invitedAt,
      inviteToken,
      tokenExpiresAt,
    },
  });

  await prisma.maarovaCircleApplication.update({
    where: { id },
    data: {
      status: "APPROVED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      outreachTargetId: target.id,
      inviteToken,
      tokenExpiresAt,
      invitedAt,
      coachingDiscountCode: discountCode,
    },
  });

  await prisma.outreachCampaign.update({
    where: { id: campaign.id },
    data: { sentCount: { increment: 1 } },
  });

  // Send approval email
  try {
    await emailMaarovaCircleApproved({
      email: application.email,
      firstName: application.firstName,
      inviteToken,
      discountCode,
    });
  } catch (err) {
    console.error("[approve] email failed:", err);
  }

  return NextResponse.json({ ok: true });
});
