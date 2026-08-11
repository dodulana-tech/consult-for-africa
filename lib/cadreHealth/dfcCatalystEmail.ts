/**
 * DFC Catalyst Series invitation + specialist-network introduction.
 *
 * Sent to the CONVERTED CadreHealth cohort (professionals who claimed their
 * profile). Two purposes in one email:
 *   1. Invite them to the inaugural DFC Catalyst Series hybrid scientific
 *      meeting (Sat 25 July 2026, Impact Hub Ikoyi + Zoom).
 *   2. Introduce Doctors Foundation for Care (dfcare.org) and invite them to
 *      join the specialist network for collaboration and knowledge sharing.
 *
 * Voice: peer-to-peer. Debo signs as President of DFC (see CFA senior-medic
 * copy rules). No em dashes. No recruiter framing.
 */
import { sendTransactionalEmail } from "@/lib/zeptomail";

const FROM =
  process.env.CADRE_SMTP_FROM ??
  process.env.SMTP_FROM ??
  "CadreHealth <hello@consultforafrica.com>";

// RSVPs and replies route to the DFC secretariat.
const RSVP_TO = process.env.DFC_RSVP_TO ?? "secretariat@dfcare.org";
const REPLY_TO = RSVP_TO;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://consultforafrica.com";
const DFC_URL = "https://www.dfcare.org";

// Zoom details for the hybrid session.
const ZOOM_URL = "https://us06web.zoom.us/j/81811566429?pwd=ZIrbE5AwiFo0UjbmQwaKih2828yGj7.1";
const ZOOM_MEETING_ID = "818 1156 6429";
const ZOOM_PASSCODE = "887911";
const RSVP_MAILTO =
  `mailto:${RSVP_TO}?subject=${encodeURIComponent("DFC Catalyst Series RSVP")}` +
  `&body=${encodeURIComponent(
    "Hi,\n\nI would like to attend the DFC Catalyst Series on Saturday 25 July.\n\n" +
      "Attending: (in person at Impact Hub Ikoyi / online via Zoom)\nName:\n\nThank you.",
  )}`;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface Recipient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  cadre: string;
}

/**
 * Physicians and dentists get "Dr {surname}". Every other cadre gets their
 * first name, so nurses, pharmacists, and allied professionals are never
 * mistitled as doctors.
 */
function salutation(r: Recipient): string {
  const surname = r.lastName?.trim();
  const first = r.firstName?.trim();
  if ((r.cadre === "MEDICINE" || r.cadre === "DENTISTRY") && surname) {
    return `Dr ${esc(surname)}`;
  }
  if (first) return esc(first);
  if (surname) return esc(surname);
  return "Colleague";
}

const bullet = (html: string) =>
  `<tr><td style="padding:6px 0;font-size:15px;color:#374151;line-height:1.55;">` +
  `<span style="color:#0B3C5D;font-weight:700;">&middot;</span>&nbsp; ${html}</td></tr>`;

