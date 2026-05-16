/**
 * CadreHealth Wave 1 Outreach Audit
 *
 * Run locally:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/audit-cadre-wave1.ts
 *
 * Prints a Slack-ready plain-text summary and a single next-action sentence.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

function pct(num: number, denom: number): string {
  if (denom === 0) return "0.0";
  return ((num / denom) * 100).toFixed(1);
}

async function main() {
  // 1. Emails sent
  const emailsSent = await prisma.cadreOutreachRecord.count({
    where: { emailSentAt: { not: null } },
  });

  // 2. Claims: status in converted/diaspora/alumni AND profileClaimedAt set
  const claims = await prisma.cadreOutreachRecord.count({
    where: {
      status: { in: ["CONVERTED", "DIASPORA_NETWORK", "ALUMNI_NETWORK"] },
      profileClaimedAt: { not: null },
    },
  });

  // 3. Claim rate
  const claimRate = parseFloat(pct(claims, emailsSent));

  // 4. Segment distribution: cadreProfessional grouped by practiceLocation
  const [inNigeriaCount, diasporaCount, steppedBackCount, nullCount] =
    await Promise.all([
      prisma.cadreProfessional.count({ where: { practiceLocation: "IN_NIGERIA" } }),
      prisma.cadreProfessional.count({ where: { practiceLocation: "DIASPORA" } }),
      prisma.cadreProfessional.count({ where: { practiceLocation: "STEPPED_BACK" } }),
      prisma.cadreProfessional.count({ where: { practiceLocation: null } }),
    ]);

  // 5. Reminders sent proxy: contactAttempts >= 2 AND status = EMAIL_SENT
  const remindersSent = await prisma.cadreOutreachRecord.count({
    where: {
      contactAttempts: { gte: 2 },
      status: "EMAIL_SENT",
    },
  });

  // ── Print report ──────────────────────────────────────────────────────────

  const lines: string[] = [];

  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("CadreHealth Wave 1 Audit  •  run: " + new Date().toISOString());
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("");
  lines.push("OUTREACH FUNNEL");
  lines.push(`  Emails sent       : ${emailsSent}`);
  lines.push(`  Claims            : ${claims}`);
  lines.push(`  Claim rate        : ${pct(claims, emailsSent)}%`);
  lines.push(`  Reminders sent    : ${remindersSent}  (contactAttempts ≥ 2, still EMAIL_SENT)`);
  lines.push("");
  lines.push("SEGMENT DISTRIBUTION  (cadreProfessional.practiceLocation)");
  lines.push(`  IN_NIGERIA        : ${inNigeriaCount}`);
  lines.push(`  DIASPORA          : ${diasporaCount}`);
  lines.push(`  STEPPED_BACK      : ${steppedBackCount}`);
  lines.push(`  (unset / null)    : ${nullCount}`);
  lines.push("");

  // ── Interpretive recommendations ─────────────────────────────────────────

  lines.push("INTERPRETATION");

  let claimVerdict: string;
  if (claimRate < 5) {
    claimVerdict =
      "⚠ LIKELY DELIVERABILITY ISSUE. Check Vercel logs at /api/cron/cadre-outreach-batch for SMTP errors. " +
      "Common causes: Zoho rate limit, FROM/SMTP_USER mismatch, recipient bounces.";
  } else if (claimRate < 12) {
    claimVerdict =
      "↓ BELOW BENCHMARK. The research brief predicted 12-18%. Consider Wave 2 with a different subject line, " +
      'e.g. "A directory for Nigerian specialists" instead of the Wave 1 subject.';
  } else {
    claimVerdict = "✓ ON TARGET. Claim rate meets the 12-18% research-brief benchmark.";
  }
  lines.push(`  Claim rate (${pct(claims, emailsSent)}%): ${claimVerdict}`);
  lines.push("");

  if (diasporaCount > 100) {
    lines.push(
      "  DIASPORA segment > 100: ENABLE OUTREACH_DIASPORA_DIGEST_ENABLED in Vercel env and start " +
        "drafting the first back-home opportunity digest. The cron at " +
        "/api/cron/cadre-outreach-followup is already wired and gated on this env var.",
    );
  } else if (diasporaCount < 30) {
    lines.push(
      "  DIASPORA segment < 30: EMAIL MAY BE READING TOO NIGERIA-RESIDENT. The diaspora hypothesis " +
        "underperformed. Revisit Wave 2 copy with stronger diaspora-first framing in the opening paragraph.",
    );
  }

  if (steppedBackCount > 50) {
    lines.push(
      "  STEPPED_BACK segment > 50: WIRE THE SENIOR FELLOWS CONVENING. Quarterly virtual format " +
        "per the research brief. Once content exists, set OUTREACH_ALUMNI_NEWSLETTER_ENABLED=true " +
        "to fire the alumni cadence.",
    );
  }

  lines.push("");

  // ── Single next action ────────────────────────────────────────────────────

  let nextAction: string;

  if (emailsSent === 0) {
    nextAction =
      "No emails recorded — verify the cron fired by checking Vercel logs at /api/cron/cadre-outreach-batch, then re-run this audit.";
  } else if (claimRate < 5) {
    nextAction =
      "Pause outreach (set OUTREACH_PAUSED=true in Vercel), fix the SMTP/deliverability issue in Vercel logs, then re-enable and run Wave 2.";
  } else if (claimRate < 12) {
    nextAction =
      'Send Wave 2 with subject line "A directory for Nigerian specialists" targeting the unclaimed EMAIL_SENT cohort.';
  } else if (diasporaCount > 100) {
    nextAction =
      "Enable diaspora digest now (set OUTREACH_DIASPORA_DIGEST_ENABLED=true in Vercel) and write the first back-home opportunity issue.";
  } else if (steppedBackCount > 50) {
    nextAction =
      "Schedule the first Senior Fellows virtual convening and set OUTREACH_ALUMNI_NEWSLETTER_ENABLED=true once the agenda is confirmed.";
  } else {
    nextAction =
      'Wave 1 is on target — plan Wave 2 copy now, targeting the remaining READY queue with subject line "A directory for Nigerian specialists".';
  }

  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("NEXT ACTION: " + nextAction);
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log(lines.join("\n"));
}

main()
  .catch((e) => {
    console.error("Audit failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
