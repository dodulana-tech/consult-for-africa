/**
 * CadreHealth Activation Email
 *
 * Sent to professionals who CLAIMED a profile (passwordHash set) but never
 * came back to actually use it. Distinct from outreachEmail.ts which targets
 * never-claimed contacts.
 *
 * Hook: profile is at 30% complete. Two-minute completion unlocks matching.
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

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

interface Recipient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subSpecialty?: string | null;
}

function buildHTML(r: Recipient): string {
  const portalUrl = `${BASE_URL}/oncadre/portal/profile?utm_source=activation&utm_campaign=2026-w22`;
  const unsubscribeUrl = `${BASE_URL}/oncadre/unsubscribe/${r.id}`;
  const specialtyLine = r.subSpecialty
    ? `Right now we know your specialty (${esc(r.subSpecialty)}) and your contact details. That is enough to send you generic alerts. It is not enough to send you the right ones.`
    : `Right now we know little more than your name and email. That is enough to send you generic alerts. It is not enough to send you the right ones.`;

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
                You set up your CadreHealth account, which we appreciate. Your profile is currently 30 per cent complete.
              </p>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#4B5563;">
                ${specialtyLine}
              </p>
              <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#4B5563;">
                Two minutes adds the three things that actually drive matching:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="padding:8px 0;font-size:15px;color:#374151;line-height:1.5;">
                  <span style="color:#0B3C5D;font-weight:700;">&middot;</span>&nbsp; whether you are open to permanent, locum or visiting work right now
                </td></tr>
                <tr><td style="padding:8px 0;font-size:15px;color:#374151;line-height:1.5;">
                  <span style="color:#0B3C5D;font-weight:700;">&middot;</span>&nbsp; your current compensation band, anonymised
                </td></tr>
                <tr><td style="padding:8px 0;font-size:15px;color:#374151;line-height:1.5;">
                  <span style="color:#0B3C5D;font-weight:700;">&middot;</span>&nbsp; geographic preference, including diaspora practice
                </td></tr>
              </table>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4B5563;">
                This is what allows our partner hospitals to find you for opportunities that fit, rather than opportunities that look fit-shaped.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#0B3C5D;border-radius:8px;">
                    <a href="${portalUrl}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                      Complete my profile
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4B5563;">
                We are also preparing the first CadreHealth sector report. The compensation, locum and mobility data inside it will come from professionals who completed their profiles. The more of you who do, the more useful the report.
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
                ${portalUrl}
              </p>
              <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.5;">
                You are receiving this because you claimed your CadreHealth profile. If you would prefer not to receive further messages, you can
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

export interface ActivationEmailResult {
  ok: boolean;
  error?: string;
}

export async function sendActivationEmail(r: Recipient): Promise<ActivationEmailResult> {
  const subject = "Your CadreHealth profile is 30 per cent complete";
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
