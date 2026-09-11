/**
 * Create an Office of the Founding Partner account and send the welcome email.
 *
 *   NEXTAUTH_URL=https://consultforafrica.com \
 *   npx tsx --env-file=.env.local scripts/invite-office-staff.ts \
 *     "Abigail Oladejo" abigail@example.com ADMINISTRATIVE_ASSISTANT
 *
 * The NEXTAUTH_URL override is not optional. .env.local points at localhost,
 * and lib/email.ts builds the login button from that variable, so without it
 * the recipient is emailed a button to a machine they do not have. The guard
 * below refuses rather than sending a broken invitation.
 */
import { PrismaClient, type UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendInvite } from "../lib/email";

const prisma = new PrismaClient();
const OFFICE_ROLES = ["EXECUTIVE_ASSISTANT", "ADMINISTRATIVE_ASSISTANT"];

async function main() {
  const [name, rawEmail, role] = process.argv.slice(2);

  if (!name || !rawEmail || !role) {
    throw new Error('Usage: invite-office-staff.ts "<Full Name>" <email> <EXECUTIVE_ASSISTANT|ADMINISTRATIVE_ASSISTANT>');
  }
  if (!OFFICE_ROLES.includes(role)) {
    throw new Error(`Role must be one of ${OFFICE_ROLES.join(", ")}`);
  }

  const base = process.env.NEXTAUTH_URL ?? "";
  if (!base || base.includes("localhost") || base.includes("127.0.0.1")) {
    throw new Error(
      `NEXTAUTH_URL is "${base}". The welcome email builds its login button from this, so sending now would email a localhost link. Re-run with NEXTAUTH_URL=https://consultforafrica.com`,
    );
  }
  if (!process.env.ZEPTOMAIL_API_KEY) {
    throw new Error("ZEPTOMAIL_API_KEY is not set. Run with --env-file=.env.local.");
  }

  const email = rawEmail.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (existing) {
    throw new Error(`${email} already exists with role ${existing.role}. Change the role from Admin > Users instead.`);
  }

  const tempPassword = randomBytes(12).toString("base64url") + "!1A";
  const user = await prisma.user.create({
    data: { name: name.trim(), email, role: role as UserRole, passwordHash: await bcrypt.hash(tempPassword, 12) },
    select: { id: true, name: true, email: true, role: true },
  });

  console.log(`Created ${user.name} <${user.email}> as ${user.role} (${user.id})`);
  console.log(`Sender: ${process.env.SMTP_FROM}`);
  console.log(`Login button target: ${base}/login`);

  await sendInvite(user.email, user.name, user.role, tempPassword);
  console.log("Welcome email sent. She lands on /tasks after her first login.");
}

main()
  .catch((err) => {
    console.error(String(err instanceof Error ? err.message : err));
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
