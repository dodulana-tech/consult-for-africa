/**
 * Send the Haven growth strategy documents to the leadership, and the
 * instalment invoice to Kabir & Usman. Two transactional emails via the
 * configured SMTP transport (SMTP_FROM = hello@).
 *
 *   Email 1  -> the five founders: Growth Strategy (doc) + Strategy deck
 *   Email 2  -> Kabir cc Usman:    instalment invoice CFA-HAV-2026-002
 *
 * Run:  npx tsx --env-file=.env.local scripts/send-haven-strategy.ts
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

const FOUNDERS = [
  "kabir@aurorahills.co",
  "abisodunalli@yahoo.com",
  "shakirahsaliu@gmail.com",
  "gbajoodedina@gmail.com",
  "odumogo@gmail.com",
];

const DOC = path.resolve(process.cwd(), "docs/haven-growth-strategy-cfa.pdf");
const DECK = path.resolve(process.cwd(), "docs/haven-strategy-deck-cfa.pdf");
const INV = path.resolve(process.cwd(), "docs/haven-invoice-instalment-1-cfa.pdf");

const SIG =
  "Dr Debo Odulana\nFounding Partner, Consult for Africa\nhello@consultforafrica.com  ·  +234 913 813 8553  ·  consultforafrica.com";

const STRAT_SUBJECT = "Haven growth strategy: the plan and the board deck";
const STRAT_TEXT = `Dear all,

Thank you for the direction survey and the conversations that have shaped this. Please find attached two documents that set out the growth strategy for Haven.

1. The Growth Strategy. The full written plan: ten essential growth levers, grouped into five jobs and led by the NICU, that take Haven from where it is today to N45-50M a month at an 18-20% EBITDA floor within six months.

2. The Strategy and Growth deck. The same story in board-presentation form, with the numbers, the six-month path, and an honest read of where the board aligns and where it still differs, drawn from the four survey responses in so far.

I would suggest reading these ahead of a session where we walk through them together and make the calls that are yours to make. The targets and the levers are ours to set and deliver; the strategy and the decisions stay with you.

Warm regards,
Debo

${SIG}`;

const INV_SUBJECT = "Invoice CFA-HAV-2026-002: Haven monthly instalment";
const INV_TEXT = `Dear Kabir,

Please find attached invoice CFA-HAV-2026-002, the first monthly instalment of the Haven engagement, N2,500,000. It sits within the agreed schedule (mobilisation received; two further instalments to follow) and does not add to the agreed fee.

Bank details and the payment reference are set out on the invoice. Do let us know if a different split of the remaining balance would be easier on your side.

We have copied Usman for his records. With thanks for a productive engagement.

Warm regards,
Debo

${SIG}`;

async function main() {
  for (const [label, file] of [["Growth Strategy", DOC], ["Deck", DECK], ["Invoice", INV]] as const) {
    if (!fs.existsSync(file)) throw new Error(`${label} not found at ${file}`);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = process.env.SMTP_FROM ?? "Consult for Africa <hello@consultforafrica.com>";
  const replyTo = process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com";

  // Email 1: strategy documents to the five founders
  console.log(`\n[1/2] Strategy docs -> ${FOUNDERS.join(", ")}`);
  const e1 = await transporter.sendMail({
    from, replyTo,
    to: FOUNDERS,
    subject: STRAT_SUBJECT,
    text: STRAT_TEXT,
    html: STRAT_TEXT.replace(/\n/g, "<br>"),
    attachments: [
      { filename: "Haven-Growth-Strategy.pdf", path: DOC, contentType: "application/pdf" },
      { filename: "Haven-Strategy-and-Growth-Deck.pdf", path: DECK, contentType: "application/pdf" },
    ],
  });
  console.log("  ✓ accepted:", e1.accepted, "| rejected:", e1.rejected, "| id:", e1.messageId);

  // Email 2: instalment invoice to Kabir cc Usman
  console.log(`\n[2/2] Instalment invoice -> kabir@aurorahills.co cc usman.g@aurorahills.co`);
  const e2 = await transporter.sendMail({
    from, replyTo,
    to: "kabir@aurorahills.co",
    cc: "usman.g@aurorahills.co",
    subject: INV_SUBJECT,
    text: INV_TEXT,
    html: INV_TEXT.replace(/\n/g, "<br>"),
    attachments: [
      { filename: "Consult-for-Africa-Invoice-CFA-HAV-2026-002.pdf", path: INV, contentType: "application/pdf" },
    ],
  });
  console.log("  ✓ accepted:", e2.accepted, "| rejected:", e2.rejected, "| id:", e2.messageId);
  console.log("\nDone.");
}

main().then(() => process.exit(0)).catch((e) => { console.error("SEND FAILED:", e.message); process.exit(1); });
