/**
 * CadreHealth Outreach Email Sender
 *
 * Sends reactivation/claim emails to imported professionals
 * using existing Zoho SMTP configuration.
 */

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.zoho.com",
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Fall back to the same env vars cadreEmail.ts uses so the FROM matches the
// SMTP-authenticated mailbox -- Zoho rejects sends where they differ.
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

interface ProfessionalInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  cadre: string;
  subSpecialty?: string | null;
}

function buildEmailHTML(professional: ProfessionalInfo): string {
  const claimUrl = `${BASE_URL}/oncadre/claim/${professional.id}`;
  const unsubscribeUrl = `${BASE_URL}/oncadre/unsubscribe/${professional.id}`;

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

          <!-- Header -->
          <tr>
            <td style="background:#0B3C5D;padding:32px 40px;">
              <span style="font-size:24px;font-weight:700;color:#FFFFFF;">Cadre</span><span style="font-size:24px;font-weight:700;color:#D4AF37;">Health</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#111827;">
                Dear Dr ${esc(professional.lastName)},
              </p>

              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#111827;">
                You are a registered Nigerian specialist. We are building the directory you should already have.
              </p>

              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#4B5563;">
                CadreHealth is a verified register of Nigerian specialists, wherever they currently practise. You can use it to:
              </p>

              <!-- Value Props -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="width:32px;vertical-align:top;">
                        <div style="width:22px;height:22px;background:#D4AF37;border-radius:50%;text-align:center;line-height:22px;color:#0B3C5D;font-size:11px;font-weight:700;">&#10003;</div>
                      </td>
                      <td style="padding-left:10px;font-size:15px;color:#374151;line-height:1.5;">
                        confirm your specialty record and contact preferences
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="width:32px;vertical-align:top;">
                        <div style="width:22px;height:22px;background:#D4AF37;border-radius:50%;text-align:center;line-height:22px;color:#0B3C5D;font-size:11px;font-weight:700;">&#10003;</div>
                      </td>
                      <td style="padding-left:10px;font-size:15px;color:#374151;line-height:1.5;">
                        receive salary, locum and fractional benchmarks for your specialty
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="width:32px;vertical-align:top;">
                        <div style="width:22px;height:22px;background:#D4AF37;border-radius:50%;text-align:center;line-height:22px;color:#0B3C5D;font-size:11px;font-weight:700;">&#10003;</div>
                      </td>
                      <td style="padding-left:10px;font-size:15px;color:#374151;line-height:1.5;">
                        opt in (or not) to visiting consultant, advisory or mentorship roles in Nigeria
                      </td>
                    </tr></table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#4B5563;">
                We are writing to a small group of senior consultants. Many of you are still in Nigeria. A significant number now practise abroad. Some have stepped back from full-time clinical work. The platform is built for all three.
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4B5563;">
                Many of you will know me through the Doctors Foundation for Care, where I serve as president. CadreHealth is what comes after the annual convention: a continuous directory, not a once-a-year set-piece.
              </p>

              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#4B5563;">
                Twenty minutes will let you claim and update your profile.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#0B3C5D;border-radius:8px;">
                    <a href="${claimUrl}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                      Claim your profile
                    </a>
                  </td>
                </tr>
              </table>

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
                If the button does not work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 20px;font-size:12px;color:#6B7280;word-break:break-all;">
                ${claimUrl}
              </p>

              <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.5;">
                If you would prefer not to receive further messages, you can
                <a href="${unsubscribeUrl}" style="color:#6B7280;text-decoration:underline;">unsubscribe here</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
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

export interface ReactivationEmailResult {
  ok: boolean;
  error?: string;
}

export async function sendReactivationEmail(
  professional: ProfessionalInfo,
): Promise<ReactivationEmailResult> {
  if (!process.env.SMTP_USER) {
    const error = "SMTP not configured (SMTP_USER missing)";
    console.log(`[outreach-email] ${error}. Would send to ${professional.email}`);
    return { ok: false, error };
  }

  const subject = "For Nigerian specialists, wherever you practise";
  const html = buildEmailHTML(professional);

  try {
    console.log(`[outreach-email] Sending to ${professional.email}`);
    await transporter.sendMail({ from: FROM, to: professional.email, subject, html });
    console.log(`[outreach-email] Sent to ${professional.email}`);
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[outreach-email] Failed to send to ${professional.email}:`, error);
    return { ok: false, error };
  }
}
