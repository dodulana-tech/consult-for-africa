/**
 * SEND the Haven project-launch email to each of the five founders — INDIVIDUAL
 * emails, one per person (personalised salutation), cc Tito on each.
 * Attaches the kickoff deck + the Information & Data Request.
 *   npx ts-node --transpile-only scripts/send-haven-launch.ts
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
  { email: "kabir@aurorahills.co", greet: "Kabir" },
  { email: "abisodunalli@yahoo.com", greet: "Abisodun" },
  { email: "shakirahsaliu@gmail.com", greet: "Dr Shakirah" },
  { email: "gbajoodedina@gmail.com", greet: "Dr Odedina" },
  { email: "odumogo@gmail.com", greet: "Ogochukwu" },
];
const CC = ["tito.ipinmoye@consultforafrica.com"];
const SUBJECT = "Project Launch: Haven Paediatric Centre Diagnostic Audit";
const DECK = path.resolve(process.cwd(), "docs/haven-audit-kickoff-deck-cfa.pdf");
const IR = path.resolve(process.cwd(), "docs/haven-audit-information-request-cfa.pdf");

const body = (greet: string) => `Dear ${greet},

It is my pleasure to formally launch the Haven Paediatric Centre diagnostic audit. With mobilisation complete, the work is underway, and I want the whole board to see, from day one, exactly what we are doing and the momentum behind it.

Leading the engagement day to day is Tito Ipinmoye, our Director of Product & Strategy. A clinician by training and a healthcare executive by practice, Tito has spent nearly a decade transforming hospitals, health systems and health-tech ventures across Europe and Africa; she is also Chief Product Officer at Cooked Indoors and is completing an Executive MBA at ESADE Business School in Barcelona. She pairs frontline clinical insight with the strategic and operational discipline to build resilient, high-performing healthcare organisations. Haven is in exceptional hands. I remain closely involved as partner, providing senior oversight and staying close to the board, while Tito owns delivery and will be your main point of contact.

Attached is a short launch deck setting out our approach, every area we are examining, the information we will need, the surveys already live and collecting, the quick wins starting this week, and the four-week path to your board readout. The full Information and Data Request is attached alongside it.

To keep momentum, the one thing that helps us most now is a named point person on your side, ideally the Head of Operations, so Tito can agree the schedule and data access. She will be in touch shortly.

Thank you for your trust. We are energised to get to work for Haven, and look forward to bringing you a sharp, evidence-based plan for the facility's next phase of growth.

Warm regards,
Debo

Dr Debo Odulana
Founding Partner, Consult for Africa
hello@consultforafrica.com  ·  +234 913 813 8553  ·  consultforafrica.com`;

async function main() {
  for (const p of [DECK, IR]) if (!fs.existsSync(p)) throw new Error(`Missing: ${p}`);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com", port: Number(process.env.SMTP_PORT ?? 465), secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = process.env.SMTP_FROM ?? "Consult for Africa <hello@consultforafrica.com>";
  const attachments = [
    { filename: "Haven - Project Launch Deck.pdf", path: DECK, contentType: "application/pdf" },
    { filename: "Haven - Information & Data Request.pdf", path: IR, contentType: "application/pdf" },
  ];
  for (const f of FOUNDERS) {
    const text = body(f.greet);
    const info = await transporter.sendMail({
      from, to: f.email, cc: CC, replyTo: process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com",
      subject: SUBJECT, text, html: text.replace(/\n/g, "<br>"), attachments,
    });
    console.log(`✓ ${f.greet.padEnd(12)} ${f.email.padEnd(28)} accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)}`);
  }
  console.log("\nAll five individual launch emails sent (cc Tito on each).");
}
main().catch((e) => { console.error("Send failed:", e?.message ?? e); process.exitCode = 1; });
