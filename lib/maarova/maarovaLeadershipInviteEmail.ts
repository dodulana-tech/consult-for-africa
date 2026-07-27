/**
 * Maarova Healthcare Leadership Assessment — complimentary-place invite.
 *
 * Cold outreach from the CFA comms lead (Nimi) to a hand-picked list of
 * clinicians, offering a complimentary place on the Maarova assessment.
 *
 * Deliberately plain and personal: no heavy marketing template. The register
 * is "a colleague writes to a colleague" (see senior-medic copy rules), so the
 * HTML is a lightly-styled note with a matching plain-text part. Reply-to-me is
 * the only call to action; registration details go out on reply.
 */
import nodemailer from "nodemailer";
import { sendTransactionalEmail } from "@/lib/zeptomail";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.zoho.com",
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

/** Sender identity. Override via env so replies land in Nimi's mailbox. */
export const FROM =
  process.env.MAAROVA_SMTP_FROM ??
  process.env.SMTP_FROM ??
  "Consult For Africa <hello@consultforafrica.com>";

export const REPLY_TO =
  process.env.MAAROVA_REPLY_TO ??
  process.env.REPLY_TO_EMAIL ??
  "hello@consultforafrica.com";

export const SUBJECT =
  "A complimentary Maarova leadership assessment, for a small group of clinicians";

export interface InviteRecipient {
  firstName: string;
  lastName: string;
  email: string;
  /** Salutation title, defaults to "Dr". Set to "" to greet by first name. */
  title?: string;
}

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

I am writing on behalf of Consult For Africa. This month we are opening a small number of complimentary places on the Maarova Healthcare Leadership Assessment, and I would like to offer you one.

Maarova was built specifically for the healthcare sector. It produces a personal report on your leadership strengths, emotional intelligence, communication style, and decision-making. Colleagues have used it to see how their leadership reads to the teams around them, not only how their clinical work does.

It takes about twenty minutes, and the report is yours to keep.

If you would like one of the places, reply to this email and I will send the registration details.

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
  <title>${esc(SUBJECT)}</title>
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
                I am writing on behalf of Consult For Africa. This month we are opening a small number of
                complimentary places on the Maarova Healthcare Leadership Assessment, and I would like to offer you one.
              </p>
              <p style="${p}">
                Maarova was built specifically for the healthcare sector. It produces a personal report on your
                leadership strengths, emotional intelligence, communication style, and decision-making. Colleagues have
                used it to see how their leadership reads to the teams around them, not only how their clinical work does.
              </p>
              <p style="${p}">
                It takes about twenty minutes, and the report is yours to keep.
              </p>
              <p style="${p}">
                If you would like one of the places, reply to this email and I will send the registration details.
              </p>
              <p style="${p}">
                Kind regards,<br>
                <strong>Toluwanimi Olayeni</strong><br>
                Consult For Africa
              </p>
              <p style="margin:28px 0 0;font-size:13px;line-height:1.5;color:#9CA3AF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
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

export interface InviteSendResult {
  ok: boolean;
  error?: string;
}

export async function sendMaarovaInviteEmail(r: InviteRecipient): Promise<InviteSendResult> {
  const html = buildHTML(r);
  const text = buildText(r);

  if (process.env.ZEPTOMAIL_API_KEY) {
    const result = await sendTransactionalEmail({
      from: FROM,
      replyTo: REPLY_TO,
      to: r.email,
      subject: SUBJECT,
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
    await transporter.sendMail({ from: FROM, replyTo: REPLY_TO, to: r.email, subject: SUBJECT, html, text });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
