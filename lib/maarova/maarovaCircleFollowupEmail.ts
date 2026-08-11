/**
 * Maarova Founding Circle — follow-up with the direct application link.
 *
 * The first invite (maarovaLeadershipInviteEmail) asked recipients to reply for
 * details. This follow-up hands them the CTA directly: the Founding Circle
 * application page. Same personal, senior-medic register; button plus a
 * plain-text link so it works everywhere.
 */
import nodemailer from "nodemailer";
import { sendTransactionalEmail } from "@/lib/zeptomail";
import { FROM, REPLY_TO, type InviteRecipient } from "@/lib/maarova/maarovaLeadershipInviteEmail";

export { FROM, REPLY_TO };

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.zoho.com",
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export const CIRCLE_URL = "https://www.consultforafrica.com/maarova/circle";

export const FOLLOWUP_SUBJECT =
  "Your place in the Maarova Founding Circle: the link to apply";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function salutation(r: InviteRecipient): string {
  const title = r.title === undefined ? "Dr" : r.title;
  return title ? `Dear ${title} ${r.lastName}` : `Dear ${r.firstName}`;
}

export function buildText(r: InviteRecipient): string {
  return `${salutation(r)},

I wrote a few days ago about a complimentary place on the Maarova Healthcare Leadership Assessment. To make it simple, here is the direct link to apply for the Founding Circle:

${CIRCLE_URL}

The application takes about three minutes. Once you are in, the assessment gives you a personal report on your leadership strengths, emotional intelligence, communication style, and decision-making, at no cost.

If the link gives you any trouble, reply here and I will help.

Kind regards,
Toluwanimi Olayeni
Consult For Africa

If you would rather not hear from us, reply with "no thanks" and I will take you off the list.`;
}

export function buildHTML(r: InviteRecipient): string {
  const p =
    "margin:0 0 16px;font-size:16px;line-height:1.65;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(FOLLOWUP_SUBJECT)}</title>
</head>
<body style="margin:0;padding:0;background:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding:8px 0 24px;">
              <p style="${p}">${esc(salutation(r))},</p>
              <p style="${p}">
                I wrote a few days ago about a complimentary place on the Maarova Healthcare Leadership Assessment.
                To make it simple, here is the direct link to apply for the Founding Circle.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
                <tr>
                  <td style="background:#0B3C5D;border-radius:8px;">
                    <a href="${CIRCLE_URL}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Apply for your place
                    </a>
                  </td>
                </tr>
              </table>
              <p style="${p}">
                The application takes about three minutes. Once you are in, the assessment gives you a personal report on
                your leadership strengths, emotional intelligence, communication style, and decision-making, at no cost.
              </p>
              <p style="${p}">
                If the link gives you any trouble, reply here and I will help.
              </p>
              <p style="${p}">
                Kind regards,<br>
                <strong>Toluwanimi Olayeni</strong><br>
                Consult For Africa
              </p>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6B7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;word-break:break-all;">
                If the button does not work, paste this into your browser:<br>
                <a href="${CIRCLE_URL}" style="color:#0B3C5D;">${CIRCLE_URL}</a>
              </p>
              <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#9CA3AF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                If you would rather not hear from us, reply with &ldquo;no thanks&rdquo; and I will take you off the list.
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

export interface FollowupSendResult {
  ok: boolean;
  error?: string;
}

export async function sendMaarovaCircleFollowup(r: InviteRecipient): Promise<FollowupSendResult> {
  const html = buildHTML(r);
  const text = buildText(r);

  if (process.env.ZEPTOMAIL_API_KEY) {
    const result = await sendTransactionalEmail({
      from: FROM,
      replyTo: REPLY_TO,
      to: r.email,
      subject: FOLLOWUP_SUBJECT,
      html,
      text,
    });
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true };
  }
  if (!process.env.SMTP_USER) {
    return { ok: false, error: "No transport configured (set ZEPTOMAIL_API_KEY or SMTP_USER)" };
  }
  try {
    await transporter.sendMail({ from: FROM, replyTo: REPLY_TO, to: r.email, subject: FOLLOWUP_SUBJECT, html, text });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
