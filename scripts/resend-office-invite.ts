/**
 * Re-issue an Office of the Founding Partner welcome email.
 *
 * The temporary password is only ever stored hashed, so a resend cannot repeat
 * the original. It mints a new one and replaces the hash, which also means any
 * copy of the first email stops working. That is the safe direction.
 *
 *   NEXTAUTH_URL=https://consultforafrica.com \
 *   npx tsx --env-file=.env.local scripts/resend-office-invite.ts <email>
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendInvite } from "../lib/email";

const prisma = new PrismaClient();

async function main() {
  const rawEmail = process.argv[2];
  if (!rawEmail) throw new Error("Usage: resend-office-invite.ts <email>");
  const email = rawEmail.trim().toLowerCase();

  const base = process.env.NEXTAUTH_URL ?? "";
  if (!base || base.includes("localhost") || base.includes("127.0.0.1")) {
    throw new Error(`NEXTAUTH_URL is "${base}". Re-run with NEXTAUTH_URL=https://consultforafrica.com or you will email a localhost link.`);
  }
  if (!process.env.ZEPTOMAIL_API_KEY) throw new Error("ZEPTOMAIL_API_KEY not set. Run with --env-file=.env.local.");

  // A suppressed address will accept the send and bin it, so check first.
  const suppressed = await prisma.communicationSuppression.findFirst({
    where: { email, OR: [{ channel: "EMAIL" }, { channel: null }] },
    select: { reason: true, notes: true },
  });
  if (suppressed) {
    throw new Error(`${email} is on the suppression list (${suppressed.reason}). Remove it there before resending, or this will be silently dropped.`);
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, role: true } });
  if (!user) throw new Error(`No user for ${email}`);

  const tempPassword = randomBytes(12).toString("base64url") + "!1A";
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(tempPassword, 12) },
  });

  console.log(`Re-issuing for ${user.name} <${email}> (${user.role})`);
  console.log(`Sender: ${process.env.SMTP_FROM}`);
  console.log(`Login target: ${base}/login`);
  console.log("The previous temporary password is now dead.");

  await sendInvite(email, user.name, user.role, tempPassword);
  console.log("\nSent. If it does not arrive, the password below is valid and can be passed on another way:");
  console.log(`  temporary password: ${tempPassword}`);
}

main()
  .catch((err) => { console.error(String(err instanceof Error ? err.message : err)); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
