/**
 * 7-day reminder email for outreach records that received the initial
 * note but have not yet claimed. Tone is intentionally lighter than the
 * first email: brief, factual, no value-prop pitch, single CTA.
 *
 * Prefers ZeptoMail HTTP API when ZEPTOMAIL_API_KEY is set; falls back
 * to Zoho SMTP via nodemailer otherwise.
 */

import nodemailer from "nodemailer";
import { sendTransactionalEmail } from "@/lib/zeptomail";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.zoho.com",
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM =
  process.env.CADRE_SMTP_FROM ??
  process.env.SMTP_FROM ??
  "CadreHealth <hello@consultforafrica.com>";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://consultforafrica.com";

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface ReminderProfessional {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ReminderEmailResult {
  ok: boolean;
  error?: string;
}

function buildReminderHTML(p: ReminderProfessional): string {
  const claimUrl = `${BASE_URL}/oncadre/claim/${p.id}`;
  const unsubscribeUrl = `${BASE_URL}/oncadre/unsubscribe/${p.id}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>CadreHealth</title>
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <tr>
            <td style="background:#0B3C5D;padding:28px 40px;">
              <span style="font-size:22px;font-weight:700;color:#FFFFFF;">Cadre</span><span style="font-size:22px;font-weight:700;color:#D4AF37;">Health</span>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#111827;">
                Dear Dr ${esc(p.lastName)},
              </p>

              <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#374151;">
                Last week we wrote about the verified register of Nigerian specialists we are building at CadreHealth. Your record is held for you for now.
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#374151;">
                Claiming takes about twenty minutes. The first question is simply where you are in your career today, in Nigeria, abroad, or stepped back from full-time clinical work. The platform is built for all three.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="background:#0B3C5D;border-radius:8px;">
                    <a href="${claimUrl}" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                      Claim your profile
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 22px;font-size:13px;line-height:1.6;color:#6B7280;">
                Any trouble or feedback, message us on WhatsApp at <a href="https://wa.me/2349138138553" style="color:#0B3C5D;text-decoration:none;font-weight:600;">+234 913 813 8553</a>.
              </p>

              <p style="margin:0 0 4px;font-size:14px;line-height:1.6;color:#111827;">
                With respect,
              </p>
              <p style="margin:0 0 2px;font-size:14px;line-height:1.5;color:#111827;font-weight:600;">
                Dr Debo Odulana
              </p>
              <p style="margin:0 0 24px;font-size:13px;line-height:1.5;color:#6B7280;">
                Founding Partner, Consult For Africa
              </p>

              <p style="margin:0 0 6px;font-size:12px;color:#9CA3AF;line-height:1.5;">
                If the button does not open, the link is:
              </p>
              <p style="margin:0 0 18px;font-size:11px;color:#6B7280;word-break:break-all;">
                ${claimUrl}
              </p>

              <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.5;">
                If you would prefer not to receive further messages, you can
                <a href="${unsubscribeUrl}" style="color:#6B7280;text-decoration:underline;">unsubscribe here</a>.
                We will not write again after this.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px;background:#F9FAFB;border-top:1px solid #E5E7EB;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
                CadreHealth by Consult For Africa
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendReminderEmail(p: ReminderProfessional): Promise<ReminderEmailResult> {
  const subject = "Following up on last week's note";
  const html = buildReminderHTML(p);

  if (process.env.ZEPTOMAIL_API_KEY) {
    console.log(`[outreach-reminder] Sending to ${p.email} via ZeptoMail`);
    const result = await sendTransactionalEmail({
      from: FROM,
      to: p.email,
      subject,
      html,
    });
    if (!result.ok) {
      console.error(`[outreach-reminder] ZeptoMail failed for ${p.email}:`, result.error);
      return { ok: false, error: result.error };
    }
    return { ok: true };
  }

  if (!process.env.SMTP_USER) {
    const error = "No transport configured (set ZEPTOMAIL_API_KEY or SMTP_USER)";
    console.log(`[outreach-reminder] ${error}. Would send to ${p.email}`);
    return { ok: false, error };
  }

  try {
    console.log(`[outreach-reminder] Sending to ${p.email} via SMTP`);
    await transporter.sendMail({ from: FROM, to: p.email, subject, html });
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[outreach-reminder] Failed to send to ${p.email}:`, error);
    return { ok: false, error };
  }
}
