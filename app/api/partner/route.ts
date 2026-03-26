import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "noop");

function escHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function POST(req: Request) {
  const body = await req.json();
  const { organization, country, role, email, partnerType, message } = body;

  if (!email || !organization) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return NextResponse.json({ success: false, error: "Invalid email address" }, { status: 400 });
  }

  const safeMessage = message ? String(message).substring(0, 2000) : null;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#0F2744">New Partner Enquiry: Consult For Africa</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Organisation</td><td style="padding:8px 0;font-size:14px;font-weight:600">${escHtml(organization)}</td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Country</td><td style="padding:8px 0;font-size:14px">${escHtml(country ?? "Not specified")}</td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Role</td><td style="padding:8px 0;font-size:14px">${escHtml(role ?? "Not specified")}</td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Email</td><td style="padding:8px 0;font-size:14px"><a href="mailto:${escHtml(email)}">${escHtml(email)}</a></td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Partnership Type</td><td style="padding:8px 0;font-size:14px">${escHtml(partnerType ?? "Not specified")}</td></tr>
      </table>
      ${safeMessage ? `
      <hr style="border:none;border-top:1px solid #e5eaf0;margin:16px 0">
      <h3 style="color:#0F2744;font-size:14px">Message</h3>
      <p style="font-size:14px;line-height:1.6;color:#374151">${escHtml(safeMessage).replace(/\n/g, "<br>")}</p>
      ` : ""}
    </div>
  `;

  const notifyTo = process.env.CONTACT_EMAIL ?? "hello@consultforafrica.com";

  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: "Consult For Africa <platform@consultforafrica.com>",
        to: notifyTo,
        replyTo: email,
        subject: `New partner enquiry from ${escHtml(organization)}`,
        html,
      });
    } catch (err) {
      console.error("[partner] email send failed", err);
    }
  } else {
    console.log("[partner] SMTP not configured, skipping email send");
  }

  return NextResponse.json({ success: true });
}
