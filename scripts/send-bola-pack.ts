/**
 * Email the Dr Bola Akinola strategy pack (6 PDFs) as attachments via ZeptoMail.
 *
 * Sends to Debo for proofreading before onward send to Dr Bola.
 *
 * Run (loads ZEPTOMAIL_API_KEY from .env.local):
 *   npx tsx --env-file=.env.local scripts/send-bola-pack.ts            # dry run (lists what would send)
 *   npx tsx --env-file=.env.local scripts/send-bola-pack.ts --apply    # actually send
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import nodemailer from "nodemailer";

// Load .env.local manually (tsx --env-file does not reliably populate here).
function loadEnvLocal() {
  const p = join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[m[1]] === undefined || process.env[m[1]] === "") process.env[m[1]] = v;
  }
}
loadEnvLocal();

const ZEPTO_ENDPOINT = "https://api.zeptomail.com/v1.1/email";
const FROM = { address: "hello@consultforafrica.com", name: "Consult For Africa" };
const TO = { address: "bolaakinola@yahoo.com", name: "Dr Bola Akinola" };
const CC = { address: "debo.odulana@consultforafrica.com", name: "Debo Odulana" };
const REPLY_TO = { address: "debo.odulana@consultforafrica.com", name: "Debo Odulana" };

const DIR = join(process.cwd(), "docs", "dr-bola-akinola");

const FILES: Array<{ file: string; label: string }> = [
  { file: "01-positioning-strategy.pdf", label: "1. Positioning strategy" },
  { file: "02-blue-ocean-plan.pdf", label: "2. The Blue Ocean plan" },
  { file: "03-orthosurplus-arrangement.pdf", label: "3. OrthoSurplus arrangement" },
  { file: "04-website-brief-and-copy.pdf", label: "4. Website rebuild brief and copy" },
  { file: "05-referrer-engine.pdf", label: "5. The referrer engine" },
  { file: "06-clinical-community-portal.pdf", label: "6. The Clinical Community Portal" },
  { file: "07-discovery-questionnaire.pdf", label: "7. Discovery questionnaire" },
];

const apply = process.argv.includes("--apply");

const items = FILES.map((f) => {
  const buf = readFileSync(join(DIR, f.file));
  return { ...f, content: buf.toString("base64"), bytes: buf.length };
});

const listHtml = items
  .map((i) => `<li><strong>${i.label}</strong> &nbsp;<span style="color:#6b7280">(${i.file})</span></li>`)
  .join("");

const html = `
<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937">
  <p>Dear Dr Akinola,</p>
  <p>Thank you for the conversations about Osteon and your practice. Following those, please find attached the
     positioning and brand strategy we have prepared for you, together with a short questionnaire that is the
     natural next step.</p>
  <p>There are seven short documents. A suggested order:</p>
  <ol>${listHtml}</ol>
  <p>In brief: documents one to three set the strategy (how we would position you, a plan to compete by making
     the competition largely beside the point, and how a possible collaboration with OrthoSurplus could work).
     Documents four to six are the practical build (your website, a referral engine, and a doctor portal).
     Document seven is a short questionnaire.</p>
  <p>The most useful next step is document seven. It should take about twenty minutes, and your answers let us
     ground everything in the real numbers of your practice. After that, a 45-minute working session to agree
     the direction, and we move to the brand and website build.</p>
  <p>We are glad to be working on this with you. Debo will follow up to find a time, and do reply to this note
     with any questions in the meantime.</p>
  <p>With best regards,<br/>Consult for Africa</p>
</div>`;

const text = `Dear Dr Akinola,\n\n` +
  `Thank you for the conversations about Osteon and your practice. Following those, please find attached the ` +
  `positioning and brand strategy we have prepared for you, together with a short questionnaire that is the ` +
  `natural next step. Seven short documents, in suggested order:\n\n` +
  items.map((i) => `- ${i.label} (${i.file})`).join("\n") +
  `\n\nDocuments one to three set the strategy; four to six are the practical build (website, referral engine, ` +
  `doctor portal); document seven is a short questionnaire. The most useful next step is document seven: about ` +
  `twenty minutes, and your answers let us ground everything in the real numbers of your practice. After that, ` +
  `a 45-minute working session, and we move to the brand and website build.\n\n` +
  `We are glad to be working on this with you. Debo will follow up to find a time, and do reply with any ` +
  `questions in the meantime.\n\nWith best regards,\nConsult for Africa`;

async function main() {
  const totalKb = Math.round(items.reduce((n, i) => n + i.bytes, 0) / 1024);
  console.log(`Prepared ${items.length} attachments (${totalKb} KB total):`);
  items.forEach((i) => console.log(`  - ${i.file} (${Math.round(i.bytes / 1024)} KB)`));
  console.log(`From:     ${FROM.name} <${FROM.address}>`);
  console.log(`To:       ${TO.name} <${TO.address}>`);
  console.log(`Cc:       ${CC.name} <${CC.address}>`);
  console.log(`Reply-To: ${REPLY_TO.name} <${REPLY_TO.address}>`);

  const subject = "Osteon: positioning and brand strategy, and next steps";

  if (!apply) {
    console.log("\nDRY RUN. Re-run with --apply to send.");
    return;
  }

  const zeptoKey = (process.env.ZEPTOMAIL_API_KEY || "").replace(/^Zoho-enczapikey\s*/i, "").trim();

  // Preferred: ZeptoMail HTTP API (if a key is configured).
  if (zeptoKey) {
    const res = await fetch(ZEPTO_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Zoho-enczapikey ${zeptoKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [{ email_address: TO }],
        cc: [{ email_address: CC }],
        reply_to: [REPLY_TO],
        subject,
        htmlbody: html,
        textbody: text,
        attachments: items.map((i) => ({ name: i.file, content: i.content, mime_type: "application/pdf" })),
      }),
    });
    const data = (await res.json().catch(() => null)) as any;
    if (!res.ok) {
      const msg = data?.error?.details?.[0]?.message ?? data?.error?.message ?? data?.message ?? `HTTP ${res.status}`;
      throw new Error(`ZeptoMail send failed: ${msg}`);
    }
    console.log(`\nSent via ZeptoMail. request_id=${data?.request_id ?? "?"} message_id=${data?.data?.[0]?.message_id ?? "?"}`);
    return;
  }

  // Fallback: SMTP via nodemailer.
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new Error("No mail transport: set ZEPTOMAIL_API_KEY or SMTP_HOST/USER/PASS");
  const port = Number(process.env.SMTP_PORT || 465);
  console.log(`\nNo ZeptoMail key; sending via SMTP (${host}:${port})...`);

  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || `${FROM.name} <${FROM.address}>`,
    to: `${TO.name} <${TO.address}>`,
    cc: `${CC.name} <${CC.address}>`,
    replyTo: `${REPLY_TO.name} <${REPLY_TO.address}>`,
    subject,
    text,
    html,
    attachments: FILES.map((f) => ({ filename: f.file, path: join(DIR, f.file) })),
  });
  console.log(`\nSent via SMTP. messageId=${info.messageId} accepted=${JSON.stringify(info.accepted)}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
