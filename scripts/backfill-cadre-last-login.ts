/**
 * Backfill CadreProfessional.lastLoginAt for historical claims that were
 * missed because the claim route never stamped lastLoginAt (only the login
 * route did, which fires when a user re-authenticates after their session
 * expires).
 *
 * Strategy: for any CadreProfessional with a passwordHash but no
 * lastLoginAt, set lastLoginAt = outreachRecord.profileClaimedAt (or
 * convertedAt as fallback). This is the *floor* — we know they were active
 * at least at that moment, even if they've been back since.
 *
 * Usage:
 *   npx tsx scripts/backfill-cadre-last-login.ts          # dry run
 *   npx tsx scripts/backfill-cadre-last-login.ts --apply  # commit
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  console.log(`Mode: ${apply ? "APPLY" : "DRY RUN (pass --apply to commit)"}`);

  const candidates = await prisma.cadreProfessional.findMany({
    where: { passwordHash: { not: null }, lastLoginAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      outreachRecord: { select: { profileClaimedAt: true, convertedAt: true } },
    },
  });

  console.log(`Candidates: ${candidates.length}`);

  const updates = candidates
    .map((c) => {
      const stamp =
        c.outreachRecord?.profileClaimedAt ??
        c.outreachRecord?.convertedAt ??
        null;
      return stamp ? { id: c.id, stamp, label: `${c.firstName} ${c.lastName}` } : null;
    })
    .filter((u): u is { id: string; stamp: Date; label: string } => u !== null);

  const skipped = candidates.length - updates.length;
  console.log(`To backfill: ${updates.length}`);
  console.log(`Skipped (no claim timestamp available): ${skipped}`);

  if (!apply) {
    console.log("\nDRY RUN — re-run with --apply to write.");
    await prisma.$disconnect();
    return;
  }

  let done = 0;
  for (const u of updates) {
    await prisma.cadreProfessional.update({
      where: { id: u.id },
      data: { lastLoginAt: u.stamp },
    });
    done++;
    if (done % 25 === 0) console.log(`  ... ${done} / ${updates.length}`);
  }
  console.log(`Done. Backfilled ${done} records.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
