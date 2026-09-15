import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

/**
 * Checks for the things that fail silently.
 *
 * Everything here has already happened. The Google refresh token died some time
 * around May and nothing noticed until September, because the code caught the
 * error, wrote a console line and carried on saving meetings that had no link,
 * no calendar entry and no invitations. In the same period the weekly digest
 * was reaching 11% of its audience and the Nuru bot had never once been
 * dispatched. None of the three threw an error anybody saw.
 *
 * The rule this encodes: a credential that is only exercised by a user action
 * is a credential you find out about from the user. Exercise it on a schedule
 * instead.
 */

export interface Check {
  name: string;
  ok: boolean;
  /** What is true right now. */
  detail: string;
  /** What to do about it, only when it is not ok. */
  remedy?: string;
}

/** Mints an access token. The only honest test of a refresh token. */
async function checkGoogleCalendar(): Promise<Check> {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  const refresh = process.env.GOOGLE_REFRESH_TOKEN;

  if (!id || !secret || !refresh) {
    const missing = [
      !id && "GOOGLE_CLIENT_ID",
      !secret && "GOOGLE_CLIENT_SECRET",
      !refresh && "GOOGLE_REFRESH_TOKEN",
    ].filter(Boolean).join(", ");
    return {
      name: "Google Calendar",
      ok: false,
      detail: `Not configured in this environment. Missing: ${missing}.`,
      remedy: "Add the variables in Vercel and redeploy. Meetings cannot create a link or send invitations without them.",
    };
  }

  try {
    const client = new google.auth.OAuth2(id, secret);
    client.setCredentials({ refresh_token: refresh });
    await client.getAccessToken();
    const calendar = google.calendar({ version: "v3", auth: client });
    const cal = await calendar.calendars.get({ calendarId: "primary" });
    return {
      name: "Google Calendar",
      ok: true,
      detail: `Authorised against ${cal.data.id}.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const expired = message.includes("invalid_grant");
    return {
      name: "Google Calendar",
      ok: false,
      detail: expired
        ? "The refresh token has been rejected (invalid_grant). Meetings are creating no link and sending no invitations right now."
        : `Google rejected the request: ${message}`,
      remedy: expired
        ? "Re-mint with scripts/google-oauth-setup.ts and update GOOGLE_REFRESH_TOKEN locally and in Vercel. If the OAuth consent screen is still in Testing, publish it, or this recurs every seven days."
        : "Check the Google Cloud project and the Calendar API quota.",
    };
  }
}

/**
 * The symptom rather than the credential. A meeting saved without a join link
 * also invited nobody, so this catches a failure even if it is one the token
 * check cannot see.
 */
async function checkRecentMeetings(): Promise<Check> {
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const [recent, linkless] = await Promise.all([
    prisma.meeting.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.meeting.count({ where: { createdAt: { gte: weekAgo }, meetLink: null, status: { not: "CANCELLED" } } }),
  ]);
  if (recent === 0) {
    return { name: "Meetings", ok: true, detail: "No meetings created in the last seven days, so nothing to check." };
  }
  if (linkless === 0) {
    return { name: "Meetings", ok: true, detail: `${recent} created in the last seven days, all with a join link.` };
  }
  return {
    name: "Meetings",
    ok: false,
    detail: `${linkless} of ${recent} meetings created in the last seven days have no join link, which means nobody was invited to them.`,
    remedy: "Fix Google Calendar above, then re-book those meetings. The participants have not been told they exist.",
  };
}

/** Configured or not. A no-op dispatch is worth knowing about. */
async function checkNuruBot(): Promise<Check> {
  const url = process.env.BOT_SERVICE_URL;
  const secret = process.env.BOT_SECRET;
  if (!url || !secret) {
    return {
      name: "Nuru bot",
      ok: true, // not an outage, but it should not be mistaken for working
      detail: "Not configured, so no bot is dispatched to any meeting. Nuru is off rather than broken.",
    };
  }
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/health`, { signal: AbortSignal.timeout(8000) });
    return res.ok
      ? { name: "Nuru bot", ok: true, detail: "Bot service is responding." }
      : { name: "Nuru bot", ok: false, detail: `Bot service returned ${res.status}.`, remedy: "Check the Fly deployment." };
  } catch (err) {
    return {
      name: "Nuru bot",
      ok: false,
      detail: `Bot service unreachable: ${err instanceof Error ? err.message : String(err)}`,
      remedy: "Check the Fly deployment. Meetings still work; they just will not be transcribed.",
    };
  }
}

/** The digest cannot send at all without this, and it fails quietly. */
async function checkEmailTransport(): Promise<Check> {
  if (process.env.ZEPTOMAIL_API_KEY) {
    return { name: "Email", ok: true, detail: "ZeptoMail API key present." };
  }
  if (process.env.SMTP_USER) {
    return {
      name: "Email",
      ok: false,
      detail: "No ZeptoMail key, so sending falls back to Zoho SMTP.",
      remedy: "Set ZEPTOMAIL_API_KEY. Zoho SMTP throttles batches and will drop bulk sends.",
    };
  }
  return {
    name: "Email",
    ok: false,
    detail: "No email transport configured at all. Nothing can send.",
    remedy: "Set ZEPTOMAIL_API_KEY in Vercel.",
  };
}

export async function runCredentialChecks(): Promise<Check[]> {
  return Promise.all([
    checkGoogleCalendar(),
    checkRecentMeetings(),
    checkEmailTransport(),
    checkNuruBot(),
  ]);
}
