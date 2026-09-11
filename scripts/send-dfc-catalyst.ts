/**
 * Send the DFC Catalyst Series invitation + specialist-network introduction to
 * the CONVERTED CadreHealth cohort (professionals who claimed their profile).
 *
 * Targeting: CadreProfessional whose outreachRecord.status = CONVERTED, real
 * (non-system) email. This is the 396-person "converted" cohort.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/send-dfc-catalyst.ts                                   # dry-run
 *   npx tsx --env-file=.env.local scripts/send-dfc-catalyst.ts --limit 1 --to you@x.com --apply  # self-test
 *   npx tsx --env-file=.env.local scripts/send-dfc-catalyst.ts --apply                            # full batch
 */
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { sendDfcCatalystEmail } from "@/lib/cadreHealth/dfcCatalystEmail";

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
  // --exclude-file <path>: newline-delimited emails to skip (already delivered).
  const exclIdx = args.indexOf("--exclude-file");
  const excludeFile = exclIdx >= 0 ? args[exclIdx + 1] : null;
  return { apply, limit, skip, overrideTo, excludeFile };
}

function loadExclude(path: string | null): Set<string> {
  if (!path) return new Set();
  const raw = fs.readFileSync(path, "utf8");
  return new Set(
    raw
      .split("\n")
      .map((l) => l.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function main() {
  const { apply, limit, skip, overrideTo, excludeFile } = parseFlags();
  const exclude = loadExclude(excludeFile);
  console.log(`Mode:        ${apply ? "APPLY (real sends)" : "DRY RUN"}`);
  if (limit) console.log(`Limit:       ${limit}`);
  if (skip) console.log(`Skip:        ${skip}`);
  if (overrideTo) console.log(`Override to: ${overrideTo}`);
  if (excludeFile) console.log(`Exclude:     ${exclude.size} address(es) from ${excludeFile}`);
  console.log();

  // Supabase pooler intermittently rejects the initial connection. Retry up
  // to 5 times with exponential backoff before giving up.
  const fetchRecipients = async () =>
    prisma.cadreProfessional.findMany({
      where: {
        email: { not: { contains: "@cadrehealth.system" } },
        outreachRecord: { status: "CONVERTED" },
      },
      select: { id: true, firstName: true, lastName: true, email: true, cadre: true },
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

  const matchedCount = recipients.length;
  if (exclude.size) {
    recipients = recipients.filter((r) => !exclude.has(r.email.trim().toLowerCase()));
  }

  console.log(`Converted professionals matched: ${matchedCount}`);
  if (exclude.size) console.log(`After excluding already-sent:    ${recipients.length}`);
  console.log();

  if (!apply) {
    console.log("Sample (first 10):");
    for (const r of recipients.slice(0, 10)) {
      console.log(`  [${r.cadre}] ${r.firstName} ${r.lastName} <${r.email}>`);
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
    const result = await sendDfcCatalystEmail(target);
    if (result.ok) {
      sent++;
      console.log(`  ok ${target.firstName} ${target.lastName} -> ${target.email}`);
    } else {
      failed++;
      console.log(`  FAIL ${target.firstName} ${target.lastName} -> ${target.email}: ${result.error}`);
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
