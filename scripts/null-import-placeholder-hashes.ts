/**
 * One-shot security fix (now de-fanged).
 *
 * History:
 * The bulk Excel importer (scripts/import-doctors-excel.ts) once computed
 * `defaultPasswordHash = hashPassword("CadreHealth2026!")` ONCE and applied
 * the same value to every imported professional. Result: ~4,287 imported
 * doctors shared an identical passwordHash, so anyone who learned the
 * string "CadreHealth2026!" could log in as any of them.
 *
 * The original version of this script nulled every hash with length 161
 * to wipe those placeholders. That was wrong: the reset-password flow
 * also produces 161-char hashes (16-byte salt + 64-byte hash), so it
 * silently wiped legitimate user passwords every time it ran.
 *
 * This rewrite targets only DUPLICATED hashes -- the actual placeholder
 * symptom -- which leaves real resets alone.
 *
 * The reset-password flow has also been updated to use a 32-byte salt
 * (193-char output) so it can never collide with this cleanup again.
 *
 * Run with:
 *   DATABASE_URL=$DIRECT_URL npx tsx scripts/null-import-placeholder-hashes.ts
 */
import { prisma } from "../lib/prisma";

async function main() {
  // Find any passwordHash value shared by 2+ users. Real resets use
  // per-user random salts, so duplicates can only come from the legacy
  // shared-placeholder bug.
  const duplicates = await prisma.$queryRaw<Array<{ hash: string; count: bigint }>>`
    SELECT "passwordHash" as hash, COUNT(*)::bigint as count
    FROM "CadreProfessional"
    WHERE "passwordHash" IS NOT NULL
    GROUP BY "passwordHash"
    HAVING COUNT(*) > 1
  `;

  if (duplicates.length === 0) {
    console.log("No duplicated passwordHashes found. Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  let totalAffected = 0;
  for (const dup of duplicates) {
    const count = Number(dup.count);
    totalAffected += count;
    console.log(`  Hash ${dup.hash.slice(0, 16)}... is shared by ${count} accounts`);
  }
  console.log(`\nTotal accounts with shared placeholder hashes: ${totalAffected}`);

  // Null out the duplicates.
  const result = await prisma.$executeRaw`
    UPDATE "CadreProfessional"
    SET "passwordHash" = NULL
    WHERE "passwordHash" IN (
      SELECT "passwordHash"
      FROM "CadreProfessional"
      WHERE "passwordHash" IS NOT NULL
      GROUP BY "passwordHash"
      HAVING COUNT(*) > 1
    )
  `;
  console.log(`Nulled passwordHash on ${result} rows.`);

  // Verify.
  const after = await prisma.$queryRaw<Array<{ withReal: bigint; withNull: bigint }>>`
    SELECT
      COUNT(*) FILTER (WHERE "passwordHash" IS NOT NULL)::bigint AS "withReal",
      COUNT(*) FILTER (WHERE "passwordHash" IS NULL)::bigint AS "withNull"
    FROM "CadreProfessional"
  `;
  console.log("Final state:", {
    withReal: Number(after[0]?.withReal ?? BigInt(0)),
    withNull: Number(after[0]?.withNull ?? BigInt(0)),
  });

  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
