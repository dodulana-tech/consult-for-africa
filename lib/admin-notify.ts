/**
 * Admin notification helper.
 *
 * Use throughout the platform to surface conversion events (real
 * salary report, hospital review, claim conversion, pilot stage
 * advance, placement, high-scoring talent application) into the
 * admin notification feed.
 *
 * Some notification types also fire an immediate email to admins
 * with role PARTNER or ADMIN. Configure with shouldEmail in the call.
 */

import { prisma } from "@/lib/prisma";
import type { AdminNotificationType, AdminNotificationSeverity } from "@prisma/client";

interface NotifyOptions {
  type: AdminNotificationType;
  severity?: AdminNotificationSeverity;
  title: string;
  body?: string;
  href?: string;
  metadata?: Record<string, unknown>;
  /**
   * If true, also send an immediate email to all PARTNER/ADMIN users.
   * Use for high-signal events: first ever real salary, first placement, etc.
   */
  emailAdmins?: boolean;
}

const HIGH_PRIORITY_TYPES: AdminNotificationType[] = [
  "FIRST_REAL_SALARY_REPORT",
  "PILOT_PLACED",
  "CADRE_PROFILE_VERIFIED",
];

export async function notifyAdmins(opts: NotifyOptions): Promise<void> {
  try {
    await prisma.adminNotification.create({
      data: {
        type: opts.type,
        severity: opts.severity ?? "INFO",
        title: opts.title,
        body: opts.body ?? null,
        href: opts.href ?? null,
        metadata: opts.metadata as never,
      },
    });

    const shouldEmail = opts.emailAdmins ?? HIGH_PRIORITY_TYPES.includes(opts.type);
    if (shouldEmail) {
      await emailAdminsIfConfigured(opts);
    }
  } catch (err) {
    // Don't let notification failures break the calling event handler
    console.error("[admin-notify] failed:", err);
  }
}

async function emailAdminsIfConfigured(opts: NotifyOptions) {
  if (!process.env.SMTP_USER && !process.env.ZEPTOMAIL_API_KEY) return;

  const admins = await prisma.user.findMany({
    where: { role: { in: ["PARTNER", "ADMIN"] } },
    select: { email: true, name: true },
  });
  if (admins.length === 0) return;

  // Lazy import to avoid coupling at module load
  const { sendOutboundEmail } = await import("@/lib/communications-send");
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://www.consultforafrica.com";
  const link = opts.href ? (opts.href.startsWith("http") ? opts.href : baseUrl + opts.href) : null;

  const emoji =
    opts.severity === "SUCCESS" ? "" :
    opts.severity === "CRITICAL" ? "" :
    opts.severity === "WARNING" ? "" : "";

  const text = `${opts.title}\n\n${opts.body ?? ""}\n\n${link ? `View: ${link}` : ""}`.trim();
  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:32px 20px;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1F2937;">
  <table width="100%" cellpadding="0" cellspacing="0" align="center" style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #E5EAF0;overflow:hidden;">
    <tr><td style="padding:24px;">
      <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.15em;color:#D4AF37;">Admin alert${emoji ? " " + emoji : ""}</p>
      <h1 style="margin:6px 0 8px;font-size:18px;color:#0B3C5D;">${escapeHtml(opts.title)}</h1>
      ${opts.body ? `<p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.6;">${escapeHtml(opts.body)}</p>` : ""}
      ${link ? `<a href="${link}" style="display:inline-block;margin-top:8px;background:#0B3C5D;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;">View on platform</a>` : ""}
    </td></tr>
    <tr><td style="padding:12px 24px;border-top:1px solid #F3F4F6;font-size:11px;color:#9CA3AF;">
      You're receiving this because you're a Partner or Admin on the CFA platform.
    </td></tr>
  </table>
</body></html>`;

  for (const admin of admins) {
    if (!admin.email) continue;
    try {
      await sendOutboundEmail({
        to: admin.email,
        subject: `[CFA Admin] ${opts.title}`,
        bodyText: text,
        bodyHtml: html,
      });
    } catch (err) {
      console.error("[admin-notify] email failed for", admin.email, err);
    }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
}