function buildHTML(r: Recipient): string {
  const unsubscribeUrl = `${BASE_URL}/oncadre/unsubscribe/${r.id}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>The DFC Catalyst Series, this Saturday</title>
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:#0B3C5D;padding:32px 40px;">
              <span style="font-size:24px;font-weight:700;color:#FFFFFF;">Cadre</span><span style="font-size:24px;font-weight:700;color:#D4AF37;">Health</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#111827;">
                Dear ${salutation(r)},
              </p>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#111827;">
                You claimed your place in the CadreHealth network, and I am glad to have you among the colleagues we are building this with. I am writing to you in another capacity too, as President of <strong>Doctors Foundation for Care</strong> (DFC), with two things I think are worth your time.
              </p>

              <p style="margin:24px 0 8px;font-size:17px;font-weight:700;color:#0B3C5D;">1. The DFC Catalyst Series, this Saturday</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
                DFC is launching the Catalyst Series, a quarterly hybrid scientific meeting for practising healthcare professionals. The first session runs this Saturday, and you are welcome to join in person in Lagos or online.
              </p>
              <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#111827;">Three sessions, across the clinical and the business side of practice:</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                ${bullet(`<strong>Dr Hammed Ninalowo</strong> on Vascular Pathologies in Nigeria. The realities of vascular disease here, and how to navigate them in practice.`)}
                ${bullet(`<strong>Eniola Adeyemo</strong> of Leadway Health HMO on Professional Indemnity Insurance. Why the right cover matters, and how it protects your practice.`)}
                ${bullet(`<strong>Kehinde Olawale</strong> of Medbooks by Ploutos Page: "You trust your diagnosis. Do you trust your numbers?" The financial principles behind a sustainable practice.`)}
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#F3F6F9;border-radius:10px;">
                <tr><td style="padding:18px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${bullet(`<strong>Saturday, 25 July 2026</strong>`)}
                    ${bullet(`3:00 PM prompt (West Africa Time)`)}
                    ${bullet(`In person: Impact Hub, 22 Glover Road, Ikoyi, Lagos`)}
                    ${bullet(`Online: Zoom, join details below`)}
                  </table>
                </td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#0B3C5D;border-radius:10px;">
                <tr><td style="padding:20px 22px;">
                  <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#FFFFFF;">Joining online</p>
                  <table cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
                    <tr>
                      <td style="background:#D4AF37;border-radius:8px;">
                        <a href="${ZOOM_URL}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#0B3C5D;text-decoration:none;">
                          Join on Zoom
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#C7D3DE;">
                    Meeting ID: <strong style="color:#FFFFFF;">${ZOOM_MEETING_ID}</strong><br>
                    Passcode: <strong style="color:#FFFFFF;">${ZOOM_PASSCODE}</strong>
                  </p>
                </td></tr>
              </table>

              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#0B3C5D;border-radius:8px;">
                    <a href="${RSVP_MAILTO}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                      Confirm your place
                    </a>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="border-top:1px solid #E5E7EB;padding-top:24px;"></td></tr>
              </table>

              <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#0B3C5D;">2. A place in the DFC specialist network</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
                Second, an open invitation. Doctors Foundation for Care brings practising specialists together for collaboration, case discussion, and shared learning, all pointed at raising the standard of healthcare in Nigeria. If that is work you want to be part of, there is a place for you in it.
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
                Whether you are practising in Lagos, elsewhere in Nigeria, or from the diaspora, your experience adds to what this network can do.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#D4AF37;border-radius:8px;">
                    <a href="${DFC_URL}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#0B3C5D;text-decoration:none;">
                      Explore Doctors Foundation for Care
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#111827;">
                With respect,
              </p>
              <p style="margin:0 0 2px;font-size:15px;line-height:1.5;color:#111827;font-weight:600;">
                Dr Debo Odulana
              </p>
              <p style="margin:0 0 2px;font-size:14px;line-height:1.5;color:#6B7280;">
                President, Doctors Foundation for Care
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#6B7280;">
                Founding Partner, Consult For Africa
              </p>

              <p style="margin:0 0 8px;font-size:13px;color:#9CA3AF;line-height:1.5;">
                If a button does not work, these links open the same pages:
              </p>
              <p style="margin:0 0 4px;font-size:12px;color:#6B7280;word-break:break-all;">
                Zoom: ${ZOOM_URL}
              </p>
              <p style="margin:0 0 4px;font-size:12px;color:#6B7280;word-break:break-all;">
                RSVP: ${esc(RSVP_TO)} &nbsp;|&nbsp; Foundation: ${DFC_URL}
              </p>

              <p style="margin:20px 0 0;font-size:13px;color:#9CA3AF;line-height:1.5;">
                You are receiving this as a member of the CadreHealth network. You can
                <a href="${unsubscribeUrl}" style="color:#6B7280;text-decoration:underline;">unsubscribe here</a>.
              </p>
            </td>
          </tr>
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

/** Render the email HTML for a recipient. Exposed for local preview. */
export function renderDfcCatalystHTML(r: Recipient): string {
  return buildHTML(r);
}

export interface CatalystEmailResult {
  ok: boolean;
  error?: string;
}

export async function sendDfcCatalystEmail(r: Recipient): Promise<CatalystEmailResult> {
  const subject = "The DFC Catalyst Series this Saturday, and an invitation to join us";
  const html = buildHTML(r);

  // ZeptoMail only. We deliberately do NOT fall back to Zoho SMTP: it throttles
  // bulk sends ("550 Unusual sending activity") and is not for batch outreach.
  if (!process.env.ZEPTOMAIL_API_KEY) {
    return {
      ok: false,
      error: "ZEPTOMAIL_API_KEY not set. Refusing to send: this campaign is ZeptoMail-only (no Zoho SMTP fallback).",
    };
  }
  const result = await sendTransactionalEmail({ from: FROM, to: r.email, subject, html, replyTo: REPLY_TO });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}
