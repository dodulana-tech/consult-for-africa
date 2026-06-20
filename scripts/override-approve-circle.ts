/**
 * Override an algorithmic decline on a Maarova Founding Circle application
 * and approve the candidate. Mirrors POST /api/admin/maarova-circle/:id/approve
 * so the data shape matches what the admin UI and email flows expect.
 *
 * Usage:
 *   set -a; source .env.local 2>/dev/null; set +a
 *   TS_NODE_PROJECT=tsconfig.scripts.json npx ts-node scripts/override-approve-circle.ts <email>
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { emailMaarovaCircleApproved } from "../lib/email";

const prisma = new PrismaClient();

const TOTAL_SLOTS = 50;
const FOUNDING_CIRCLE_CAMPAIGN_NAME = "2026-05 Maarova Founding Circle";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: ts-node scripts/override-approve-circle.ts <email>");
    process.exit(1);
  }

  const application = await prisma.maarovaCircleApplication.findFirst({
    where: { email },
  });
  if (!application) {
    console.error(`No application found for ${email}`);
    process.exit(1);
  }

  console.log(
    `Application: ${application.firstName} ${application.lastName} (${application.email})`,
  );
  console.log(`  Current status: ${application.status}`);
  console.log(`  AI score: ${application.aiScore ?? "n/a"}`);
  console.log(`  Decline reason: ${application.declineReason ?? "(none)"}`);

  if (application.status === "APPROVED" || application.status === "COMPLETED") {
    console.error("Already approved. Nothing to do.");
    return;
  }

  // Slot capacity guard, same as the approve route.
  const approvedCount = await prisma.maarovaCircleApplication.count({
    where: { status: { in: ["APPROVED", "COMPLETED"] } },
  });
  if (approvedCount >= TOTAL_SLOTS) {
    console.error(`All ${TOTAL_SLOTS} slots are full (${approvedCount}). Aborting.`);
    return;
  }
  console.log(`  Slots used: ${approvedCount} / ${TOTAL_SLOTS}`);

  // Pick a reviewer for the audit field. Prefer Debo, else any DIRECTOR.
  const reviewer =
    (await prisma.user.findFirst({ where: { email: "dodulana@gmail.com" } })) ??
    (await prisma.user.findFirst({ where: { role: "DIRECTOR" } }));
  if (!reviewer) {
    console.error("No reviewer User found.");
    return;
  }
  console.log(`  Reviewer: ${reviewer.email}`);

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
      source: "Maarova Founding Circle (admin override of decline)",
      status: "INVITED",
      invitedAt,
      inviteToken,
      tokenExpiresAt,
    },
  });

  await prisma.maarovaCircleApplication.update({
    where: { id: application.id },
    data: {
      status: "APPROVED",
      reviewedById: reviewer.id,
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

  let emailSent = false;
  try {
    await emailMaarovaCircleApproved({
      email: application.email,
      firstName: application.firstName,
      inviteToken,
      discountCode,
    });
    emailSent = true;
  } catch (err) {
    console.error("Email send failed:", err);
  }

  console.log(`\nDone.`);
  console.log(`  Application status: APPROVED`);
  console.log(`  OutreachTarget: ${target.id}`);
  console.log(`  Discount code: ${discountCode}`);
  console.log(`  Email sent: ${emailSent}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
