/**
 * Send welcome-back email to recent signups who may have hit login issues.
 *
 * Run with: npx tsx scripts/send-welcome-back.ts
 */

import { prisma } from "@/lib/prisma";
import { sendCadreEmail } from "@/lib/cadreEmail";

const TARGET_EMAILS = [
  "emma.k.okereke@gmail.com",
  "adereleadeolamary@gmail.com",
  "adereleadeola@yahoo.com",
  "dr.ikpe@yahoo.com",
];

async function main() {
  for (const email of TARGET_EMAILS) {
    const pro = await prisma.cadreProfessional.findUnique({
      where: { email },
      select: { firstName: true, email: true },
    });

    if (!pro) {
      console.log(`SKIP: ${email} not found`);
      continue;
    }

    try {
      await sendCadreEmail({
        to: pro.email,
        subject: `${pro.firstName}, your CadreHealth profile is ready`,
        heading: "Welcome to CadreHealth",
        body: `Hi ${pro.firstName},\n\nThank you for creating your CadreHealth profile. We had a brief server issue that may have affected your first login attempt. That has been resolved.\n\nYour account is active and ready to use. Here is what you can do right now:\n\n- Browse and review hospitals across Nigeria\n- See salary data for your cadre\n- Check your career readiness score\n- Build your verified professional profile\n\nSign in to get started.`,
        ctaText: "Sign in to CadreHealth",
        ctaHref: "https://consultforafrica.com/oncadre/login",
        footer: "If you have any issues signing in, use the Forgot Password link on the login page. If you did not create this account, you can safely ignore this email.",
      });

      console.log(`SENT: ${pro.firstName} (${pro.email})`);
    } catch (err) {
      console.error(`FAILED: ${email}`, err instanceof Error ? err.message : err);
    }
  }
}

main()
  .catch((e) => {
    console.error("Script failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
