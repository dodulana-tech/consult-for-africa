/**
 * Send the Haven leadership intro-email DRAFT + kickoff deck to Debo and Tito
 * for review and go-ahead, BEFORE it goes to the board tonight.
 *   npx ts-node --transpile-only scripts/send-haven-kickoff-review.ts
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
const SUBJECT = "FOR REVIEW — Haven leadership intro email + kickoff deck (before tonight's send)";
const DECK = path.resolve(process.cwd(), "docs/haven-audit-kickoff-deck-cfa.pdf");

const LEADERSHIP_RECIPIENTS =
  "kabir@aurorahills.co, shakirahsaliu@gmail.com, gbajoodedina@gmail.com, usman.g@aurorahills.co, abisodunalli@yahoo.com  (cc tito.ipinmoye@consultforafrica.com)";

const DRAFT = `Subject: Haven Paediatric Centre — your diagnostic audit is underway

Dear Kabir, Dr Shakira, Dr Odedina, Usman and Abisodun,

With mobilisation complete, I am delighted to confirm that Haven's diagnostic audit is formally underway.

I am writing to introduce the person who will lead it day to day. Tito Ipinmoye, our Director of Product & Strategy, is Engagement Lead for Haven. Tito is a clinician by training and a healthcare executive by practice, with nearly a decade transforming hospitals, health systems and health-tech ventures across Europe and Africa. She pairs frontline clinical insight with the strategic and operational discipline to build resilient, high-performing healthcare organisations — spanning operational diagnostics, clinical governance, financial sustainability and process redesign. She is also Chief Product Officer at Cooked Indoors and is completing an Executive MBA at ESADE Business School in Barcelona. In short, Haven is in exceptional hands.

I remain closely involved throughout as partner, providing senior oversight and staying close to the board — but Tito owns the delivery and will be your main point of contact from here.

To show you exactly what "underway" means, I have attached a short kickoff deck. It lays out our approach, every area we are examining, the information we will need, the two staff and patient surveys already live and collecting, the quick wins starting this week, and the four-week path to the board readout.

The one thing that helps us most right now is a named point person on your side — we suggest the Head of Operations — so Tito can agree the schedule and data access. She will be in touch shortly to set that up.

Thank you again for your trust. We are genuinely excited to get to work for Haven.

Warm regards,
Debo

Dr Debo Odulana
Founding Partner, Consult for Africa
hello@consultforafrica.com  ·  +234 913 813 8553  ·  consultforafrica.com`;

const TEXT = `Debo, Tito,

Draft for your review before it goes to Haven's leadership tonight. Nothing has been sent to the board yet.

WHEN APPROVED, this goes to:
  ${LEADERSHIP_RECIPIENTS}

ATTACHED: the kickoff deck (11 slides) that will accompany the email — team, approach, the ten audit domains, the six stakeholder surveys, the information we need, quick wins, timeline, and the live survey links.

Please review both the email wording below and the deck. Reply with any edits or a go-ahead, and I will send to leadership tonight once you are both happy. Tito — shout if you'd like your bio framed differently.

— — — DRAFT EMAIL TO HAVEN LEADERSHIP — — —

${DRAFT}

— — — END DRAFT — — —`;

async function main() {
  if (!fs.existsSync(DECK)) throw new Error(`Deck not found: ${DECK}`);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = process.env.SMTP_FROM ?? "Consult for Africa <hello@consultforafrica.com>";
  console.log(`Sending review package...\n  To: ${TO.join(", ")}`);
  const info = await transporter.sendMail({
    from, to: TO, replyTo: process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com",
    subject: SUBJECT, text: TEXT, html: TEXT.replace(/\n/g, "<br>"),
    attachments: [{ filename: "Haven - Diagnostic Audit Kickoff Deck.pdf", path: DECK, contentType: "application/pdf" }],
  });
  console.log("✓ Sent. messageId:", info.messageId, "\n  accepted:", info.accepted, "rejected:", info.rejected);
}
main().catch((e) => { console.error("Send failed:", e?.message ?? e); process.exitCode = 1; });
