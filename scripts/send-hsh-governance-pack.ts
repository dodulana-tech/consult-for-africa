/**
 * Email the full HSH board governance pack (PDFs) to Debo.
 *
 *   To: debo.odulana@consultforafrica.com
 *   Attachments: the 8 HSH governance PDFs in docs/
 *
 * Sends via the configured Zoho SMTP transport. Run only when ready:
 *   npx ts-node --transpile-only scripts/send-hsh-governance-pack.ts
 */
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

// ── minimal .env loader ──
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

const TO = "debo.odulana@consultforafrica.com";
const SUBJECT = "Havana Specialist Hospital, Board Governance Pack";
const DOCS = path.resolve(process.cwd(), "docs");

// filename on disk -> friendly attachment name
const FILES: [string, string][] = [
  ["hsh-board-operating-model-cfa.pdf", "HSH Board Operating Model.pdf"],
  ["hsh-board-deck-cfa.pdf", "HSH Board Operating Model (Deck).pdf"],
  ["hsh-committee-terms-of-reference-cfa.pdf", "HSH Committee Terms of Reference.pdf"],
  ["hsh-delegation-of-authority-cfa.pdf", "HSH Delegation of Authority.pdf"],
  ["hsh-company-secretary-instruction-doa.pdf", "HSH Company Secretary Instruction (DOA).pdf"],
  ["hsh-director-guide-cfa.pdf", "HSH Directors Guide.pdf"],
  ["hsh-board-at-a-glance-cfa.pdf", "HSH Board Member at a Glance.pdf"],
  ["hsh-governance-enablement-proposal-cfa.pdf", "HSH Governance Enablement Proposal.pdf"],
];

const TEXT = `Please find attached the Havana Specialist Hospital board governance pack, prepared by Consult for Africa. It contains eight documents:

1. Board Operating Model, the governance design: composition, committees, the Afya relationship, reporting, and compensation.
2. Board Operating Model (Deck), the presentation version of the model.
3. Committee Terms of Reference, the remit, membership, and cadence of the five board committees.
4. Delegation of Authority, the map of who decides what, from shareholders through to management.
5. Company Secretary Instruction (DOA), routing the Delegation of Authority to formal adoption.
6. Directors' Guide, an orientation manual for the executive directors.
7. Board Member at a Glance, a one-page desk reference.
8. Board and Committee Enablement Proposal, the follow-on engagement to build the instruments and train the directors.

All documents are confidential and remain in draft for the board's review and adoption.

Dr Debo Odulana
Consult for Africa
hello@consultforafrica.com  ·  consultforafrica.com`;

const HTML = TEXT.replace(/\n/g, "<br>");

async function main() {
  const attachments = FILES.map(([file, name]) => {
    const p = path.join(DOCS, file);
    if (!fs.existsSync(p)) throw new Error(`Missing attachment: ${p}`);
    return { filename: name, path: p, contentType: "application/pdf" };
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const from = process.env.SMTP_FROM ?? "Consult for Africa <hello@consultforafrica.com>";
  const replyTo = process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com";

  console.log(`Sending HSH governance pack...\n  From: ${from}\n  To:   ${TO}\n  Attachments: ${attachments.length}`);
  attachments.forEach((a) => console.log(`    - ${a.filename}`));

  const info = await transporter.sendMail({
    from,
    to: TO,
    replyTo,
    subject: SUBJECT,
    text: TEXT,
    html: HTML,
    attachments,
  });

  console.log("\n✓ Sent. messageId:", info.messageId);
  console.log("  accepted:", info.accepted);
  console.log("  rejected:", info.rejected);
}

main().catch((e) => {
  console.error("✗ Send failed:", e.message);
  process.exit(1);
});
