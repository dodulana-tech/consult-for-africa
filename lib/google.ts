import { google, calendar_v3 } from "googleapis";

// ─── Google OAuth2 Auth ─────────────────────────────────────────────────────
// Uses OAuth2 with a refresh token to access Google Calendar.

function getAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Google OAuth2 credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN."
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

function getCalendar() {
  return google.calendar({ version: "v3", auth: getAuth() });
}

// ─── Create Meeting with Google Meet ────────────────────────────────────────

interface CreateMeetingParams {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendeeEmails: string[];
  organizerEmail?: string;
}

interface MeetingResult {
  calendarEventId: string;
  meetLink: string;
  htmlLink: string;
}

export async function createGoogleMeetMeeting(
  params: CreateMeetingParams
): Promise<MeetingResult> {
  const calendar = getCalendar();

  const event: calendar_v3.Schema$Event = {
    summary: params.title,
    description: params.description ?? "",
    start: {
      dateTime: params.startTime.toISOString(),
      timeZone: "Africa/Lagos",
    },
    end: {
      dateTime: params.endTime.toISOString(),
      timeZone: "Africa/Lagos",
    },
    attendees: params.attendeeEmails.map((email) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: `cfa-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 30 },
        { method: "popup", minutes: 10 },
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
    conferenceDataVersion: 1,
    sendUpdates: "all", // sends invite emails via Google
  });

  const meetLink =
    response.data.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === "video"
    )?.uri ?? "";

  return {
    calendarEventId: response.data.id ?? "",
    meetLink,
    htmlLink: response.data.htmlLink ?? "",
  };
}

// ─── Update Meeting ─────────────────────────────────────────────────────────

interface UpdateMeetingParams {
  calendarEventId: string;
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  attendeeEmails?: string[];
}

export async function updateGoogleMeetMeeting(
  params: UpdateMeetingParams
): Promise<void> {
  const calendar = getCalendar();

  const patch: calendar_v3.Schema$Event = {};
  if (params.title) patch.summary = params.title;
  if (params.description) patch.description = params.description;
  if (params.startTime) {
    patch.start = {
      dateTime: params.startTime.toISOString(),
      timeZone: "Africa/Lagos",
    };
  }
  if (params.endTime) {
    patch.end = {
      dateTime: params.endTime.toISOString(),
      timeZone: "Africa/Lagos",
    };
  }
  if (params.attendeeEmails) {
    patch.attendees = params.attendeeEmails.map((email) => ({ email }));
  }

  await calendar.events.patch({
    calendarId: "primary",
    eventId: params.calendarEventId,
    requestBody: patch,
    sendUpdates: "all",
  });
}

// ─── Cancel Meeting ─────────────────────────────────────────────────────────

export async function cancelGoogleMeetMeeting(
  calendarEventId: string
): Promise<void> {
  const calendar = getCalendar();

  await calendar.events.delete({
    calendarId: "primary",
    eventId: calendarEventId,
    sendUpdates: "all",
  });
}
