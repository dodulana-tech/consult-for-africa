/**
 * Find professionals stuck in the "orphan claim" state:
 * passwordHash is set, but their outreach record is not CONVERTED.
 *
 * This is the May 2026 CADRE_PORTAL_SECRET orphan-state bug surface
 * (DB write committed, JWT signing or some later step threw, user
 * locked out without realising).
 */
import { prisma } from "../lib/prisma";

async function main() {
  const orphans = await prisma.cadreProfessional.findMany({
    where: {
      passwordHash: { not: null },
      outreachRecord: {
        is: { status: { not: "CONVERTED" } },
      },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      accountStatus: true,
      lastLoginAt: true,
      createdAt: true,
      outreachRecord: {
        select: {
          status: true,
          emailSentAt: true,
          contactAttempts: true,
          lastContactedAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { id: "desc" },
  });

  console.log(`Found ${orphans.length} orphan claim records.\n`);
  for (const o of orphans) {
    console.log(
      `[${o.id}] ${o.firstName} ${o.lastName} <${o.email}>  ` +
        `outreach=${o.outreachRecord?.status ?? "none"}  ` +
        `lastLogin=${o.lastLoginAt?.toISOString() ?? "never"}  ` +
        `outreach.lastContacted=${o.outreachRecord?.lastContactedAt?.toISOString() ?? "n/a"}  ` +
        `outreach.updated=${o.outreachRecord?.updatedAt?.toISOString() ?? "n/a"}`,
    );
  }

  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
