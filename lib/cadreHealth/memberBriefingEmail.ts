import { sendTransactionalEmail } from "@/lib/zeptomail";

/**
 * The member briefing: a short signed note to CadreHealth members carrying several
 * items, rather than the single-CTA transactional shape of lib/cadreEmail.ts.
 *
 * Bulk sends go over the ZeptoMail HTTP API only. Zoho mailbox SMTP throttles batches
 * with "550 Unusual sending activity" and we lost a 396-recipient run to it in July.
 * This module refuses to send without ZEPTOMAIL_API_KEY rather than falling back.
 */

const FROM =
  process.env.CADRE_SMTP_FROM ??
  process.env.SMTP_FROM ??
  "CadreHealth <platform@consultforafrica.com>";

const NAVY = "#0B3C5D";
const GOLD = "#D4AF37";
const INK = "#1F2933";
const MUTED = "#6B7280";
const LINE = "#E8EBF0";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface BriefingItem {
  /** Small gold label above the heading, e.g. "THE ONE THING WE ARE ASKING FOR" */
  kicker: string;
  heading: string;
  /** Paragraphs. Already-trusted copy: inline <b> and <i> are allowed, nothing else. */
  body: string[];
  ctaText?: string;
  ctaHref?: string;
  /** true renders the filled gold button, false a plain underlined link */
  primary?: boolean;
}

export interface Briefing {
  subject: string;
  preheader: string;
  salutation: string;
  opening: string[];
  items: BriefingItem[];
  closing: string[];
  signOff: string;
  signature: string;
  signatureRole: string;
  footer: string;
}

function itemBlock(item: BriefingItem, last: boolean): string {
  const cta = item.ctaText && item.ctaHref
    ? item.primary
      ? `<tr><td style="padding:14px 0 2px;">
           <a href="${esc(item.ctaHref)}" style="display:inline-block;padding:13px 30px;background:${GOLD};color:#06090f;font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;">${esc(item.ctaText)}</a>
         </td></tr>`
      : `<tr><td style="padding:10px 0 2px;">
           <a href="${esc(item.ctaHref)}" style="color:${NAVY};font-weight:700;font-size:14px;text-decoration:underline;">${esc(item.ctaText)}</a>
         </td></tr>`
    : "";
  return `
  <tr><td style="padding:${last ? "22px 0 4px" : "22px 0"};${last ? "" : `border-bottom:1px solid ${LINE};`}">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td style="padding:0 0 4px;">
        <span style="color:${GOLD};font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">${esc(item.kicker)}</span>
      </td></tr>
      <tr><td style="padding:0 0 8px;">
        <span style="color:${NAVY};font-size:18px;font-weight:700;line-height:1.3;">${esc(item.heading)}</span>
      </td></tr>
      ${item.body.map((p) => `<tr><td style="padding:0 0 10px;color:${INK};font-size:15px;line-height:1.62;">${p}</td></tr>`).join("")}
      ${cta}
    </table>
  </td></tr>`;
}

export function renderBriefing(b: Briefing): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(b.subject)}</title></head>
<body style="margin:0;padding:0;background:#F4F6F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(b.preheader)}</div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#fff;border-radius:12px;border:1px solid ${LINE};overflow:hidden;">

        <tr><td style="background:${NAVY};padding:20px 32px;border-bottom:3px solid ${GOLD};">
          <span style="color:#fff;font-weight:700;font-size:18px;">Cadre</span><span style="color:${GOLD};font-weight:700;font-size:18px;">Health</span>
          <span style="color:#9FB6C6;font-size:12px;float:right;padding-top:5px;">Member briefing</span>
        </td></tr>

        <tr><td style="padding:28px 32px 0;">
          <p style="margin:0 0 14px;color:${INK};font-size:16px;line-height:1.62;">${esc(b.salutation)}</p>
          ${b.opening.map((p) => `<p style="margin:0 0 12px;color:${INK};font-size:15px;line-height:1.62;">${p}</p>`).join("")}
        </td></tr>

        <tr><td style="padding:4px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${b.items.map((it, i) => itemBlock(it, i === b.items.length - 1)).join("")}
          </table>
        </td></tr>

        <tr><td style="padding:22px 32px 8px;border-top:1px solid ${LINE};">
          ${b.closing.map((p) => `<p style="margin:0 0 12px;color:${INK};font-size:15px;line-height:1.62;">${p}</p>`).join("")}
          <p style="margin:16px 0 2px;color:${INK};font-size:15px;">${esc(b.signOff)}</p>
          <p style="margin:0;color:${NAVY};font-size:15px;font-weight:700;">${esc(b.signature)}</p>
          <p style="margin:0 0 8px;color:${MUTED};font-size:13px;">${esc(b.signatureRole)}</p>
        </td></tr>

        <tr><td style="padding:14px 32px 18px;background:#F8F9FB;border-top:1px solid ${LINE};">
          <p style="margin:0;color:#9CA3AF;font-size:11.5px;line-height:1.55;">${b.footer}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendBriefing(to: string, b: Briefing) {
  if (!process.env.ZEPTOMAIL_API_KEY) {
    throw new Error(
      "ZEPTOMAIL_API_KEY is not set. Member briefings are a bulk send and must go over " +
        "the ZeptoMail HTTP API. Zoho SMTP throttles batches and is not a fallback."
    );
  }
  const result = await sendTransactionalEmail({
    from: FROM,
    to,
    subject: b.subject,
    html: renderBriefing(b),
  });
  if (!result.ok) throw new Error(`ZeptoMail: ${result.error}`);
  return result;
}
