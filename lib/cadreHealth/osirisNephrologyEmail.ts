/**
 * Osiris Health — Consultant Nephrologist mandate email.
 *
 * Sent to nephrologists in the CadreProfessional DB. Hero CTA links to the
 * existing public job page. Referral CTA invites a reply-to with the
 * colleague's name and contact (no separate form; keeps it shipping today).
 */
import nodemailer from "nodemailer";
import { sendTransactionalEmail } from "@/lib/zeptomail";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.zoho.com",
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const FROM =
  process.env.CADRE_SMTP_FROM ??
  process.env.SMTP_FROM ??
  "CadreHealth <hello@consultforafrica.com>";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://consultforafrica.com";

const NEPHRO_SLUG = "consultant-nephrologist-lagos-ibadan-or-warri-a1y90t";
const HERO_URL = `${BASE_URL}/oncadre/jobs/${NEPHRO_SLUG}?utm_source=outreach&utm_campaign=osiris-nephro-2026-w23`;
const REFERRAL_MAILTO =
  "mailto:hello@consultforafrica.com?subject=Osiris%20referral&body=Hi%20Debo%2C%0A%0AColleague%20name%3A%0AContact%20%28email%20or%20phone%29%3A%0ARole%20they%20might%20fit%20%28Operations%20Manager%2C%20Medical%20Officer%20Dialysis%2C%20or%20Dialysis%20Nurse%29%3A%0AHow%20I%20know%20them%3A%0A%0AThanks%2C";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

interface Recipient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

function buildHTML(r: Recipient): string {
  const unsubscribeUrl = `${BASE_URL}/oncadre/unsubscribe/${r.id}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Osiris Health: Consultant Nephrologist mandate</title>
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:#0B3C5D;padding:32px 40px;">
              <span style="font-size:24px;font-weight:700;color:#FFFFFF;">Cadre</span><span style="font-size:24px;font-weight:700;color:#D4AF37;">Health</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#111827;">
                Dear Dr ${esc(r.lastName)},
              </p>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#111827;">
                We are recruiting on a confidential mandate from Osiris Health for a senior <strong>Consultant Nephrologist</strong> to anchor clinical leadership across their renal-care network.
              </p>

              <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#111827;">The role:</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="padding:6px 0;font-size:15px;color:#374151;line-height:1.5;">
                  <span style="color:#0B3C5D;font-weight:700;">&middot;</span>&nbsp; Full-time, permanent
                </td></tr>
                <tr><td style="padding:6px 0;font-size:15px;color:#374151;line-height:1.5;">
                  <span style="color:#0B3C5D;font-weight:700;">&middot;</span>&nbsp; Primary site: <strong>Lagos, Ibadan, or Warri</strong> based on your preference, with occasional travel between sites
                </td></tr>
                <tr><td style="padding:6px 0;font-size:15px;color:#374151;line-height:1.5;">
                  <span style="color:#0B3C5D;font-weight:700;">&middot;</span>&nbsp; Compensation: <strong>NGN 1.2M to 2.5M monthly</strong>, depending on experience
                </td></tr>
                <tr><td style="padding:6px 0;font-size:15px;color:#374151;line-height:1.5;">
                  <span style="color:#0B3C5D;font-weight:700;">&middot;</span>&nbsp; Minimum 8 years post-fellowship
                </td></tr>
                <tr><td style="padding:6px 0;font-size:15px;color:#374151;line-height:1.5;">
                  <span style="color:#0B3C5D;font-weight:700;">&middot;</span>&nbsp; You lead clinical governance across the dialysis programmes and anchor the consultant team across an expanding multi-site network
                </td></tr>
              </table>

              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#4B5563;">
                The full brief sits on our job board. You can read it and signal interest in two minutes.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#0B3C5D;border-radius:8px;">
                    <a href="${HERO_URL}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                      See the mandate brief
                    </a>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                <tr><td style="border-top:1px solid #E5E7EB;padding-top:24px;"></td></tr>
              </table>

              <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111827;">A small additional ask.</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#4B5563;">
                Osiris is also recruiting three other senior roles this quarter that may sit within your network:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr><td style="padding:5px 0;font-size:14px;color:#374151;line-height:1.5;">
                  <span style="color:#0B3C5D;font-weight:700;">&middot;</span>&nbsp; Operations Manager (Healthcare), Lagos, NGN 600k to 1.2M monthly
                </td></tr>
                <tr><td style="padding:5px 0;font-size:14px;color:#374151;line-height:1.5;">
                  <span style="color:#0B3C5D;font-weight:700;">&middot;</span>&nbsp; Medical Officer (Dialysis), Ibadan and Warri, NGN 350k to 550k monthly
                </td></tr>
                <tr><td style="padding:5px 0;font-size:14px;color:#374151;line-height:1.5;">
                  <span style="color:#0B3C5D;font-weight:700;">&middot;</span>&nbsp; Dialysis Nurse, Ibadan and Warri, NGN 220k to 380k monthly
                </td></tr>
              </table>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4B5563;">
                If a colleague comes to mind for any of these, you can pass them on in thirty seconds.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#D4AF37;border-radius:8px;">
                    <a href="${REFERRAL_MAILTO}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#0B3C5D;text-decoration:none;">
                      Refer a colleague
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#4B5563;">
                Anyone you refer who is shortlisted carries your endorsement, and we will tell them you sent us.
              </p>

              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6B7280;">
                We are keeping each of these searches to fewer than ten serious conversations. Your details stay with CadreHealth and Consult For Africa unless you explicitly say otherwise. If now is not the right time and no one comes to mind, replying with "later" keeps you on the list for the next nephrology mandate without further follow-up on this one.
              </p>

              <p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#111827;">
                With respect,
              </p>
              <p style="margin:0 0 2px;font-size:15px;line-height:1.5;color:#111827;font-weight:600;">
                Dr Debo Odulana
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#6B7280;">
                Founding Partner, Consult For Africa
              </p>

              <p style="margin:0 0 8px;font-size:13px;color:#9CA3AF;line-height:1.5;">
                If the button does not work, paste this link into your browser:
              </p>
              <p style="margin:0 0 20px;font-size:12px;color:#6B7280;word-break:break-all;">
                ${HERO_URL}
              </p>

              <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.5;">
                You are receiving this because Osiris Health asked us to consult with practising nephrologists. You can
                <a href="${unsubscribeUrl}" style="color:#6B7280;text-decoration:underline;">unsubscribe here</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background:#F9FAFB;border-top:1px solid #E5E7EB;">
              <p style="margin:0;font-size:13px;color:#9CA3AF;text-align:center;">
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

export interface MandateEmailResult {
  ok: boolean;
  error?: string;
}

export async function sendOsirisNephrologyEmail(r: Recipient): Promise<MandateEmailResult> {
  const subject = "Consultant Nephrologist mandate at Osiris Health";
  const html = buildHTML(r);

  if (process.env.ZEPTOMAIL_API_KEY) {
    const result = await sendTransactionalEmail({ from: FROM, to: r.email, subject, html });
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true };
  }
  if (!process.env.SMTP_USER) {
    return { ok: false, error: "No transport configured (set ZEPTOMAIL_API_KEY or SMTP_USER)" };
  }
  try {
    await transporter.sendMail({ from: FROM, to: r.email, subject, html });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
