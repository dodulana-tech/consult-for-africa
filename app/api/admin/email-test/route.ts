import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { handler } from "@/lib/api-handler";
import { sendTransactionalEmail } from "@/lib/zeptomail";
import nodemailer from "nodemailer";

const FROM = process.env.SMTP_FROM ?? "Consult For Africa <hello@consultforafrica.com>";
const REPLY_TO = process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com";

/**
 * GET /api/admin/email-test
 *
 * One-shot transport verifier. Sends a test email to ?to= (defaults to
 * the admin's own email) and reports which transport was used. Admin-
 * only. Use this to confirm ZEPTOMAIL_API_KEY is wired correctly.
 */
export const GET = handler(async function GET(req: NextRequest) {
  // Allow either an admin browser session OR a bearer with CRON_SECRET
  // so the transport check can be triggered from CI / CLI without auth.
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const hasBearer = !!cronSecret && authHeader === `Bearer ${cronSecret}`;

  let userEmail: string | null = null;
  if (!hasBearer) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    userEmail = session.user.email ?? null;
  }

  const url = new URL(req.url);
  const to = url.searchParams.get("to") || userEmail;
  if (!to) return NextResponse.json({ error: "no recipient" }, { status: 400 });

  const usingZepto = !!process.env.ZEPTOMAIL_API_KEY;
  const transport = usingZepto ? "ZeptoMail HTTP API" : "SMTP fallback (nodemailer)";
  const sentAt = new Date().toISOString();

  const html = `
    <h1 style="color:#0F2744;">CFA Email Transport Test</h1>
    <p>Outbound email is working through <strong>${transport}</strong>.</p>
    <p style="color:#6B7280;font-size:13px;">Sent at ${sentAt}</p>
  `;

  if (usingZepto) {
    const result = await sendTransactionalEmail({
      from: FROM,
      replyTo: REPLY_TO,
      to,
      subject: "CFA email test (ZeptoMail)",
      html,
    });
    return NextResponse.json({
      transport,
      recipient: to,
      ok: result.ok,
      messageId: result.messageId,
      requestId: result.requestId,
      error: result.error,
      sentAt,
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.zoho.com",
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const info = await transporter.sendMail({
      from: FROM,
      replyTo: REPLY_TO,
      to,
      subject: "CFA email test (SMTP)",
      html,
    });
    return NextResponse.json({
      transport,
      recipient: to,
      ok: true,
      messageId: info.messageId,
      sentAt,
    });
  } catch (err) {
    return NextResponse.json({
      transport,
      recipient: to,
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
      sentAt,
    });
  }
});
