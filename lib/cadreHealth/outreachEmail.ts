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

const FROM = "CadreHealth <platform@consultforafrica.com>";

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
  const specialty = professional.subSpecialty
    ? esc(professional.subSpecialty)
    : esc(professional.cadre);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your CadreHealth Profile</title>
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
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">
                Dr. ${esc(professional.lastName)}, your specialist profile is ready
              </h1>

              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#4B5563;">
                Your ${specialty} profile has been created on CadreHealth, the career intelligence platform built for Nigerian healthcare professionals.
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4B5563;">
                Here is what you get with your free profile:
              </p>

              <!-- Value Props -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #F3F4F6;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="width:32px;vertical-align:top;">
                        <div style="width:24px;height:24px;background:#D4AF37;border-radius:50%;text-align:center;line-height:24px;color:#0B3C5D;font-size:12px;font-weight:700;">&#10003;</div>
                      </td>
                      <td style="padding-left:12px;font-size:15px;color:#374151;line-height:1.5;">
                        <strong>Salary intelligence:</strong> See what your cadre earns across facilities and states
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #F3F4F6;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="width:32px;vertical-align:top;">
                        <div style="width:24px;height:24px;background:#D4AF37;border-radius:50%;text-align:center;line-height:24px;color:#0B3C5D;font-size:12px;font-weight:700;">&#10003;</div>
                      </td>
                      <td style="padding-left:12px;font-size:15px;color:#374151;line-height:1.5;">
                        <strong>Honest hospital reviews:</strong> Read verified reviews from colleagues before you accept a role
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="width:32px;vertical-align:top;">
                        <div style="width:24px;height:24px;background:#D4AF37;border-radius:50%;text-align:center;line-height:24px;color:#0B3C5D;font-size:12px;font-weight:700;">&#10003;</div>
                      </td>
                      <td style="padding-left:12px;font-size:15px;color:#374151;line-height:1.5;">
                        <strong>Career opportunities:</strong> Get matched to roles based on your cadre, location, and preferences
                      </td>
                    </tr></table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#0B3C5D;border-radius:8px;">
                    <a href="${claimUrl}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                      View Your Profile
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:14px;color:#9CA3AF;line-height:1.5;">
                If the button does not work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:13px;color:#6B7280;word-break:break-all;">
                ${claimUrl}
              </p>

              <p style="margin:0;font-size:14px;color:#9CA3AF;line-height:1.5;">
                This is a one-time message. If you are no longer practising in Nigeria or prefer not to receive further messages, you can
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

export async function sendReactivationEmail(
  professional: ProfessionalInfo
): Promise<boolean> {
  if (!process.env.SMTP_USER) {
    console.log(
      `[outreach-email] SMTP not configured. Would send to ${professional.email}`
    );
    return false;
  }

  const subject = `Dr. ${professional.lastName}, your specialist profile on CadreHealth`;
  const html = buildEmailHTML(professional);

  try {
    console.log(`[outreach-email] Sending to ${professional.email}`);
    await transporter.sendMail({ from: FROM, to: professional.email, subject, html });
    console.log(`[outreach-email] Sent to ${professional.email}`);
    return true;
  } catch (err) {
    console.error(`[outreach-email] Failed to send to ${professional.email}:`, err);
    return false;
  }
}
