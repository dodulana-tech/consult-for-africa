/**
 * Invite the five Haven Paediatric Centre founders/board to Maarova — INDIVIDUAL
 * leadership assessments, one email each. Creates a dedicated "Haven Paediatric
 * Centre" Maarova org (if absent), creates each as a MaarovaUser with a temp
 * password, sends a personal invite, then confirms to Debo + Tito.
 *
 * ESM ts-node (matches the other working senders; avoids the @/ alias trick):
 *   npx ts-node --transpile-only scripts/send-haven-maarova-invites.ts
 */
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";

for (const f of [".env", ".env.local"]) {
  const p = path.resolve(process.cwd(), f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

const prisma = new PrismaClient();
const PORTAL = "https://consultforafrica.com/maarova/portal/login";
const LEADERS = [
  { name: "Kabir Aregbesola", email: "kabir@aurorahills.co", title: "Mr" },
  { name: "Abisodun Alli", email: "abisodunalli@yahoo.com", title: "Mrs" },
  { name: "Shakirah Saliu", email: "shakirahsaliu@gmail.com", title: "Dr" },
  { name: "Odedina", email: "gbajoodedina@gmail.com", title: "Dr" }, // TODO confirm first name
  { name: "Ogochukwu Odum", email: "odumogo@gmail.com", title: "Mr" },
];

function inviteBody(firstName: string, email: string, password: string) {
  return `Dear ${firstName},

You have been invited to complete a Maarova leadership assessment as part of the Consult for Africa engagement with Haven Paediatric Centre.

Maarova is a psychometric assessment platform built specifically for healthcare leaders in Africa. Over about 60 minutes you will complete six dimensions covering behavioural style, values, emotional intelligence, clinical-leadership transition, and organisational culture. Your results generate a personalised, confidential leadership profile and development roadmap. Individual results are private to you; only team-level themes inform the wider work.

To begin, log in and change your password:
  Portal:     ${PORTAL}
  Email:      ${email}
  Temporary:  ${password}

If you have any questions, just reply to this email. We are glad to have you take part.

Warm regards,
Consult for Africa
hello@consultforafrica.com  ·  consultforafrica.com`;
}

async function main() {
  let org = await prisma.maarovaOrganisation.findFirst({
    where: { name: { contains: "Haven Paediatric", mode: "insensitive" } },
    select: { id: true, name: true },
  });
  if (!org) {
    org = await prisma.maarovaOrganisation.create({
      data: {
        name: "Haven Paediatric Centre", type: "Hospital", country: "Nigeria", city: "Lagos",
        stream: "DEVELOPMENT",
        contactName: "Kabir Aregbesola", contactEmail: "kabir@aurorahills.co", maxAssessments: 20, isActive: true,
        notes: "Haven leadership-team assessment during the Consult for Africa diagnostic audit (July 2026).",
      },
      select: { id: true, name: true },
    });
    console.log(`Created Maarova org "${org.name}" (${org.id})`);
  } else {
    console.log(`Using existing org "${org.name}" (${org.id})`);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com", port: Number(process.env.SMTP_PORT ?? 465), secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = process.env.SMTP_FROM ?? "Consult for Africa <hello@consultforafrica.com>";
  const results: string[] = [];

  for (const L of LEADERS) {
    const tempPassword = randomBytes(12).toString("base64url") + "!1A";
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const existing = await prisma.maarovaUser.findUnique({ where: { email: L.email } });
    if (existing) {
      await prisma.maarovaUser.update({
        where: { id: existing.id },
        data: { passwordHash, isPortalEnabled: true, invitedAt: new Date(), organisationId: org.id, title: L.title, name: L.name },
      });
    } else {
      await prisma.maarovaUser.create({
        data: { organisationId: org.id, name: L.name, email: L.email, passwordHash, title: L.title, role: "USER", isPortalEnabled: true, invitedAt: new Date() },
      });
    }
    const firstName = L.name.split(" ")[0];
    let sent = false;
    try {
      const text = inviteBody(firstName, L.email, tempPassword);
      await transporter.sendMail({
        from, to: L.email, replyTo: process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com",
        subject: "Your Maarova Leadership Assessment | Consult for Africa",
        text, html: text.replace(/\n/g, "<br>"),
      });
      sent = true;
    } catch (err) {
      console.error(`Invite email FAILED for ${L.email}:`, (err as Error)?.message ?? err);
    }
    results.push(`  ${sent ? "OK " : "FAIL"}  ${L.title} ${L.name} <${L.email}>`);
    console.log(`  ${sent ? "✓" : "✗"} ${L.title} ${L.name} <${L.email}>`);
  }

  // confirmation to Debo + Tito (no passwords in this copy)
  try {
    await transporter.sendMail({
      from, to: ["debo.odulana@consultforafrica.com", "tito.ipinmoye@consultforafrica.com"],
      replyTo: process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com",
      subject: "Maarova leadership assessments sent to Haven leadership",
      text:
        `The individual Maarova leadership-assessment invites have gone out to Haven's five founders, under the "Haven Paediatric Centre" org.\n\n` +
        results.join("\n") +
        `\n\nEach received a personal invite with a login and temporary password (portal: ${PORTAL}). ` +
        `Results group for a leadership-team alignment read, feeding the People, Governance and Culture domains of the audit.`,
    });
    console.log("\n✓ Confirmation sent to Debo + Tito.");
  } catch (err) {
    console.error("Confirmation email failed:", (err as Error)?.message ?? err);
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
