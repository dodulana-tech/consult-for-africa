import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { contactLimiter } from "@/lib/rate-limit-redis";
import { handler } from "@/lib/api-handler";

const contactSchema = z.object({
  organization: z.string().trim().min(1, "Organisation is required"),
  country: z.string().trim().nullable().optional(),
  role: z.string().trim().nullable().optional(),
  email: z.string().trim().email("Valid email is required"),
  projectType: z.string().trim().nullable().optional(),
  message: z.string().min(1, "Message is required").max(2000, "Message too long"),
});

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
  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = await contactLimiter.limit(ip);
  if (!success) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json();

  // Honeypot: if the hidden "website" field is filled, it's a bot
  if (body.website) {
    // Silently accept to not alert the bot, but do nothing
    return NextResponse.json({ success: true });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { organization, country, role, email, projectType, message } = parsed.data;

  // Spam heuristics
  const spamSignals: string[] = [];
  const allText = `${organization} ${role ?? ""} ${message} ${email}`.toLowerCase();

  // Gibberish detection: high consonant ratio in message (random keyboard mashing)
  const consonantRatio = (message.replace(/[^bcdfghjklmnpqrstvwxyz]/gi, "").length) / Math.max(message.length, 1);
  if (consonantRatio > 0.7 && message.length > 20) spamSignals.push("gibberish");

  // Known spam patterns
  if (/\b(casino|viagra|crypto|forex|seo service|web traffic|backlink|cbd|thc)\b/i.test(allText)) spamSignals.push("spam_keywords");

  // Email in role field (like the screenshot)
  if (role && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(role.trim())) spamSignals.push("email_in_role");

  // Disposable/suspicious email domains
  const emailDomain = email.split("@")[1]?.toLowerCase() ?? "";
  const suspiciousDomains = ["gmx.com", "mail.ru", "yandex.ru", "tempmail.com", "guerrillamail.com", "throwaway.email"];
  if (suspiciousDomains.includes(emailDomain)) spamSignals.push("suspicious_domain");

  // Message contains the site URL (SEO spam pattern)
  if (/consultforafrica\.com/i.test(message)) spamSignals.push("self_referencing");

  // Too many URLs in message
  const urlCount = (message.match(/https?:\/\//g) ?? []).length;
  if (urlCount > 2) spamSignals.push("too_many_urls");

  if (spamSignals.length >= 2) {
    // Silently accept to not alert the bot
    console.log(`[contact] SPAM blocked: ${email} signals=[${spamSignals.join(",")}]`);
    return NextResponse.json({ success: true });
  }

  const safeMessage = message;

  // Save to Lead table
  try {
    await prisma.lead.create({
      data: {
        source: "WEBSITE_CONTACT",
        status: "NEW",
        organizationName: String(organization).trim(),
        contactName: String(role ?? "Unknown").trim(),
        contactEmail: String(email).trim().toLowerCase(),
        contactRole: role ? String(role).trim() : null,
        country: country ? String(country).trim() : null,
        inboundMessage: safeMessage,
        inboundProjectType: projectType ? String(projectType).trim() : null,
      },
    });
  } catch (err) {
    console.error("[contact] lead creation failed", err);
    // Don't block form submission if lead creation fails
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#0F2744">New Enquiry: Consult For Africa</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Organisation</td><td style="padding:8px 0;font-size:14px;font-weight:600">${escHtml(organization)}</td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Country</td><td style="padding:8px 0;font-size:14px">${escHtml(country ?? "Not specified")}</td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Role</td><td style="padding:8px 0;font-size:14px">${escHtml(role ?? "Not specified")}</td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Email</td><td style="padding:8px 0;font-size:14px"><a href="mailto:${escHtml(email)}">${escHtml(email)}</a></td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Project Type</td><td style="padding:8px 0;font-size:14px">${escHtml(projectType ?? "Not specified")}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #e5eaf0;margin:16px 0">
      <h3 style="color:#0F2744;font-size:14px">Message</h3>
      <p style="font-size:14px;line-height:1.6;color:#374151">${escHtml(safeMessage).replace(/\n/g, "<br>")}</p>
    </div>
  `;

  const notifyTo = process.env.CONTACT_EMAIL ?? "hello@consultforafrica.com";

  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: "Consult For Africa <platform@consultforafrica.com>",
        to: notifyTo,
        replyTo: email,
        subject: `New enquiry from ${organization}`,
        html,
      });
    } catch (err) {
      console.error("[contact] email send failed", err);
    }
  } else {
    console.log("[contact] SMTP not configured, skipping email send");
  }

  return NextResponse.json({ success: true });
});
