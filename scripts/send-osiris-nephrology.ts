/**
 * Send the Osiris Health Consultant Nephrologist mandate email to every
 * nephrologist in the CadreProfessional DB.
 *
 * Targeting: subSpecialty contains "Nephrol" (case-insensitive), valid email,
 * not flagged as unreachable.
 *
 * Usage:
 *   npx tsx scripts/send-osiris-nephrology.ts                                  # dry-run, lists recipients
 *   npx tsx scripts/send-osiris-nephrology.ts --limit 1 --to dodulana@gmail.com --apply  # self-test
 *   npx tsx scripts/send-osiris-nephrology.ts --apply                          # full batch
 */
import { PrismaClient } from "@prisma/client";
import { sendOsirisNephrologyEmail } from "@/lib/cadreHealth/osirisNephrologyEmail";

const prisma = new PrismaClient();

function parseFlags() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : null;
  const skipIdx = args.indexOf("--skip");
  const skip = skipIdx >= 0 ? parseInt(args[skipIdx + 1], 10) : 0;
  const toIdx = args.indexOf("--to");
  const overrideTo = toIdx >= 0 ? args[toIdx + 1] : null;
  return { apply, limit, skip, overrideTo };
}

async function main() {
  const { apply, limit, skip, overrideTo } = parseFlags();
  console.log(`Mode:        ${apply ? "APPLY (real sends)" : "DRY RUN"}`);
  if (limit) console.log(`Limit:       ${limit}`);
  if (skip) console.log(`Skip:        ${skip}`);
  if (overrideTo) console.log(`Override to: ${overrideTo}`);
  console.log();

  // Supabase pooler intermittently rejects the initial connection. Retry up
  // to 5 times with exponential backoff before giving up.
  const fetchRecipients = async () =>
    prisma.cadreProfessional.findMany({
      where: {
        subSpecialty: { contains: "Nephrol", mode: "insensitive" },
        email: { not: { contains: "@cadrehealth.system" } },
      },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { id: "asc" },
      skip: skip || undefined,
      take: limit ?? undefined,
    });

  let recipients: Awaited<ReturnType<typeof fetchRecipients>> | null = null;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      recipients = await fetchRecipients();
      break;
    } catch (err) {
      lastErr = err;
      console.warn(`  [db] attempt ${attempt}/5 failed: ${err instanceof Error ? err.message.split("\n")[0] : err}`);
      if (attempt < 5) await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  if (!recipients) throw lastErr;

  console.log(`Nephrologists matched: ${recipients.length}`);
  console.log();

  if (!apply) {
    console.log("Sample (first 10):");
    for (const r of recipients.slice(0, 10)) {
      console.log(`  ${r.firstName} ${r.lastName} <${r.email}>`);
    }
    if (recipients.length > 10) console.log(`  ... and ${recipients.length - 10} more`);
    console.log("\nDRY RUN — re-run with --apply to send.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Sending ${recipients.length} email(s)...`);
  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    const target = overrideTo ? { ...r, email: overrideTo } : r;
    const result = await sendOsirisNephrologyEmail(target);
    if (result.ok) {
      sent++;
      console.log(`  ✓ ${target.firstName} ${target.lastName} -> ${target.email}`);
    } else {
      failed++;
      console.log(`  ✗ ${target.firstName} ${target.lastName} -> ${target.email}: ${result.error}`);
    }
    // Pacing: 300ms between sends to stay within Zoho/ZeptoMail caps.
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log(`\nSent: ${sent}, Failed: ${failed}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
