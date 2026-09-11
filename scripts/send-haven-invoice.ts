/**
 * Email the Haven Paediatric Centre invoice to the client.
 *
 *   To:  kabir@aurorahills.co
 *   Cc:  usman.g@aurorahills.co
 *   Attachment: docs/haven-invoice-cfa.pdf
 *
 * Sends via the configured Zoho SMTP transport. Run only when ready:
 *   npx ts-node --transpile-only scripts/send-haven-invoice.ts
 */
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

// ── minimal .env loader (so SMTP_* are available in a standalone script) ──
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
const SUBJECT = "Invoice CFA-HAV-2026-001: Haven Paediatric Centre engagement";
const PDF = path.resolve(process.cwd(), "docs/haven-invoice-cfa.pdf");

const TEXT = `Dear Kabir,

Thank you for the meeting and for your confidence in Consult for Africa.

Please find attached our invoice (CFA-HAV-2026-001) for the Haven Paediatric Centre engagement, reflecting the terms agreed: a total fee of N9,300,000, with the diagnostic audit at N1,800,000 payable on acceptance and the balance over three monthly instalments of N2,500,000. Full payment details and the schedule are set out in the invoice.

On acceptance and receipt of the mobilisation fee, we will mobilise within the week.

We have copied Usman for his records. Please let us know if you need anything further.

Warm regards,
Debo

Dr Debo Odulana
Founding Partner, Consult for Africa
hello@consultforafrica.com  ·  +234 913 813 8553  ·  consultforafrica.com`;

const HTML = TEXT.replace(/\n/g, "<br>");

async function main() {
  if (!fs.existsSync(PDF)) throw new Error(`Invoice not found at ${PDF} — run build-haven-invoice.py first.`);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const from = process.env.SMTP_FROM ?? "Consult for Africa <hello@consultforafrica.com>";
  const replyTo = process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com";

  console.log(`Sending invoice...\n  From: ${from}\n  To:   ${TO}\n  Cc:   ${CC}\n  Att:  ${path.basename(PDF)}\n`);

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
