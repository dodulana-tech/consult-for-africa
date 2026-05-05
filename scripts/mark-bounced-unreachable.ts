/**
 * Bulk-mark cadre outreach records as UNREACHABLE based on a list of
 * bounced email addresses. Intended for cleaning up bounces from the 2019
 * NMA list after they flood the hello@ inbox.
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx scripts/mark-bounced-unreachable.ts <path-to-emails.txt>
 *
 * The input file is a plain text or CSV file with one email per line.
 *   - Lines starting with # are treated as comments and skipped.
 *   - Blank lines are skipped.
 *   - Whitespace and case are normalised.
 *
 * For each email:
 *   1. The matching CadreProfessional is located by lowercase email.
 *   2. Their CadreOutreachRecord is set to status=UNREACHABLE with
 *      contactAttempts incremented and lastContactedAt stamped.
 *   3. A CommunicationSuppression entry is upserted with reason=BOUNCED
 *      and channel=EMAIL so future Compose Email blasts skip them too.
 *
 * The script prints a summary at the end. It is idempotent: running it
 * twice on the same file does nothing on the second run.
 */

import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Result {
  marked: number;
  alreadyUnreachable: number;
  notFound: number;
  suppressed: number;
  errors: { email: string; error: string }[];
}

function parseFile(path: string): string[] {
  const raw = readFileSync(path, "utf-8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      // Tolerate CSV-ish input: "email,reason" or "email\treason" -- take
      // the first field.
      const first = line.split(/[,\t]/)[0]?.trim() ?? "";
      return first.toLowerCase();
    })
    .filter((email) => email.includes("@"));
}

async function processOne(email: string, result: Result): Promise<void> {
  const pro = await prisma.cadreProfessional.findUnique({
    where: { email },
    include: { outreachRecord: true },
  });

  if (!pro) {
    result.notFound++;
    return;
  }

  if (pro.outreachRecord) {
    if (pro.outreachRecord.status === "UNREACHABLE") {
      result.alreadyUnreachable++;
    } else {
      await prisma.cadreOutreachRecord.update({
        where: { id: pro.outreachRecord.id },
        data: {
          status: "UNREACHABLE",
          contactAttempts: { increment: 1 },
          lastContactedAt: new Date(),
          notes: pro.outreachRecord.notes
            ? `${pro.outreachRecord.notes}\n[bounced ${new Date().toISOString().slice(0, 10)}]`
            : `Bounced at ${new Date().toISOString().slice(0, 10)}`,
        },
      });
      result.marked++;
    }
  } else {
    // No outreach record, but still add suppression so they never get
    // included in a future audience send.
  }

  // Add to suppression list (idempotent via the @@unique([email, channel]))
  try {
    await prisma.communicationSuppression.upsert({
      where: { email_channel: { email, channel: "EMAIL" } },
      update: {},
      create: {
        email,
        channel: "EMAIL",
        reason: "BOUNCED",
        notes: "Bulk-suppressed from bounce list",
      },
    });
    result.suppressed++;
  } catch (err) {
    result.errors.push({
      email,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: npx tsx scripts/mark-bounced-unreachable.ts <path>");
    process.exit(1);
  }

  const emails = parseFile(path);
  console.log(`Loaded ${emails.length} email addresses from ${path}`);

  const result: Result = {
    marked: 0,
    alreadyUnreachable: 0,
    notFound: 0,
    suppressed: 0,
    errors: [],
  };

  let processed = 0;
  for (const email of emails) {
    await processOne(email, result);
    processed++;
    if (processed % 50 === 0) {
      console.log(
        `  ...processed ${processed}/${emails.length} (marked ${result.marked}, not found ${result.notFound})`,
      );
    }
  }

  console.log("");
  console.log("=== SUMMARY ===");
  console.log(`Input emails:                 ${emails.length}`);
  console.log(`Newly marked UNREACHABLE:     ${result.marked}`);
  console.log(`Already UNREACHABLE:          ${result.alreadyUnreachable}`);
  console.log(`Not found in CadreProfessional: ${result.notFound}`);
  console.log(`Suppression entries written:  ${result.suppressed}`);
  if (result.errors.length > 0) {
    console.log(`Errors (${result.errors.length}):`);
    for (const e of result.errors.slice(0, 10)) {
      console.log(`  - ${e.email}: ${e.error}`);
    }
  }
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
