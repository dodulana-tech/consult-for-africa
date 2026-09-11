/**
 * Send the intended Haven-leadership PROJECT-LAUNCH email + kickoff deck to
 * Debo & Tito for review/go-ahead, before it goes to the five founders.
 *   npx ts-node --transpile-only scripts/send-haven-launch-review.ts
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

const TO = ["debo.odulana@consultforafrica.com", "tito.ipinmoye@consultforafrica.com"];
const SUBJECT = "FOR REVIEW — Haven project-launch email + deck (before it goes to the founders)";
const DECK = path.resolve(process.cwd(), "docs/haven-audit-kickoff-deck-cfa.pdf");
const IR = path.resolve(process.cwd(), "docs/haven-audit-information-request-cfa.pdf");
const RECIPIENTS =
  "Mr Kabir Aregbesola (kabir@aurorahills.co), Mrs Abisodun Alli (abisodunalli@yahoo.com), Dr Shakirah Saliu (shakirahsaliu@gmail.com), Dr Odedina (gbajoodedina@gmail.com), Mr Ogochukwu Odum (odumogo@gmail.com) — cc Tito";

const DRAFT = `Subject: Project Launch — Haven Paediatric Centre Diagnostic Audit

Dear Kabir, Abisodun, Dr Shakirah, Dr Odedina and Ogochukwu,

It is my pleasure to formally launch the Haven Paediatric Centre diagnostic audit. With mobilisation complete, the work is underway — and I want the whole board to see, from day one, exactly what we are doing and the momentum behind it.

Leading the engagement day to day is Tito Ipinmoye, our Director of Product & Strategy. A clinician by training and a healthcare executive by practice, Tito has spent nearly a decade transforming hospitals, health systems and health-tech ventures across Europe and Africa; she is also Chief Product Officer at Cooked Indoors and is completing an Executive MBA at ESADE Business School in Barcelona. She pairs frontline clinical insight with the strategic and operational discipline to build resilient, high-performing healthcare organisations. Haven is in exceptional hands. I remain closely involved as partner, providing senior oversight and staying close to the board, while Tito owns delivery and will be your main point of contact.

Attached is a short launch deck setting out our approach, every area we are examining, the information we will need, the surveys already live and collecting, the quick wins starting this week, and the four-week path to your board readout.

To keep momentum, the one thing that helps us most now is a named point person on your side — we suggest the Head of Operations — so Tito can agree the schedule and data access. She will be in touch shortly.

Thank you for your trust. We are energised to get to work for Haven, and look forward to bringing you a sharp, evidence-based plan for the facility's next phase of growth.

Warm regards,
Debo

Dr Debo Odulana
Founding Partner, Consult for Africa
hello@consultforafrica.com  ·  +234 913 813 8553  ·  consultforafrica.com`;

const TEXT = `Debo, Tito,

This is exactly what we intend to send to Haven's leadership — the project-launch email (below) and TWO attachments: the kickoff deck (reflowed to the locked MECE structure) and the full Information & Data Request the deck refers to.

WHEN APPROVED, it goes to:
  ${RECIPIENTS}

Reply with edits or a go-ahead and I will send it to the founders.

— — — LAUNCH EMAIL TO HAVEN LEADERSHIP — — —

${DRAFT}

— — — END — — —`;

async function main() {
  for (const p of [DECK, IR]) if (!fs.existsSync(p)) throw new Error(`Missing: ${p}`);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com", port: Number(process.env.SMTP_PORT ?? 465), secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = process.env.SMTP_FROM ?? "Consult for Africa <hello@consultforafrica.com>";
  console.log(`Sending launch review...\n  To: ${TO.join(", ")}`);
  const info = await transporter.sendMail({
    from, to: TO, replyTo: process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com",
    subject: SUBJECT, text: TEXT, html: TEXT.replace(/\n/g, "<br>"),
    attachments: [
      { filename: "Haven - Project Launch Deck.pdf", path: DECK, contentType: "application/pdf" },
      { filename: "Haven - Information & Data Request.pdf", path: IR, contentType: "application/pdf" },
    ],
  });
  console.log("✓ Sent. messageId:", info.messageId, "\n  accepted:", info.accepted, "rejected:", info.rejected);
}
main().catch((e) => { console.error("Send failed:", e?.message ?? e); process.exitCode = 1; });
