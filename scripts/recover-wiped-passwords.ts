/**
 * Recovery for the 161-char-hash wipe bug.
 *
 * Up to and including 2026-05-08, the cleanup script
 * scripts/null-import-placeholder-hashes.ts wiped any passwordHash with
 * length 161 -- which included legitimate reset-password hashes. Any
 * user who had reset their password and not yet re-claimed had their
 * hash cleared and could no longer log in.
 *
 * This script identifies the likely-affected cohort (lastLoginAt set,
 * passwordHash null, no active reset token) and emails each one a
 * fresh password reset link. For dry runs, pass --dry.
 *
 * Run with:
 *   DATABASE_URL=$DIRECT_URL npx tsx scripts/recover-wiped-passwords.ts --dry
 *   DATABASE_URL=$DIRECT_URL npx tsx scripts/recover-wiped-passwords.ts
 */
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { sendCadreEmail } from "../lib/cadreEmail";

const TOKEN_TTL_HOURS = 24;
const SEND_DELAY_MS = 250;

async function main() {
  const dry = process.argv.includes("--dry");

  // Cohort: previously logged in, now has no hash, not currently in a
  // valid reset window. We require lastLoginAt to skip people who never
  // set a password (imported leads who never claimed).
  const affected = await prisma.cadreProfessional.findMany({
    where: {
      passwordHash: null,
      lastLoginAt: { not: null },
      OR: [
        { passwordResetExpiry: null },
        { passwordResetExpiry: { lt: new Date() } },
      ],
    },
    select: { id: true, firstName: true, lastName: true, email: true, lastLoginAt: true },
    orderBy: { lastLoginAt: "desc" },
  });

  console.log(`Found ${affected.length} affected accounts`);
  if (affected.length === 0) {
    await prisma.$disconnect();
    return;
  }

  if (dry) {
    for (const u of affected.slice(0, 30)) {
      console.log(`  ${u.firstName} ${u.lastName} <${u.email}> last login ${u.lastLoginAt?.toISOString().slice(0, 10)}`);
    }
    if (affected.length > 30) console.log(`  ...and ${affected.length - 30} more`);
    console.log("\nDry run. Re-run without --dry to send recovery emails.");
    await prisma.$disconnect();
    return;
  }

  let sent = 0;
  let failed = 0;
  for (const u of affected) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

    try {
      await prisma.cadreProfessional.update({
        where: { id: u.id },
        data: { passwordResetToken: token, passwordResetExpiry: expiry },
      });

      const baseUrl = process.env.NEXTAUTH_URL ?? "https://www.consultforafrica.com";
      const resetLink = `${baseUrl}/oncadre/reset-password/${token}`;

      await sendCadreEmail({
        to: u.email,
        subject: "Restore your CadreHealth sign-in",
        heading: "Set a new password",
        body: `Hi ${u.firstName}, due to a recent maintenance issue your CadreHealth password was reset. Use the link below within ${TOKEN_TTL_HOURS} hours to set a new one and continue.`,
        ctaText: "Set New Password",
        ctaHref: resetLink,
        footer: "If you did not expect this email, you can ignore it. Your account is safe.",
      });
      sent++;
      console.log(`  Sent recovery to ${u.email}`);
      await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
    } catch (err) {
      failed++;
      console.error(`  Failed for ${u.email}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\nDone. Sent ${sent} recovery emails (${failed} failed).`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
