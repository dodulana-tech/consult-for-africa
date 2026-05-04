/**
 * Send a test email through the lib/email send() helper.
 * Verifies the active transport (ZeptoMail HTTP API or SMTP fallback).
 *
 * Usage:
 *   ZEPTOMAIL_API_KEY=... npx tsx scripts/test-email.ts your@email.com
 *   (or set ZEPTOMAIL_API_KEY in .env.local and run without)
 */
import nodemailer from "nodemailer";
import { sendTransactionalEmail } from "@/lib/zeptomail";

const recipient = process.argv[2] || "dodulana@gmail.com";

async function main() {
  const usingZepto = !!process.env.ZEPTOMAIL_API_KEY;
  console.log(`Transport: ${usingZepto ? "ZeptoMail HTTP API" : "SMTP fallback"}`);
  console.log(`Recipient: ${recipient}`);

  const html = `
    <h1 style="color:#0F2744;">CFA Email Transport Test</h1>
    <p>If you got this, outbound email is working through <strong>${usingZepto ? "ZeptoMail HTTP API" : "SMTP fallback (nodemailer)"}</strong>.</p>
    <p>Sent at ${new Date().toISOString()}</p>
  `;

  if (usingZepto) {
    const result = await sendTransactionalEmail({
      from: process.env.SMTP_FROM ?? "Consult For Africa <hello@consultforafrica.com>",
      replyTo: process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com",
      to: recipient,
      subject: "CFA email test (ZeptoMail)",
      html,
    });
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exit(1);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Consult For Africa <hello@consultforafrica.com>",
    replyTo: process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com",
    to: recipient,
    subject: "CFA email test (SMTP)",
    html,
  });
  console.log("Message id:", info.messageId);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
