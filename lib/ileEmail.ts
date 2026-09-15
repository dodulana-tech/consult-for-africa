import { notifyInternal } from "@/lib/email";
import {
  ILE_BRAND,
  ILE_CONTACT_EMAIL,
  CARE_NEED_LABELS,
  INTEREST_LABELS,
  RELATIONSHIP_LABELS,
  URGENCY_LABELS,
} from "@/lib/ile";

/**
 * ilé email. Its own letterhead rather than the Consult for Africa shell,
 * because the family joining this list is a client of ilé and has no reason to
 * have heard of anybody else.
 *
 * Transport is the shared one in lib/email.ts, so this inherits the
 * ZeptoMail-first path, the retry behaviour and SMTP_FROM as sender of record.
 */

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ileLayout(content: string, preheader: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ilé</title></head>
<body style="margin:0;padding:0;background:#F6F3EA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;border:1px solid #E4DFD0;overflow:hidden;">
        <tr><td style="background:${ILE_BRAND.ink};padding:26px 32px;">
          <div style="color:#ffffff;font-weight:700;font-size:26px;line-height:1;">il&eacute;</div>
          <div style="color:${ILE_BRAND.amber};font-weight:700;font-size:9px;letter-spacing:0.14em;margin-top:7px;">CARE FOR OUR PARENTS</div>
        </td></tr>
        <tr><td style="height:3px;background:${ILE_BRAND.amber};"></td></tr>
        <tr><td style="padding:32px;color:${ILE_BRAND.ink};font-size:15px;line-height:1.65;">${content}</td></tr>
        <tr><td style="padding:18px 32px;background:#FBF9F3;border-top:1px solid #E4DFD0;color:${ILE_BRAND.muted};font-size:11px;line-height:1.6;">
          il&eacute; &middot; Lagos, Nigeria &middot; <a href="mailto:${ILE_CONTACT_EMAIL}" style="color:${ILE_BRAND.green};text-decoration:none;">${ILE_CONTACT_EMAIL}</a><br>
          You are receiving this because you asked to join the il&eacute; waiting list. Reply to this email at any time and we will remove your details.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export interface IleWaitlistConfirmationInput {
  to: string;
  fullName: string;
  foundingFamily: boolean;
  interest: keyof typeof INTEREST_LABELS;
  urgency: keyof typeof URGENCY_LABELS;
  referralCode: string;
  shareUrl: string;
}

/**
 * The confirmation a family gets within seconds of joining. It has one job
 * beyond politeness: tell them honestly what is available now and what is still
 * being built, so nobody is waiting on a home that has not opened.
 */
export async function emailIleWaitlistConfirmation(
  input: IleWaitlistConfirmationInput,
): Promise<void> {
  const firstName = input.fullName.trim().split(/\s+/)[0] || "there";
  const urgent = input.urgency === "NOW" || input.urgency === "WITHIN_3_MONTHS";

  const founding = input.foundingFamily
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;background:${ILE_BRAND.groundWarm};border-left:4px solid ${ILE_BRAND.amber};border-radius:6px;">
         <tr><td style="padding:16px 18px;">
           <div style="font-weight:700;color:${ILE_BRAND.ink};font-size:14px;">You are a founding family</div>
           <div style="font-size:14px;color:${ILE_BRAND.ink};margin-top:6px;line-height:1.6;">
             You joined early, so you keep founding-family standing: first call when places open, a free first assessment, and the founding rate held for you when you start.
           </div>
         </td></tr>
       </table>`
    : "";

  const next = urgent
    ? `<p style="margin:0 0 16px;">You told us this is needed soon, so we will call you first. Someone from il&eacute; will be in touch within two working days to understand what is happening and talk through care at home while the residence is being built.</p>`
    : `<p style="margin:0 0 16px;">We will be in touch to understand what your family needs, and we will write to you as the residence takes shape. Nothing is urgent from your side.</p>`;

  const content = `
    <p style="margin:0 0 16px;">Dear ${esc(firstName)},</p>
    <p style="margin:0 0 16px;">Thank you. You are on the il&eacute; list, and we are glad you found us.</p>
    ${founding}
    <p style="margin:0 0 10px;font-weight:700;color:${ILE_BRAND.ink};">Where things stand, plainly</p>
    <p style="margin:0 0 16px;">We are building a residential home in Lagos for older people who need real care, run to a clinical standard and staffed by people who are trained, supervised and paid properly. It is not open yet, and we will not open it until it is registered and inspected. That is the whole point of doing this properly.</p>
    <p style="margin:0 0 16px;">In the meantime we provide care in your family's own home: nursing visits, personal care, help after a hospital stay, and company for someone who is mostly alone. If that is what you need now, we can usually start sooner than you would expect.</p>
    ${next}
    <p style="margin:0 0 10px;font-weight:700;color:${ILE_BRAND.ink};">If you know another family in this position</p>
    <p style="margin:0 0 8px;">Most people carrying this find it lonely and find it late. Sending this to one person who needs it is the kindest thing you can do with it.</p>
    <p style="margin:0 0 6px;"><a href="${esc(input.shareUrl)}" style="color:${ILE_BRAND.green};text-decoration:none;font-weight:600;">${esc(input.shareUrl)}</a></p>
    <p style="margin:0 0 22px;font-size:13px;color:${ILE_BRAND.muted};">Your code is <strong style="color:${ILE_BRAND.ink};letter-spacing:0.08em;">${esc(input.referralCode)}</strong>.</p>
    <p style="margin:0 0 6px;">Warm regards,</p>
    <p style="margin:0 0 2px;font-weight:700;color:${ILE_BRAND.ink};">The il&eacute; team</p>
    <p style="margin:0;font-size:13px;color:${ILE_BRAND.muted};">Lagos</p>
  `;

  await notifyInternal(
    input.to,
    "You are on the ilé list",
    ileLayout(content, "You are on the ilé list. Here is where things stand, and what we can do now."),
  );
}

export interface IleWaitlistInternalInput {
  to: string | string[];
  fullName: string;
  email: string;
  phone: string | null;
  relationship: keyof typeof RELATIONSHIP_LABELS;
  basedOutsideNigeria: boolean;
  basedCountry: string | null;
  careCity: string | null;
  interest: keyof typeof INTEREST_LABELS;
  careNeeds: (keyof typeof CARE_NEED_LABELS)[];
  urgency: keyof typeof URGENCY_LABELS;
  notes: string | null;
  foundingFamily: boolean;
  referredByCode: string | null;
  position: number;
}

/**
 * The internal ping. Written so the signal is readable on a phone without
 * opening the admin list: who, where, how urgent, and whether they are waiting
 * for a bed or a visit.
 */
export async function emailIleWaitlistInternal(
  input: IleWaitlistInternalInput,
): Promise<void> {
  const urgent = input.urgency === "NOW" || input.urgency === "WITHIN_3_MONTHS";
  const segment = input.basedOutsideNigeria ? "DIASPORA" : "LOCAL";
  const flag = urgent ? " [urgent]" : "";

  const row = (label: string, value: string) =>
    `<tr>
       <td style="padding:6px 12px 6px 0;color:#6B7280;font-size:12px;white-space:nowrap;vertical-align:top;">${esc(label)}</td>
       <td style="padding:6px 0;color:#111827;font-size:13px;vertical-align:top;">${value}</td>
     </tr>`;

  const needs = input.careNeeds.length
    ? input.careNeeds.map((n) => esc(CARE_NEED_LABELS[n])).join("<br>")
    : "<em style='color:#9CA3AF;'>none given</em>";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111827;">
      <p style="margin:0 0 4px;font-size:13px;color:#6B7280;">ilé waiting list, entry #${input.position}</p>
      <h2 style="margin:0 0 14px;font-size:19px;color:${ILE_BRAND.ink};">
        ${esc(input.fullName)}
        <span style="font-size:12px;font-weight:600;color:${input.basedOutsideNigeria ? ILE_BRAND.green : ILE_BRAND.muted};">&nbsp;${segment}</span>
        ${urgent ? `<span style="font-size:12px;font-weight:700;color:#B45309;">&nbsp;URGENT</span>` : ""}
      </h2>
      <table cellpadding="0" cellspacing="0">
        ${row("Email", `<a href="mailto:${esc(input.email)}" style="color:${ILE_BRAND.green};">${esc(input.email)}</a>`)}
        ${input.phone ? row("Phone", `<a href="tel:${esc(input.phone)}" style="color:${ILE_BRAND.green};">${esc(input.phone)}</a>`) : ""}
        ${row("Care is for", esc(RELATIONSHIP_LABELS[input.relationship]))}
        ${row("Based", input.basedOutsideNigeria ? esc(input.basedCountry ?? "outside Nigeria") : "In Nigeria")}
        ${row("Care needed in", esc(input.careCity ?? "not given"))}
        ${row("Wants", `<strong>${esc(INTEREST_LABELS[input.interest])}</strong>`)}
        ${row("Care need", needs)}
        ${row("Timing", `<strong>${esc(URGENCY_LABELS[input.urgency])}</strong>`)}
        ${row("Founding family", input.foundingFamily ? "Yes" : "No")}
        ${input.referredByCode ? row("Referred by", esc(input.referredByCode)) : ""}
      </table>
      ${
        input.notes
          ? `<div style="margin-top:16px;padding:12px 14px;background:#FBF9F3;border-left:3px solid ${ILE_BRAND.amber};border-radius:4px;">
               <div style="font-size:11px;color:#6B7280;margin-bottom:4px;">In their words</div>
               <div style="font-size:13px;line-height:1.6;white-space:pre-wrap;">${esc(input.notes)}</div>
             </div>`
          : ""
      }
    </div>
  `;

  await notifyInternal(
    input.to,
    `ilé waiting list: ${input.fullName}, ${segment.toLowerCase()}${flag}`,
    html,
  );
}
