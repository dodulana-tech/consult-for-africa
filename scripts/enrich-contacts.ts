/**
 * CadreHealth Contact Enrichment Script
 *
 * Enriches imported CadreProfessional records with email validation
 * (ZeroBounce) and phone format checks, then segments into outreach tiers.
 *
 * Run: npx tsx scripts/enrich-contacts.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ZEROBOUNCE_API_KEY = process.env.ZEROBOUNCE_API_KEY;
const BATCH_SIZE = 100;
const DELAY_MS = 100; // Be nice to ZeroBounce rate limits

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Basic email format check */
function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Nigerian phone format validation: accepts +234..., 234..., 0... */
function isValidNigerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return /^(\+?234|0)[789]\d{9}$/.test(cleaned);
}

/** Normalize phone to international format without + (e.g. 2348034531236) */
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+234")) return cleaned.slice(1);
  if (cleaned.startsWith("234")) return cleaned;
  if (cleaned.startsWith("0")) return "234" + cleaned.slice(1);
  return cleaned;
}

// ─── ZeroBounce Email Verification ───────────────────────────────────────────

interface ZeroBounceResult {
  valid: boolean;
  activityScore: number | null;
  status: string;
}

async function verifyEmailZeroBounce(email: string): Promise<ZeroBounceResult> {
  if (!ZEROBOUNCE_API_KEY) {
    // No API key: fall back to format check only
    const valid = isValidEmailFormat(email);
    return { valid, activityScore: null, status: valid ? "format_ok" : "format_invalid" };
  }

  try {
    const url = `https://api.zerobounce.net/v2/validate?api_key=${ZEROBOUNCE_API_KEY}&email=${encodeURIComponent(email)}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  [ZeroBounce] HTTP ${res.status} for ${email}`);
      return { valid: isValidEmailFormat(email), activityScore: null, status: "api_error" };
    }
    const data = await res.json();
    const validStatuses = ["valid", "catch-all"];
    const valid = validStatuses.includes(data.status?.toLowerCase());
    const activityScore = typeof data.activity === "number" ? data.activity : null;
    return { valid, activityScore, status: data.status };
  } catch (err) {
    console.warn(`  [ZeroBounce] Error for ${email}:`, err);
    return { valid: isValidEmailFormat(email), activityScore: null, status: "error" };
  }
}

// ─── Tier Assignment ─────────────────────────────────────────────────────────

function assignTier(emailValid: boolean, phoneActive: boolean): "A" | "B" | "C" {
  if (emailValid && phoneActive) return "A";
  if (emailValid || phoneActive) return "B";
  return "C";
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== CadreHealth Contact Enrichment ===\n");

  if (ZEROBOUNCE_API_KEY) {
    console.log("[config] ZeroBounce API key found. Will verify emails via API.");
  } else {
    console.log("[config] No ZEROBOUNCE_API_KEY set. Using format-only email validation.");
  }

  // Find professionals without an outreach record yet
  const professionals = await prisma.cadreProfessional.findMany({
    where: {
      outreachRecord: null,
    },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      cadre: true,
    },
  });

  console.log(`\nFound ${professionals.length} professionals without outreach records.\n`);

  if (professionals.length === 0) {
    console.log("Nothing to enrich. Exiting.");
    await prisma.$disconnect();
    return;
  }

  const stats = { total: 0, tierA: 0, tierB: 0, tierC: 0, emailsVerified: 0, phonesChecked: 0 };

  // Process in batches
  for (let i = 0; i < professionals.length; i += BATCH_SIZE) {
    const batch = professionals.slice(i, i + BATCH_SIZE);
    console.log(`\n--- Batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} records) ---`);

    for (const prof of batch) {
      stats.total++;
      const label = `${prof.firstName} ${prof.lastName} (${prof.cadre})`;

      // Step 1: Create outreach record in ENRICHING state
      const outreachRecord = await prisma.cadreOutreachRecord.create({
        data: {
          professionalId: prof.id,
          status: "ENRICHING",
        },
      });

      let emailValid = false;
      let emailActivityScore: number | null = null;
      let phoneActive = false;

      // Step 2: Email verification
      if (prof.email) {
        const result = await verifyEmailZeroBounce(prof.email);
        emailValid = result.valid;
        emailActivityScore = result.activityScore;
        stats.emailsVerified++;

        console.log(`  [email] ${label}: ${prof.email} -> ${result.status} (valid: ${emailValid})`);

        if (ZEROBOUNCE_API_KEY) {
          await sleep(DELAY_MS);
        }
      }

      // Step 3: Phone verification
      if (prof.phone) {
        const normalized = normalizePhone(prof.phone);
        phoneActive = isValidNigerianPhone(prof.phone);
        stats.phonesChecked++;

        console.log(`  [phone] ${label}: ${prof.phone} -> ${normalized} (active: ${phoneActive})`);
      }

      // Step 4: Assign tier
      const tier = assignTier(emailValid, phoneActive);
      const status = tier === "C" ? "UNREACHABLE" : "READY";

      let nextContactAt: Date | null = null;
      if (tier === "A") {
        nextContactAt = new Date(); // Priority: now
      } else if (tier === "B") {
        nextContactAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days later
      }

      // Step 5: Update the outreach record
      await prisma.cadreOutreachRecord.update({
        where: { id: outreachRecord.id },
        data: {
          emailValid,
          emailActivityScore,
          phoneActive,
          hasWhatsApp: null, // Will be determined when WhatsApp message is sent
          tier,
          status,
          nextContactAt,
        },
      });

      if (tier === "A") stats.tierA++;
      else if (tier === "B") stats.tierB++;
      else stats.tierC++;

      console.log(`  [tier] ${label}: Tier ${tier} -> ${status}`);
    }
  }

  console.log("\n=== Enrichment Complete ===");
  console.log(`Total processed: ${stats.total}`);
  console.log(`Emails verified: ${stats.emailsVerified}`);
  console.log(`Phones checked:  ${stats.phonesChecked}`);
  console.log(`Tier A (both):   ${stats.tierA}`);
  console.log(`Tier B (one):    ${stats.tierB}`);
  console.log(`Tier C (none):   ${stats.tierC}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Enrichment failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
