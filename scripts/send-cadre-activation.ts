/**
 * Send the activation email to CadreProfessionals who claimed but never
 * actually signed in (passwordHash set, lastLoginAt null).
 *
 * The lastLoginAt heartbeat we just shipped means future iterations of this
 * can also target stale-30d cohorts honestly. For this first run, the
 * never-signed-in set is the only one we can identify with confidence.
 *
 * Usage:
 *   npx tsx scripts/send-cadre-activation.ts               # dry-run (recommended first)
 *   npx tsx scripts/send-cadre-activation.ts --limit 3 --apply --to your@email  # send only to specified email
 *   npx tsx scripts/send-cadre-activation.ts --apply       # commit, real send
 *
 * Behaviour:
 *   - Default: dry-run, prints recipients, sends nothing
 *   - --limit N: process first N recipients only
 *   - --to <email>: override recipient address (useful for self-testing)
 *   - --apply: actually send
 */
import { PrismaClient } from "@prisma/client";
import { sendActivationEmail } from "@/lib/cadreHealth/activationEmail";

const prisma = new PrismaClient();

function parseFlags() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : null;
  const toIdx = args.indexOf("--to");
  const overrideTo = toIdx >= 0 ? args[toIdx + 1] : null;
  return { apply, limit, overrideTo };
}

async function main() {
  const { apply, limit, overrideTo } = parseFlags();
  console.log(`Mode:        ${apply ? "APPLY (real sends)" : "DRY RUN"}`);
  if (limit) console.log(`Limit:       ${limit}`);
  if (overrideTo) console.log(`Override to: ${overrideTo}`);
  console.log();

  const recipients = await prisma.cadreProfessional.findMany({
    where: { passwordHash: { not: null }, lastLoginAt: null },
    select: { id: true, firstName: true, lastName: true, email: true, subSpecialty: true, outreachRecord: { select: { tier: true } } },
    orderBy: [{ outreachRecord: { tier: "asc" } }, { id: "asc" }], // Tier A first
    take: limit ?? undefined,
  });

  console.log(`Target cohort: ${recipients.length}`);
  const byTier = recipients.reduce<Record<string, number>>((acc, r) => {
    const k = r.outreachRecord?.tier ?? "no-outreach";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  console.log(`By tier:       ${JSON.stringify(byTier)}`);
  console.log();

  if (!apply) {
    console.log("Sample (first 10):");
    for (const r of recipients.slice(0, 10)) {
      const tier = r.outreachRecord?.tier ?? "—";
      console.log(`  [tier ${tier}] ${r.firstName} ${r.lastName} <${r.email}> (${r.subSpecialty ?? "no specialty"})`);
    }
    console.log("\nDRY RUN — re-run with --apply to send.");
    if (overrideTo) {
      console.log(`Tip: --apply --limit 1 --to ${overrideTo} sends ONE email to ${overrideTo} for visual review before the full send.`);
    }
    await prisma.$disconnect();
    return;
  }

  console.log(`Sending ${recipients.length} email(s)...`);
  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    const target = overrideTo ? { ...r, email: overrideTo } : r;
    const result = await sendActivationEmail(target);
    if (result.ok) {
      sent++;
      console.log(`  ✓ ${target.firstName} ${target.lastName} -> ${target.email}`);
    } else {
      failed++;
      console.log(`  ✗ ${target.firstName} ${target.lastName} -> ${target.email}: ${result.error}`);
    }
    // Light pacing: 250ms between sends so we don't trigger Zoho/ZeptoMail rate caps
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`\nSent: ${sent}, Failed: ${failed}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
