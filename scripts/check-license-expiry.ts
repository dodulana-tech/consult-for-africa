/**
 * Daily license expiry check script.
 * Run with: npx tsx scripts/check-license-expiry.ts
 *
 * Finds CadreCredentials expiring within 30 days and creates
 * LICENSE_EXPIRY notifications (skipping if one was sent in the last 7 days).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Find credentials expiring within 30 days
  const expiringCredentials = await prisma.cadreCredential.findMany({
    where: {
      expiryDate: {
        gte: now,
        lte: thirtyDaysFromNow,
      },
    },
    select: {
      id: true,
      professionalId: true,
      type: true,
      regulatoryBody: true,
      expiryDate: true,
    },
  });

  console.log(
    `Found ${expiringCredentials.length} credential(s) expiring within 30 days.`
  );

  let created = 0;
  let skipped = 0;

  for (const cred of expiringCredentials) {
    if (!cred.expiryDate) continue;

    // Check if a LICENSE_EXPIRY notification was already sent in the last 7 days
    const recentNotification = await prisma.cadreNotification.findFirst({
      where: {
        professionalId: cred.professionalId,
        type: "LICENSE_EXPIRY",
        createdAt: { gte: sevenDaysAgo },
        message: { contains: cred.type },
      },
    });

    if (recentNotification) {
      skipped++;
      continue;
    }

    const daysLeft = Math.ceil(
      (cred.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const urgency =
      daysLeft <= 7
        ? "expires in " + daysLeft + " days"
        : "expires on " +
          cred.expiryDate.toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

    await prisma.cadreNotification.create({
      data: {
        professionalId: cred.professionalId,
        type: "LICENSE_EXPIRY",
        title: "License expiring soon",
        message: `Your ${cred.type} (${cred.regulatoryBody}) ${urgency}. Renew it to keep your profile verified.`,
        link: "/oncadre/profile#credentials",
      },
    });

    created++;
  }

  console.log(
    `Done. Created ${created} notification(s), skipped ${skipped} (already notified recently).`
  );
}

main()
  .catch((err) => {
    console.error("License expiry check failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
