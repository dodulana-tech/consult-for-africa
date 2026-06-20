/**
 * One-off: notify Dr Maryam that her CadreHealth email was updated.
 * Self-contained (no @/ alias imports). Loads .env.local for ZEPTOMAIL_API_KEY.
 * Usage: npx ts-node --transpile-only scripts/send-maryam-email-updated.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import nodemailer from "nodemailer";

// ---- load .env.local (standalone scripts don't get Next's env loading) ----
function loadEnv(file: string) {
  try {
    const raw = readFileSync(join(process.cwd(), file), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(m[1] in process.env)) process.env[m[1]] = val;
    }
  } catch { /* file optional */ }
}
loadEnv(".env.local");
loadEnv(".env");

const TO = "dantatamb@gmail.com";
const TO_NAME = "Dr Maryam Dantata";
const FROM = process.env.CADRE_SMTP_FROM ?? process.env.SMTP_FROM ?? "CadreHealth <platform@consultforafrica.com>";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CadreHealth</title></head>
<body style="margin:0;padding:0;background:#F8F9FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #E8EBF0;overflow:hidden;">
      <tr><td style="background:#0B3C5D;padding:24px 32px;">
        <span style="color:#fff;font-weight:700;font-size:18px;">Cadre</span><span style="color:#D4AF37;font-weight:700;font-size:18px;">Health</span>
      </td></tr>
      <tr><td style="padding:32px;">${content}</td></tr>
      <tr><td style="padding:16px 32px;background:#F8F9FB;border-top:1px solid #E8EBF0;color:#9CA3AF;font-size:11px;">
        CadreHealth by Consult For Africa.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

const heading = "Your email address has been updated";
const body =
  "Hello Dr Maryam, this is a quick note to confirm that the email address on your CadreHealth profile has now been updated to dantatamb@gmail.com. " +
  "Please use this address to sign in from now on. If you did not request this change, contact us at hello@consultforafrica.com right away and we will secure your account.";
const ctaText = "Go to CadreHealth";
const ctaHref = "https://consultforafrica.com/oncadre";
const footer = "Warm regards, the Consult For Africa team.";

const html = layout(`
  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0B3C5D;">${esc(heading)}</h1>
  <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">${esc(body)}</p>
  <a href="${esc(ctaHref)}" style="display:inline-block;padding:12px 28px;background:#D4AF37;color:#06090f;font-weight:600;font-size:14px;text-decoration:none;border-radius:8px;">${esc(ctaText)}</a>
  <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#9CA3AF;">${esc(footer)}</p>
`);

function parseAddress(input: string) {
  const m = input.match(/^\s*([^<]+?)\s*<([^>]+)>\s*$/);
  return m ? { address: m[2].trim(), name: m[1].trim() } : { address: input.trim(), name: undefined as string | undefined };
}

const SUBJECT = "Your CadreHealth email address has been updated";

async function sendViaZepto(): Promise<boolean> {
  const rawKey = process.env.ZEPTOMAIL_API_KEY;
  if (!rawKey || !rawKey.trim()) return false;
  const apiKey = rawKey.replace(/^Zoho-enczapikey\s*/i, "").trim();
  const from = parseAddress(FROM);
  const res = await fetch("https://api.zeptomail.com/v1.1/email", {
    method: "POST",
    headers: { Authorization: `Zoho-enczapikey ${apiKey}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      from: { address: from.address, name: from.name },
      to: [{ email_address: { address: TO, name: TO_NAME } }],
      subject: SUBJECT,
      htmlbody: html,
    }),
  });
  const data: any = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error?.details?.[0]?.message ?? data?.error?.message ?? data?.message ?? `HTTP ${res.status}`;
    throw new Error(`ZeptoMail failed: ${err}`);
  }
  console.log("SENT via ZeptoMail. messageId:", data?.data?.[0]?.message_id ?? "unknown");
  return true;
}

async function sendViaSmtp(): Promise<boolean> {
  if (!process.env.SMTP_USER) return false;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const info = await transporter.sendMail({ from: FROM, to: `${TO_NAME} <${TO}>`, subject: SUBJECT, html });
  console.log("SENT via SMTP. messageId:", info.messageId, "accepted:", JSON.stringify(info.accepted));
  return true;
}

async function main() {
  console.log(`Sending from ${parseAddress(FROM).address} to ${TO} ...`);
  if (await sendViaZepto()) return;
  if (await sendViaSmtp()) return;
  throw new Error("No email transport configured (no ZEPTOMAIL_API_KEY, no SMTP_USER)");
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
