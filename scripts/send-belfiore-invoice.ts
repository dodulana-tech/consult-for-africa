/**
 * Email the Belfiore Medical invoice to the client.
 *
 *   To:  Dr Uju Rapu  <SET RECIPIENT BELOW>
 *   Attachment: docs/belfiore-invoice-cfa.pdf
 *
 * Sends via the configured Zoho SMTP transport. Run only when ready:
 *   npx ts-node --transpile-only scripts/send-belfiore-invoice.ts
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

// NOTE: uju@belfiore.ng in belfiore-vault is a demo seed login, NOT a verified
// address. Set her real address here before running.
const TO = process.env.BELFIORE_TO ?? "";
const CC = process.env.BELFIORE_CC ?? "";
const SUBJECT = "Invoice CFA-BELF-2026-001: Belfiore Client Vault, Phase 1";
const PDF = path.resolve(process.cwd(), "docs/belfiore-invoice-cfa.pdf");

const TEXT = `Dear Dr Uju,

Thank you for your confidence in Consult for Africa, and for the decision to go ahead.

Please find attached our invoice (CFA-BELF-2026-001) for Phase 1 of the Belfiore Client Vault, reflecting the terms agreed: a fixed Phase 1 fee of N6,400,000 at the founding-client rate, against the standard fee of N9,500,000. With VAT at 7.5%, the total payable is N6,880,000; I have carried the VAT on the final milestone rather than spreading it, so it does not affect what is due now.

Payment follows the milestones in the proposal, with N3,840,000 due on signing to begin discovery, the DPIA and your NDPC registration. Full payment details are set out in the invoice.

On the ongoing care and hosting, I am glad to do this: rather than N250,000 monthly, I have held the rate at N230,000 per month where the quarter is paid in advance, which is N690,000 a quarter. That rate is fixed for your first twelve months from go-live. Care and hosting begins only at go-live and is invoiced separately, so nothing is due on it today.

On receipt of the mobilisation fee we mobilise within the week. Discovery and the compliance groundwork run in parallel from week one, with go-live targeted at week seven.

Please let me know if you need anything further.

Warm regards,
Debo

Dr Debo Odulana
Founding Partner, Consult for Africa
hello@consultforafrica.com  ·  +234 913 813 8553  ·  consultforafrica.com`;

const HTML = TEXT.replace(/\n/g, "<br>");

async function main() {
  if (!TO) {
    throw new Error(
      "No recipient set. Export BELFIORE_TO=<her email> or edit TO in this script. " +
      "Do not use uju@belfiore.ng — that is a demo seed login.",
    );
  }
  if (!fs.existsSync(PDF)) throw new Error(`Invoice not found at ${PDF} — run build-belfiore-invoice.py first.`);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const from = process.env.SMTP_FROM ?? "Consult for Africa <hello@consultforafrica.com>";
  const replyTo = process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com";

  console.log(`Sending invoice...\n  From: ${from}\n  To:   ${TO}\n  Cc:   ${CC || "(none)"}\n  Att:  ${path.basename(PDF)}\n`);

  const info = await transporter.sendMail({
    from,
    to: TO,
    ...(CC ? { cc: CC } : {}),
    replyTo,
    subject: SUBJECT,
    text: TEXT,
    html: HTML,
    attachments: [{ filename: "Consult-for-Africa-Invoice-CFA-BELF-2026-001.pdf", path: PDF, contentType: "application/pdf" }],
  });

  console.log("✓ Sent. messageId:", info.messageId);
  console.log("  accepted:", info.accepted);
  console.log("  rejected:", info.rejected);
}

main().catch((e) => {
  console.error("Send failed:", e?.message ?? e);
  process.exitCode = 1;
});
