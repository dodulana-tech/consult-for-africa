/**
 * Send yourself the dry run, now, without waiting for Thursday's cron.
 *
 * Runs the same code the scheduled preview runs, so what you read is what
 * Friday sends. Nothing goes to any member and no award is issued.
 *
 *   npx tsx --env-file=.env.local scripts/preview-cadre-digest.ts
 */
import { PrismaClient } from "@prisma/client";
import { getDigestRecipients, buildWeekContext } from "../lib/cadreWeeklyDigest";
import { sendDigestPreview } from "../lib/cadreDigestPreview";

const prisma = new PrismaClient();

async function main() {
  const base = process.env.NEXTAUTH_URL ?? "";
  if (!base || base.includes("localhost")) throw new Error(`NEXTAUTH_URL is "${base}"`);
  if (!process.env.ZEPTOMAIL_API_KEY) throw new Error("ZEPTOMAIL_API_KEY not set");

  const recipients = await getDigestRecipients();
  const ctx = await buildWeekContext(recipients, new Date(), true); // dryRun
  const out = await sendDigestPreview(recipients, ctx, base);
  console.log(JSON.stringify(out, null, 1));

  const leaked = await prisma.cadreMaarovaAward.count({ where: { weekKey: ctx.weekKey } });
  console.log(`\naward rows for ${ctx.weekKey} after the dry run: ${leaked} (a dry run must not create any)`);
}
main().catch((e) => { console.error(String(e instanceof Error ? e.message : e)); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
