/**
 * Backfill: finalise Maarova 360 requests that already have enough completed
 * rater responses but never had their MaarovaModuleResponse populated.
 *
 * Default is dry-run. Pass --apply to execute. Pass --no-report to skip
 * report regeneration (no Claude API calls).
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-maarova-360.ts          # dry run
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-maarova-360.ts --apply
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-maarova-360.ts --apply --no-report
 */
import { PrismaClient } from "@prisma/client";
import { finaliseThreeSixtyForRequest } from "../lib/maarova/finaliseThreeSixty";

const prisma = new PrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const skipReport = process.argv.includes("--no-report");

  console.log(`\n=== Maarova 360 Backfill (${apply ? "APPLY" : "DRY RUN"}${skipReport ? ", report regen disabled" : ""}) ===\n`);

  // Find all requests where non-SELF completed invites >= minRaters
  const requests = await prisma.maarova360Request.findMany({
    select: {
      id: true,
      status: true,
      minRaters: true,
      subject: { select: { email: true, name: true } },
      invites: {
        select: { role: true, status: true },
      },
    },
  });

  const eligible: typeof requests = [];
  const insufficient: typeof requests = [];

  for (const req of requests) {
    const nonSelfCompleted = req.invites.filter(
      (i) => i.role !== "SELF" && i.status === "COMPLETED",
    ).length;
    if (nonSelfCompleted >= req.minRaters) {
      eligible.push(req);
    } else if (nonSelfCompleted > 0) {
      insufficient.push(req);
    }
  }

  console.log(`Eligible for finalisation (non-self completed >= minRaters): ${eligible.length}`);
  for (const r of eligible) {
    const completed = r.invites.filter((i) => i.role !== "SELF" && i.status === "COMPLETED").length;
    console.log(`  ${r.subject.email.padEnd(35)} status=${r.status.padEnd(11)} ratings=${completed}/${r.minRaters}`);
  }

  if (insufficient.length > 0) {
    console.log(`\nHave some responses but below threshold (left as COLLECTING):`);
    for (const r of insufficient) {
      const completed = r.invites.filter((i) => i.role !== "SELF" && i.status === "COMPLETED").length;
      console.log(`  ${r.subject.email.padEnd(35)} status=${r.status.padEnd(11)} ratings=${completed}/${r.minRaters}`);
    }
  }

  if (!apply) {
    console.log(`\nDry run complete. Pass --apply to execute.`);
    await prisma.$disconnect();
    return;
  }

  console.log(`\nApplying...\n`);
  for (const req of eligible) {
    const result = await finaliseThreeSixtyForRequest(req.id, { regenerateReport: !skipReport });
    if (result.ok) {
      console.log(
        `  OK   ${req.subject.email.padEnd(35)} moduleResponse=${result.moduleResponseId} reportRegen=${result.reportRegenerated}`,
      );
    } else {
      console.log(`  FAIL ${req.subject.email.padEnd(35)} reason=${result.reason}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
