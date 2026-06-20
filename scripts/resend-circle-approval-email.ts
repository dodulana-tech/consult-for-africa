/**
 * Resend the Founding Circle approval email for an already-APPROVED
 * application. Uses the stored inviteToken and discountCode so the recipient
 * lands on the same onboarding flow as the original send.
 *
 * Usage:
 *   set -a; source .env.local 2>/dev/null; set +a
 *   TS_NODE_PROJECT=tsconfig.scripts.json npx ts-node scripts/resend-circle-approval-email.ts <email>
 */
import { PrismaClient } from "@prisma/client";
import { emailMaarovaCircleApproved } from "../lib/email";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: ts-node scripts/resend-circle-approval-email.ts <email>");
    process.exit(1);
  }

  const application = await prisma.maarovaCircleApplication.findFirst({
    where: { email },
  });
  if (!application) {
    console.error(`No application found for ${email}`);
    process.exit(1);
  }
  if (application.status !== "APPROVED") {
    console.error(`Application is ${application.status}, expected APPROVED.`);
    process.exit(1);
  }
  if (!application.inviteToken || !application.coachingDiscountCode) {
    console.error("Application is APPROVED but missing inviteToken or discount code.");
    process.exit(1);
  }

  console.log(`Resending to ${application.firstName} ${application.lastName} <${application.email}>...`);
  await emailMaarovaCircleApproved({
    email: application.email,
    firstName: application.firstName,
    inviteToken: application.inviteToken,
    discountCode: application.coachingDiscountCode,
  });
  console.log("Email sent.");
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
