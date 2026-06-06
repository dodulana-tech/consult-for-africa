/**
 * CadreHealth Contact Enrichment Script
 *
 * Reads CadreOutreachRecord rows in PENDING status, validates the linked
 * professional's email (ZeroBounce) and phone format, then flips status to
 * READY (any valid contact) or UNREACHABLE (neither valid).
 *
 * Preserves the specialty-based `tier` set by /api/cadre/admin/outreach-init.
 * Tier reflects value of the specialty; status reflects contactability.
 *
 * Defaults to DRY RUN because ZeroBounce is paid per email validation.
 *
 * Usage:
 *   npx tsx scripts/enrich-contacts.ts                    # dry-run, all PENDING
 *   npx tsx scripts/enrich-contacts.ts --tier A           # only Tier A
 *   npx tsx scripts/enrich-contacts.ts --tier A,B         # Tier A and B
 *   npx tsx scripts/enrich-contacts.ts --limit 50         # first 50 only
 *   npx tsx scripts/enrich-contacts.ts --tier A --apply   # commit Tier A
 *
 * Env:
 *   ZEROBOUNCE_API_KEY (optional) — without it, falls back to format-only
 *     email validation (free; less accurate but still useful).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ZEROBOUNCE_API_KEY = process.env.ZEROBOUNCE_API_KEY;
const ZEROBOUNCE_DELAY_MS = 100;

// ─── Flag parsing ──────────────────────────────────────────────────────────────

function parseFlags() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");

  const tierIdx = args.indexOf("--tier");
  const tiers = tierIdx >= 0 && args[tierIdx + 1]
    ? args[tierIdx + 1].split(",").map(s => s.trim().toUpperCase()).filter(Boolean)
    : null;

  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 && args[limitIdx + 1]
    ? parseInt(args[limitIdx + 1], 10)
    : null;

  return { apply, tiers, limit };
}

// ─── Validation helpers ────────────────────────────────────────────────────────

function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidNigerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return /^(\+?234|0)[789]\d{9}$/.test(cleaned);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── ZeroBounce ────────────────────────────────────────────────────────────────

interface EmailVerifyResult {
  valid: boolean;
  activityScore: number | null;
  status: string;
  costed: boolean;  // true if a paid ZeroBounce call was made
}

async function verifyEmail(email: string): Promise<EmailVerifyResult> {
  if (!ZEROBOUNCE_API_KEY) {
    const valid = isValidEmailFormat(email);
    return { valid, activityScore: null, status: valid ? "format_ok" : "format_invalid", costed: false };
  }

  try {
    const url = `https://api.zerobounce.net/v2/validate?api_key=${ZEROBOUNCE_API_KEY}&email=${encodeURIComponent(email)}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  [ZeroBounce] HTTP ${res.status} for ${email}`);
      return { valid: isValidEmailFormat(email), activityScore: null, status: "api_error", costed: false };
    }
    const data = await res.json();
    const valid = ["valid", "catch-all"].includes((data.status ?? "").toLowerCase());
    const activityScore = typeof data.activity === "number" ? data.activity : null;
    return { valid, activityScore, status: data.status, costed: true };
  } catch (err) {
    console.warn(`  [ZeroBounce] Error for ${email}:`, err);
    return { valid: isValidEmailFormat(email), activityScore: null, status: "error", costed: false };
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { apply, tiers, limit } = parseFlags();

  console.log("=== CadreHealth Contact Enrichment ===\n");
  console.log(`Mode:   ${apply ? "APPLY (writes to DB)" : "DRY RUN (pass --apply to commit)"}`);
  console.log(`Tier:   ${tiers ? tiers.join(", ") : "all"}`);
  console.log(`Limit:  ${limit ?? "none"}`);
  console.log(`Email validation: ${ZEROBOUNCE_API_KEY ? "ZeroBounce (paid)" : "format-only (free)"}`);
  console.log();

  // Find PENDING outreach records (the ones outreach-init created)
  const records = await prisma.cadreOutreachRecord.findMany({
    where: {
      status: "PENDING",
      ...(tiers ? { tier: { in: tiers } } : {}),
    },
    take: limit ?? undefined,
    select: {
      id: true,
      tier: true,
      professional: {
        select: { id: true, email: true, phone: true, firstName: true, lastName: true, cadre: true, subSpecialty: true },
      },
    },
  });

  console.log(`Found ${records.length} PENDING record(s) matching filter.\n`);

  if (records.length === 0) {
    await prisma.$disconnect();
    return;
  }

  if (!apply && ZEROBOUNCE_API_KEY) {
    // In dry-run we DO NOT call ZeroBounce — that would cost money for no DB change.
    console.log("(dry run skips ZeroBounce calls; pass --apply to actually validate)\n");
  }

  const stats = {
    total: 0,
    readyByEmailAndPhone: 0,
    readyByEmailOnly: 0,
    readyByPhoneOnly: 0,
    unreachable: 0,
    zerobounceCalls: 0,
  };

  for (const rec of records) {
    stats.total++;
    const p = rec.professional;
    const label = `${p.firstName} ${p.lastName} (Tier ${rec.tier ?? "?"})`;

    let emailValid = false;
    let emailActivityScore: number | null = null;
    let zbStatus = "no_email";

    if (p.email) {
      if (apply || !ZEROBOUNCE_API_KEY) {
        const result = await verifyEmail(p.email);
        emailValid = result.valid;
        emailActivityScore = result.activityScore;
        zbStatus = result.status;
        if (result.costed) {
          stats.zerobounceCalls++;
          await sleep(ZEROBOUNCE_DELAY_MS);
        }
      } else {
        // Dry-run with ZeroBounce configured: simulate using format check
        emailValid = isValidEmailFormat(p.email);
        zbStatus = "dry_run_format_only";
      }
    }

    const phoneActive = p.phone ? isValidNigerianPhone(p.phone) : false;

    // Status = contactability; tier stays as-set by outreach-init
    const status = emailValid || phoneActive ? "READY" : "UNREACHABLE";

    if (emailValid && phoneActive) stats.readyByEmailAndPhone++;
    else if (emailValid) stats.readyByEmailOnly++;
    else if (phoneActive) stats.readyByPhoneOnly++;
    else stats.unreachable++;

    console.log(`  ${label}: email=${p.email ?? "—"} (${zbStatus}, valid=${emailValid}) phone=${p.phone ?? "—"} (active=${phoneActive}) -> ${status}`);

    if (apply) {
      await prisma.cadreOutreachRecord.update({
        where: { id: rec.id },
        data: {
          emailValid,
          emailActivityScore,
          phoneActive,
          status,
          // tier intentionally NOT touched — preserves specialty-based assignment
          nextContactAt: status === "READY"
            ? (rec.tier === "A" ? new Date() : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000))
            : null,
        },
      });
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Processed:                 ${stats.total}`);
  console.log(`READY (email + phone):     ${stats.readyByEmailAndPhone}`);
  console.log(`READY (email only):        ${stats.readyByEmailOnly}`);
  console.log(`READY (phone only):        ${stats.readyByPhoneOnly}`);
  console.log(`UNREACHABLE:               ${stats.unreachable}`);
  console.log(`ZeroBounce API calls:      ${stats.zerobounceCalls}`);
  if (!apply) {
    console.log("\nDRY RUN — re-run with --apply to write to DB" + (ZEROBOUNCE_API_KEY ? " and incur ZeroBounce charges." : "."));
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Enrichment failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
