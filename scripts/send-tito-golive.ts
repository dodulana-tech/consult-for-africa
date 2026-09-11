/**
 * Send Tito the live survey links + circulation copy + QR codes.
 *   npx ts-node --transpile-only scripts/send-tito-golive.ts
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

const TO = "tito.ipinmoye@consultforafrica.com";
const SUBJECT = "Haven surveys are LIVE — links, QR codes & how to circulate";
const STAFF = "https://consultforafrica.com/haven-audit.html";
const PATIENT = "https://consultforafrica.com/haven-patient-survey.html";

const TEXT = `Hi Tito,

Both Haven diagnostic-audit surveys are live and ready to go out. Both are anonymous and open with no login.

STAFF — Safety Culture Survey
  ${STAFF}
  (QR attached: "Haven staff survey QR.png")

PATIENT / CAREGIVER — Experience Survey
  ${PATIENT}
  (QR attached: "Haven patient survey QR.png" — print and place at the front/discharge desk)

READY-TO-SEND COPY

For staff (share via the matron/leads on WhatsApp or email):
"Team — as part of the work to make Haven safer and stronger, please take this short, completely anonymous survey (about 10 minutes). Your answers go to our partners at Consult for Africa, not to management, and are only ever reported as grouped totals. It genuinely shapes what we improve. Thank you. ${STAFF}"

For patients/caregivers (a card or poster with the QR, or read aloud at discharge):
"Before you go — please help us care for children better. This short, anonymous survey takes about 5 minutes. Scan the code or open ${PATIENT}. Thank you for trusting us with your child."

TIPS
- Push the staff survey through the matron/leads with a clear deadline (say, end of week 2) to lift response rates.
- For patients, a printed QR at the front desk plus offering a tablet works best; a staff member may read it aloud where needed, without steering the answers.
- Protect anonymity: with a small team, always report grouped totals only, never individual responses.

I'll pull the results as they come in and we can review together. Tell me once you've circulated, or if you'd like any wording tweaked.

Warm regards,
Debo

Dr Debo Odulana
Founding Partner, Consult for Africa
hello@consultforafrica.com  ·  +234 913 813 8553  ·  consultforafrica.com`;

async function main() {
  const attachments = [
    ["docs/haven-staff-survey-qr.png", "Haven staff survey QR.png"],
    ["docs/haven-patient-survey-qr.png", "Haven patient survey QR.png"],
  ].map(([file, name]) => {
    const p = path.resolve(process.cwd(), file);
    if (!fs.existsSync(p)) throw new Error(`Missing ${p}`);
    return { filename: name, path: p, contentType: "image/png" };
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = process.env.SMTP_FROM ?? "Consult for Africa <hello@consultforafrica.com>";
  const replyTo = process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com";
  console.log(`Sending go-live to Tito...\n  To: ${TO}\n  Attachments: ${attachments.length}`);
  const info = await transporter.sendMail({ from, to: TO, replyTo, subject: SUBJECT, text: TEXT, html: TEXT.replace(/\n/g, "<br>"), attachments });
  console.log("✓ Sent. messageId:", info.messageId, "\n  accepted:", info.accepted, "rejected:", info.rejected);
}
main().catch((e) => { console.error("Send failed:", e?.message ?? e); process.exitCode = 1; });
