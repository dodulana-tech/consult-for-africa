/**
 * Send a warm payment-reminder for the Haven mobilisation fee.
 *
 *   To:  kabir@aurorahills.co
 *   Cc:  usman.g@aurorahills.co
 *   Re-attaches: docs/haven-invoice-cfa.pdf  (invoice CFA-HAV-2026-001)
 *
 *   npx ts-node --transpile-only scripts/send-haven-reminder.ts
 */
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

for (const f of [".env", ".env.local"]) {
  const p = path.resolve(process.cwd(), f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

const TO = "kabir@aurorahills.co";
const CC = "usman.g@aurorahills.co";
const SUBJECT = "Following up: mobilisation fee, invoice CFA-HAV-2026-001";
const PDF = path.resolve(process.cwd(), "docs/haven-invoice-cfa.pdf");

const TEXT = `Dear Kabir,

I hope you are well, and it was good to see you on the 1st.

A gentle follow-up on the mobilisation fee for the Haven engagement, invoice CFA-HAV-2026-001, in the amount of N1,800,000. As we discussed, this was due at the start of the month, and I do not believe it has come through yet.

As soon as it lands we mobilise the diagnostic audit within the week: the crash-cart standard and shift checklist go live, we issue the data request, and we begin the receivables recovery push. For convenience the payment details are on the attached invoice (Zenith Bank, account 1312352157, Consult for Africa Management Services Limited), with CFA-HAV-2026-001 as the reference.

If anything needs clarifying at all, I am a call away. Thank you, Kabir.

Warm regards,
Debo

Dr Debo Odulana
Founding Partner, Consult for Africa
hello@consultforafrica.com  ·  +234 913 813 8553  ·  consultforafrica.com`;

const HTML = TEXT.replace(/\n/g, "<br>");

async function main() {
  if (!fs.existsSync(PDF)) throw new Error(`Invoice not found at ${PDF}`);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const from = process.env.SMTP_FROM ?? "Consult for Africa <hello@consultforafrica.com>";
  const replyTo = process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com";

  console.log(`Sending reminder...\n  From: ${from}\n  To:   ${TO}\n  Cc:   ${CC}\n  Att:  ${path.basename(PDF)}\n`);

  const info = await transporter.sendMail({
    from,
    to: TO,
    cc: CC,
    replyTo,
    subject: SUBJECT,
    text: TEXT,
    html: HTML,
    attachments: [{ filename: "Consult-for-Africa-Invoice-CFA-HAV-2026-001.pdf", path: PDF, contentType: "application/pdf" }],
  });

  console.log("✓ Sent. messageId:", info.messageId);
  console.log("  accepted:", info.accepted);
  console.log("  rejected:", info.rejected);
}

main().catch((e) => {
  console.error("Send failed:", e?.message ?? e);
  process.exitCode = 1;
});
