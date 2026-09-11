/**
 * Import a ZeptoMail bounce export into CommunicationSuppression.
 *
 * WHY THIS EXISTS. The ZeptoMail webhook was never configured (Webhooks tab:
 * "No webhooks found"), so CommunicationSuppression sat at 0 rows while the
 * account accumulated 2,132 hard bounces on 19,232 sends -- an 11.09% hard
 * bounce rate. Configuring the webhook only helps going forward. Every one of
 * those already-bounced addresses is still a live target in our database, so a
 * re-engagement send would hit them a second time and repeat-bouncing is the
 * fastest route to a blocklisted domain. This back-fills the history.
 *
 * GET THE FILE: ZeptoMail -> Agents -> agent_1 -> Overview -> Bounce categories
 * -> "Open detailed report" -> download icon. Or Suppression List -> export.
 * Set the range to cover 04 May 2026 to today. CSV.
 *
 * WHAT IT DOES, per address:
 *   1. upsert CommunicationSuppression (channel EMAIL, reason BOUNCED)
 *   2. flip any CadreOutreachRecord to UNREACHABLE
 *   3. set emailValid = false so enrichment never re-promotes it
 *
 * Dry run by default. Nothing is written without --commit.
 *
 *   npx tsx --env-file=.env.local scripts/import-zeptomail-bounces.ts <file.csv>
 *   npx tsx --env-file=.env.local scripts/import-zeptomail-bounces.ts <file.csv> --commit
 *
 * Flags:
 *   --commit          actually write
 *   --soft            treat rows as soft bounces (suppress only repeat offenders)
 *   --reason=STRING   override the suppression reason (default BOUNCED)
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const commit = args.includes("--commit");
const soft = args.includes("--soft");
const reason = (args.find((a) => a.startsWith("--reason="))?.split("=")[1] ?? "BOUNCED").toUpperCase();

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

/** Minimal CSV row splitter that respects double-quoted fields. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim().replace(/^"|"$/g, ""));
}

function extractEmails(csv: string): string[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  // Prefer a real recipient column; ZeptoMail has used several names for it.
  const named = header.findIndex((h) =>
    ["email", "email address", "recipient", "to", "to address", "recipient email"].includes(h),
  );

  const emails: string[] = [];
  const startsAtOne = named !== -1 || header.some((h) => !EMAIL_RE.test(h));
  for (const line of lines.slice(startsAtOne ? 1 : 0)) {
    const cells = splitCsvLine(line);
    let value = named !== -1 ? cells[named] : undefined;
    if (!value || !EMAIL_RE.test(value)) value = cells.find((c) => EMAIL_RE.test(c));
    const match = value?.match(EMAIL_RE)?.[0];
    if (match) emails.push(match.toLowerCase());
  }
  return emails;
}

async function main() {
  if (!file) {
    console.error("Usage: npx tsx --env-file=.env.local scripts/import-zeptomail-bounces.ts <file.csv> [--commit]");
    process.exit(1);
  }

  const raw = readFileSync(file, "utf8");
  const all = extractEmails(raw);
  const unique = [...new Set(all)];

  console.log(`file            : ${file}`);
  console.log(`rows with email : ${all.length}`);
  console.log(`unique addresses: ${unique.length}`);
  if (unique.length === 0) {
    console.error("\nNo email addresses found. Check the export has a recipient column.");
    process.exit(1);
  }
  console.log(`sample          : ${unique.slice(0, 3).join(", ")}`);

  const already = await prisma.communicationSuppression.count({
    where: { email: { in: unique }, OR: [{ channel: "EMAIL" }, { channel: null }] },
  });
  const matched = await prisma.cadreProfessional.count({ where: { email: { in: unique } } });

  // How many of these are sitting in the live re-engagement queue right now.
  const inCohort = await prisma.cadreProfessional.count({
    where: {
      email: { in: unique },
      passwordHash: null,
      lastLoginAt: null,
      outreachRecord: {
        is: {
          status: { in: ["EMAIL_SENT", "WHATSAPP_SENT", "WHATSAPP_REPLIED", "SMS_SENT"] },
          contactAttempts: { lt: 5 },
        },
      },
    },
  });

  console.log(`\nalready suppressed          : ${already}`);
  console.log(`match a CadreProfessional   : ${matched}`);
  console.log(`>>> in the re-engagement queue: ${inCohort}   <-- would have been re-mailed`);

  if (!commit) {
    console.log(`\nDRY RUN. Nothing written. Re-run with --commit to suppress ${unique.length - already} addresses.`);
    return;
  }

  let suppressed = 0, flipped = 0, invalidated = 0;
  for (const email of unique) {
    await prisma.communicationSuppression.upsert({
      where: { email_channel: { email, channel: "EMAIL" } },
      update: { reason, notes: `ZeptoMail ${soft ? "soft" : "hard"} bounce, imported ${new Date().toISOString().slice(0, 10)}` },
      create: {
        email,
        channel: "EMAIL",
        reason,
        notes: `ZeptoMail ${soft ? "soft" : "hard"} bounce, imported ${new Date().toISOString().slice(0, 10)}`,
      },
    });
    suppressed++;

    const pro = await prisma.cadreProfessional.findUnique({
      where: { email },
      select: { outreachRecord: { select: { id: true, status: true } } },
    });
    if (pro?.outreachRecord) {
      await prisma.cadreOutreachRecord.update({
        where: { id: pro.outreachRecord.id },
        data: {
          emailValid: false,
          ...(pro.outreachRecord.status !== "UNREACHABLE"
            ? { status: "UNREACHABLE", notes: "Hard bounce imported from ZeptoMail" }
            : {}),
        },
      });
      invalidated++;
      if (pro.outreachRecord.status !== "UNREACHABLE") flipped++;
    }
    if (suppressed % 250 === 0) console.log(`  ...${suppressed}/${unique.length}`);
  }

  console.log(`\nsuppression rows written : ${suppressed}`);
  console.log(`outreach -> UNREACHABLE  : ${flipped}`);
  console.log(`emailValid set false     : ${invalidated}`);
  console.log(`suppression table total  : ${await prisma.communicationSuppression.count()}`);
}

main().finally(() => prisma.$disconnect());
