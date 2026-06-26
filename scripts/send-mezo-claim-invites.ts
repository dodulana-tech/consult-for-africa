/**
 * Send Mezo "claim your profile" invitations to CadreHealth-registered doctors,
 * over the CadreHealth-branded email channel (ZeptoMail via sendCadreEmail).
 *
 * Input: the token map produced by Mezo's seed-cadre-claims.ts —
 *   scripts/data/cadre-claim-tokens.json
 *   [{ email, firstName, lastName, specialty, everLoggedIn, claimToken, claimUrl }]
 *
 * Each recipient gets a unique /claim/<token> link that activates the profile
 * Mezo reserved for them. We check the platform suppression list first and keep
 * a local sent-log so re-runs never double-send.
 *
 * Usage:
 *   npx tsx scripts/send-mezo-claim-invites.ts                      # DRY RUN (default)
 *   npx tsx scripts/send-mezo-claim-invites.ts --to you@email.com   # send ONE test to this address
 *   npx tsx scripts/send-mezo-claim-invites.ts --warm-only --apply  # send to logged-in cohort only
 *   npx tsx scripts/send-mezo-claim-invites.ts --apply              # real send to everyone not yet sent
 *
 * Flags:
 *   --apply        actually send (omit = dry run, sends nothing)
 *   --warm-only    only recipients who logged in to CadreHealth (everLoggedIn)
 *   --limit N      process first N recipients
 *   --to <email>   send all generated mails to this address instead (self-test)
 *   --delay <ms>   pause between sends (default 400ms)
 *   --file <path>  token map path (default scripts/data/cadre-claim-tokens.json)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { PrismaClient } from "@prisma/client";
import { sendCadreEmail } from "@/lib/cadreEmail";

const prisma = new PrismaClient();

interface ClaimEntry {
  email: string;
  firstName: string;
  lastName: string;
  specialty: string;
  everLoggedIn: boolean;
  claimToken: string;
  claimUrl: string;
}

function parseFlags() {
  const a = process.argv.slice(2);
  const get = (flag: string) => {
    const i = a.indexOf(flag);
    return i >= 0 ? a[i + 1] : null;
  };
  return {
    apply: a.includes("--apply"),
    warmOnly: a.includes("--warm-only"),
    limit: get("--limit") ? parseInt(get("--limit")!, 10) : null,
    overrideTo: get("--to"),
    delay: get("--delay") ? parseInt(get("--delay")!, 10) : 400,
    file: get("--file") ?? resolve(__dirname, "data/cadre-claim-tokens.json"),
  };
}

const SENT_LOG = resolve(__dirname, "out/mezo-invite-sent.json");

function loadSent(): Set<string> {
  if (!existsSync(SENT_LOG)) return new Set();
  try {
    return new Set<string>(JSON.parse(readFileSync(SENT_LOG, "utf8")));
  } catch {
    return new Set();
  }
}
function saveSent(set: Set<string>) {
  mkdirSync(dirname(SENT_LOG), { recursive: true });
  writeFileSync(SENT_LOG, JSON.stringify([...set], null, 2));
}

async function isSuppressed(email: string): Promise<boolean> {
  const hit = await prisma.communicationSuppression.findFirst({
    where: { email: email.toLowerCase(), OR: [{ channel: "EMAIL" }, { channel: null }] },
    select: { id: true },
  });
  return !!hit;
}

function titleCase(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\bMc([a-z])/g, (_, c) => "Mc" + c.toUpperCase())
    .trim();
}

function buildEmail(r: ClaimEntry, claimUrl: string) {
  const surname = titleCase(r.lastName) || titleCase(r.firstName) || "Doctor";
  return {
    subject: `Dr ${surname}, your Mezo practice profile is ready`,
    heading: "Start taking patient bookings on Mezo",
    body:
      `Dr ${surname}, as a CadreHealth member you have early access to Mezo — where verified ` +
      `specialists run a private practice without owning a clinic. We've reserved ` +
      `a ${r.specialty} profile for you. Activate it in about two minutes: set a ` +
      `password, confirm your MDCN folio, and you're ready to receive bookings from patients.`,
    ctaText: "Activate My Profile",
    ctaHref: claimUrl,
    footer:
      "This invitation link is unique to you and expires in 30 days. " +
      "If you didn't expect this email, you can safely ignore it.",
  };
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function main() {
  const { apply, warmOnly, limit, overrideTo, delay, file } = parseFlags();

  console.log(`Mode:        ${apply ? "APPLY (real sends via ZeptoMail)" : "DRY RUN (nothing sent)"}`);
  console.log(`Channel:     CadreHealth (sendCadreEmail)`);
  if (warmOnly) console.log(`Cohort:      warm only (logged in to CadreHealth)`);
  if (limit) console.log(`Limit:       ${limit}`);
  if (overrideTo) console.log(`Override to: ${overrideTo} (self-test)`);
  console.log(`Token file:  ${file}`);
  console.log();

  if (apply && !process.env.ZEPTOMAIL_API_KEY && !process.env.SMTP_USER) {
    console.error("✗ No email transport configured (ZEPTOMAIL_API_KEY / SMTP_USER). Aborting.");
    process.exit(1);
  }

  let entries: ClaimEntry[] = JSON.parse(readFileSync(file, "utf8"));
  if (warmOnly) entries = entries.filter((e) => e.everLoggedIn);
  if (limit) entries = entries.slice(0, limit);

  const sent = loadSent();
  let ok = 0, skippedSent = 0, suppressed = 0, failed = 0;

  for (const r of entries) {
    const email = r.email.toLowerCase();

    if (!overrideTo && sent.has(email)) { skippedSent++; continue; }
    if (await isSuppressed(email)) { suppressed++; console.log(`  ⊘ suppressed: ${email}`); continue; }

    const mail = buildEmail(r, r.claimUrl);
    const target = overrideTo ?? r.email;

    if (!apply) {
      console.log(`  [dry] -> ${target}  |  ${mail.subject}  |  ${r.claimUrl}`);
      ok++;
      continue;
    }

    try {
      await sendCadreEmail({ to: target, ...mail });
      if (!overrideTo) { sent.add(email); saveSent(sent); }
      ok++;
      console.log(`  ✓ sent -> ${target}`);
      await sleep(delay);
    } catch (err) {
      failed++;
      console.error(`  ✗ failed -> ${target}:`, (err as Error).message);
    }
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Recipients in scope: ${entries.length}`);
  console.log(`${apply ? "Sent" : "Would send"}:        ${ok}`);
  console.log(`Already sent (skip):  ${skippedSent}`);
  console.log(`Suppressed:           ${suppressed}`);
  console.log(`Failed:               ${failed}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
