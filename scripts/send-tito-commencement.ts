/**
 * Notify Tito that Haven has commenced (mobilisation fee received).
 *   npx ts-node --transpile-only scripts/send-tito-commencement.ts
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
const SUBJECT = "Haven — we're go: mobilisation received, audit commences";

const TEXT = `Hi Tito,

Good news — Haven's mobilisation fee has landed, so the diagnostic audit is officially go. We mobilise this week.

Your week-1 priorities (from the guide):
1. Secure a named point person at Haven — push for the Head of Operations.
2. Issue the Information & Data Request; flag the 12 Week-1 critical items.
3. Launch the staff safety-culture survey (online form — I'm finalising deployment; live link to follow).
4. Put the crash-cart standard live.
5. Kick off the Leadway/NEM receivables recovery push.
6. Start reconciling the management accounts.

All survey instruments will be complete and ready to deploy by tomorrow — I'll send you the live links and a one-line brief for circulating them to staff.

Let's do our 20-minute alignment call today or first thing tomorrow, before you go on site. Everything else you need is in the pack I sent through.

Excited to get moving.

Warm regards,
Debo

Dr Debo Odulana
Founding Partner, Consult for Africa
hello@consultforafrica.com  ·  +234 913 813 8553  ·  consultforafrica.com`;

async function main() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = process.env.SMTP_FROM ?? "Consult for Africa <hello@consultforafrica.com>";
  const replyTo = process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com";
  console.log(`Notifying Tito of commencement...\n  To: ${TO}`);
  const info = await transporter.sendMail({
    from, to: TO, replyTo, subject: SUBJECT, text: TEXT, html: TEXT.replace(/\n/g, "<br>"),
  });
  console.log("✓ Sent. messageId:", info.messageId, "\n  accepted:", info.accepted, "rejected:", info.rejected);
}
main().catch((e) => { console.error("Send failed:", e?.message ?? e); process.exitCode = 1; });
