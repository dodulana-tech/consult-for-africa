import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

const resend = new Resend(process.env.RESEND_API_KEY ?? "noop");

function escHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export const POST = handler(async function POST(req: Request) {
  const data = await req.json();

  // Honeypot
  if (data.website || data._honey) {
    return NextResponse.json({ success: true });
  }

  const {
    name,
    email,
    organisation,
    role,
    numberOfLeaders,
    streamInterest,
    timeline,
    message,
  } = data;

  // Basic spam check
  const allText = `${name} ${email} ${organisation} ${role ?? ""} ${message ?? ""}`;
  const consonantRatio = (allText.replace(/[^bcdfghjklmnpqrstvwxyz]/gi, "").length) / Math.max(allText.length, 1);
  if (consonantRatio > 0.7 && allText.length > 30) {
    console.log(`[maarova/demo] SPAM blocked: ${email}`);
    return NextResponse.json({ success: true });
  }

  if (!name || !email || !organisation) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 },
    );
  }

  // Basic email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return NextResponse.json(
      { success: false, error: "Invalid email address" },
      { status: 400 },
    );
  }

  // Truncate message to prevent abuse
  const safeMessage = String(message ?? "").substring(0, 2000);

  // Save to Lead table
  try {
    await prisma.lead.create({
      data: {
        source: "MAAROVA_DEMO",
        status: "NEW",
        organizationName: String(organisation).trim(),
        contactName: String(name).trim(),
        contactEmail: String(email).trim().toLowerCase(),
        contactRole: role ? String(role).trim() : null,
        inboundMessage: safeMessage || null,
        maarovaStream: streamInterest ? String(streamInterest).trim() : null,
        maarovaLeaderCount: numberOfLeaders ? parseInt(String(numberOfLeaders), 10) : null,
        maarovaTimeline: timeline ? String(timeline).trim() : null,
      },
    });
  } catch (err) {
    console.error("[maarova-demo] lead creation failed", err);
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#0F2744">Maarova Demo Request</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Name</td><td style="padding:8px 0;font-size:14px;font-weight:600">${escHtml(name)}</td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Email</td><td style="padding:8px 0;font-size:14px"><a href="mailto:${escHtml(email)}">${escHtml(email)}</a></td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Organisation</td><td style="padding:8px 0;font-size:14px;font-weight:600">${escHtml(organisation)}</td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Role</td><td style="padding:8px 0;font-size:14px">${escHtml(role ?? "Not specified")}</td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Number of Leaders</td><td style="padding:8px 0;font-size:14px">${escHtml(numberOfLeaders ?? "Not specified")}</td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Stream Interest</td><td style="padding:8px 0;font-size:14px">${escHtml(streamInterest ?? "Not specified")}</td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Timeline</td><td style="padding:8px 0;font-size:14px">${escHtml(timeline ?? "Not specified")}</td></tr>
      </table>
      ${
        safeMessage
          ? `<hr style="border:none;border-top:1px solid #e5eaf0;margin:16px 0">
      <h3 style="color:#0F2744;font-size:14px">Message</h3>
      <p style="font-size:14px;line-height:1.6;color:#374151">${escHtml(safeMessage).replace(/\n/g, "<br>")}</p>`
          : ""
      }
    </div>
  `;

  const notifyTo = process.env.CONTACT_EMAIL ?? "hello@consultforafrica.com";

  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: "Maarova Platform <platform@consultforafrica.com>",
        to: notifyTo,
        replyTo: email,
        subject: `Maarova Demo Request from ${organisation}`,
        html,
      });
    } catch (err) {
      console.error("[maarova-demo] email send failed", err);
    }
  } else {
    console.log("[maarova-demo] SMTP not configured, skipping email send");
  }

  return NextResponse.json({ success: true });
});
