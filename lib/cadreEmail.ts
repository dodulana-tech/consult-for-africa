import nodemailer from "nodemailer";

/** Escape HTML entities in user-supplied values */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
  "CadreHealth <platform@consultforafrica.com>";

function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CadreHealth</title></head>
<body style="margin:0;padding:0;background:#F8F9FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #E8EBF0;overflow:hidden;">
        <tr><td style="background:#0B3C5D;padding:24px 32px;">
          <span style="color:#fff;font-weight:700;font-size:18px;">Cadre</span><span style="color:#D4AF37;font-weight:700;font-size:18px;">Health</span>
        </td></tr>
        <tr><td style="padding:32px;">${content}</td></tr>
        <tr><td style="padding:16px 32px;background:#F8F9FB;border-top:1px solid #E8EBF0;color:#9CA3AF;font-size:11px;">
          CadreHealth by Consult For Africa. This email was sent automatically.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendCadreEmail({
  to,
  subject,
  heading,
  body,
  ctaText,
  ctaHref,
  footer,
}: {
  to: string;
  subject: string;
  heading: string;
  body: string;
  ctaText?: string;
  ctaHref?: string;
  footer?: string;
}) {
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0B3C5D;">${esc(heading)}</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">${esc(body)}</p>
    ${
      ctaText && ctaHref
        ? `<a href="${esc(ctaHref)}" style="display:inline-block;padding:12px 28px;background:#D4AF37;color:#06090f;font-weight:600;font-size:14px;text-decoration:none;border-radius:8px;">${esc(ctaText)}</a>`
        : ""
    }
    ${
      footer
        ? `<p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#9CA3AF;">${esc(footer)}</p>`
        : ""
    }
  `);

  if (!process.env.SMTP_USER) {
    console.log(`[cadreEmail] SMTP not configured. To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    console.log(`[cadreEmail] sending to ${to}: ${subject}`);
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`[cadreEmail] sent to ${to}`);
  } catch (err) {
    console.error(`[cadreEmail] send error to ${to}:`, err);
    throw err;
  }
}
