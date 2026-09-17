/**
 * Chase the outstanding Haven Paediatric Centre INSTALMENT invoice.
 *
 *   To:  kabir@aurorahills.co
 *   Cc:  the other four founders, plus Usman for the records
 *   Attachment: docs/haven-invoice-instalment-1-cfa.pdf  (CFA-HAV-2026-002)
 *
 * Instalment 1 of 3 (N2,500,000) against the agreed N9,300,000 engagement.
 * This is not a second engagement invoice — it requests the monthly
 * instalment due under CFA-HAV-2026-001, so nothing is double-counted.
 *
 * The invoice first went to Kabir and Usman from send-haven-strategy.ts,
 * alongside the growth strategy documents. Payment was due by 25 August
 * and has not been recorded, so this re-sends it as a follow-up and puts
 * the position in front of the whole board.
 *
 * Preview without sending:
 *   npx ts-node --transpile-only scripts/send-haven-invoice-instalment.ts --dry-run
 * Send:
 *   npx ts-node --transpile-only scripts/send-haven-invoice-instalment.ts
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

const DRY_RUN = process.argv.includes("--dry-run");

const TO = "kabir@aurorahills.co";
// The remaining four of the five founders (roster: lib/haven-founders.ts),
// then Usman, who has been copied on the billing throughout.
const CC = [
  "abisodunalli@yahoo.com",  // Mrs Abisodun Alli
  "shakirahsaliu@gmail.com", // Dr Shakirah Saliu
  "gbajoodedina@gmail.com",  // Dr Odedina
  "odumogo@gmail.com",       // Mr Ogochukwu Odum
  "usman.g@aurorahills.co",  // Usman, for his records
];
const SUBJECT = "Outstanding: invoice CFA-HAV-2026-002, payment due 25 August";
const PDF = path.resolve(process.cwd(), "docs/haven-invoice-instalment-1-cfa.pdf");

const TEXT = `Dear Kabir,

A follow-up on invoice CFA-HAV-2026-002, attached again here: N2,500,000, the first of the three monthly instalments under the Haven engagement. Payment was due by 25 August, and we have not seen it come through, so it now stands more than three weeks past due.

To be clear on the arithmetic, this sits against the original engagement invoice CFA-HAV-2026-001 rather than adding to it. The agreed total remains N9,300,000: the mobilisation fee of N1,800,000, received on 7 July, then three instalments of N2,500,000. The two that follow fall due on 23 September and 22 October, the first of those next week.

Payment details are on the invoice: Zenith Bank, account 1312352157, Consult for Africa Management Services Limited, with CFA-HAV-2026-002 as the reference.

If the schedule as drawn does not suit Haven's cash position, I would far rather restructure it than let it drift. Tell me what works and we will redraw it.

I have copied the founders and Usman so that the position is visible to everyone carrying it. Any questions at all, I am a call away.

Warm regards,
Debo

Dr Debo Odulana
Founding Partner, Consult for Africa
hello@consultforafrica.com  ·  +234 913 813 8553  ·  consultforafrica.com`;

const HTML = TEXT.replace(/\n/g, "<br>");

async function main() {
  if (!fs.existsSync(PDF)) {
    throw new Error(`Invoice not found at ${PDF} — run build-haven-invoice-instalment.py first.`);
  }

  const from = process.env.SMTP_FROM ?? "Consult for Africa <hello@consultforafrica.com>";
  const replyTo = process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com";

  console.log(`${DRY_RUN ? "DRY RUN — nothing will be sent" : "Sending instalment invoice..."}\n  From:    ${from}\n  To:      ${TO}\n  Cc:      ${CC.join(", ")}\n  Subject: ${SUBJECT}\n  Att:     ${path.basename(PDF)}\n`);

  if (DRY_RUN) {
    console.log(TEXT);
    return;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP_USER / SMTP_PASS are not set — add them to .env before sending.");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const info = await transporter.sendMail({
    from,
    to: TO,
    cc: CC,
    replyTo,
    subject: SUBJECT,
    text: TEXT,
    html: HTML,
    attachments: [{ filename: "Consult-for-Africa-Invoice-CFA-HAV-2026-002.pdf", path: PDF, contentType: "application/pdf" }],
  });

  console.log("✓ Sent. messageId:", info.messageId);
  console.log("  accepted:", info.accepted);
  console.log("  rejected:", info.rejected);
}

main().catch((e) => {
  console.error("Send failed:", e?.message ?? e);
  process.exitCode = 1;
});
