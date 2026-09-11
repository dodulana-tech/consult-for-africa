/**
 * Email Tito Ipinmoye (co-lead) her full Haven engagement & audit pack.
 *   To: sharonteetoe@gmail.com   (from the platform User record)
 *   Attachments: the 5 branded PDFs of the audit pack.
 *
 *   npx ts-node --transpile-only scripts/send-tito-guide.ts
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

const TO = "sharonteetoe@gmail.com";
const SUBJECT = "Haven Paediatric Centre — your engagement & audit pack";
const D = (f: string) => path.resolve(process.cwd(), "docs", f);

const ATT = [
  ["haven-audit-guide-tito-cfa.pdf", "Haven - Engagement & Audit Guide (Tito).pdf"],
  ["haven-audit-information-request-cfa.pdf", "Haven - Information & Data Request.pdf"],
  ["haven-safety-culture-survey-cfa.pdf", "Haven - Staff Safety Culture Survey.pdf"],
  ["haven-audit-fieldwork-kit-cfa.pdf", "Haven - Audit Fieldwork Kit.pdf"],
  ["haven-crash-cart-standard-cfa.pdf", "Haven - Crash-Cart Standard & Shift Checklist.pdf"],
];

const TEXT = `Hi Tito,

Delighted to have you championing Haven with me. Attached is your full pack for the diagnostic audit.

Start with the Engagement & Audit Guide — and please read section 2 (the sensitivities) before anything else. On this engagement, how we carry ourselves matters as much as what we find.

The pack:
1. Engagement & Audit Guide (for you) — context, the sensitivities, and the week-by-week playbook.
2. Information & Data Request — the document we issue to Haven's point person.
3. Staff Safety Culture Survey — the instrument (also deployed as an anonymous online form).
4. Audit Fieldwork Kit — your interview guides, observation checklist, and fieldwork plan.
5. Crash-Cart Standard & Shift Checklist — the visible day-one quick win.

The survey runs as an anonymous, mobile-first online form; I'll share the live link once we wire it up at mobilisation. Nothing here goes to the client until the mobilisation fee lands — but I want you fully equipped and ready to move the moment it does.

Let's grab 20 minutes this week to align before we mobilise.

Warm regards,
Debo

Dr Debo Odulana
Founding Partner, Consult for Africa
hello@consultforafrica.com  ·  +234 913 813 8553  ·  consultforafrica.com`;

const HTML = TEXT.replace(/\n/g, "<br>");

async function main() {
  const attachments = ATT.map(([file, name]) => {
    const p = D(file);
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

  console.log(`Sending Tito's pack...\n  To: ${TO}\n  Attachments: ${attachments.length}`);
  const info = await transporter.sendMail({
    from, to: TO, replyTo, subject: SUBJECT, text: TEXT, html: HTML, attachments,
  });
  console.log("✓ Sent. messageId:", info.messageId);
  console.log("  accepted:", info.accepted, "\n  rejected:", info.rejected);
}

main().catch((e) => { console.error("Send failed:", e?.message ?? e); process.exitCode = 1; });
