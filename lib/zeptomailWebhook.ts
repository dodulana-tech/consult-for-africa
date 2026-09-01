/**
 * Parsing for ZeptoMail delivery webhooks.
 *
 * Kept out of the route file because Next.js App Router only permits the
 * HTTP-verb exports there, and this logic is the part worth unit testing.
 *
 * ZeptoMail sends the event type at the top level as an ARRAY of strings,
 * and the recipients nested inside each entry of event_message:
 *
 *   {
 *     "event_name": ["hardbounce"],
 *     "event_message": [{
 *       "email_info": {
 *         "to": [{ "email_address": { "address": "x@y.com", "name": "X" } }],
 *         "subject": "...", "client_reference": "..."
 *       }
 *     }]
 *   }
 */

export type SuppressionReason = "BOUNCED" | "COMPLAINT" | "OPTED_OUT";

export interface ParsedEvent {
  email: string;
  eventName: string;
}

/**
 * Map a ZeptoMail event name to a suppression reason, or null to ignore it.
 * Soft bounces are deliberately not suppressed -- a full mailbox or a
 * temporary DNS failure is not a dead address.
 */
export function reasonFromEvent(eventName: string): SuppressionReason | null {
  const e = eventName.toLowerCase().replace(/[\s-]/g, "_");
  if (e.includes("bounce")) {
    return e.includes("soft") ? null : "BOUNCED";
  }
  // "feedback loop" is ZeptoMail's name for a spam complaint.
  if (e.includes("feedback") || e.includes("spam") || e.includes("complaint")) {
    return "COMPLAINT";
  }
  if (e.includes("unsubscribe") || e.includes("opt_out") || e.includes("optout")) {
    return "OPTED_OUT";
  }
  // delivered, email opens, email clicks: acknowledged and ignored.
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** First non-empty string among the candidates, unwrapping single-level arrays. */
function firstString(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
    if (Array.isArray(c)) {
      const nested = c.find((v) => typeof v === "string" && v.trim());
      if (typeof nested === "string") return nested.trim();
    }
  }
  return null;
}

function normaliseEmail(value: unknown): string | null {
  return typeof value === "string" && value.includes("@")
    ? value.toLowerCase().trim()
    : null;
}

/**
 * Recipients of one event_message entry: email_info.to[].email_address.address
 *
 * Only `to` is read. cc/bcc are on the message but a bounce does not tell us
 * which of them failed, and our senders address one recipient at a time.
 */
function recipientsOf(message: Record<string, unknown>): string[] {
  const info = asRecord(message.email_info);
  const to = info && Array.isArray(info.to) ? info.to : [];
  const out: string[] = [];

  for (const entry of to) {
    const rec = asRecord(entry);
    if (!rec) {
      const bare = normaliseEmail(entry);
      if (bare) out.push(bare);
      continue;
    }
    const addr = asRecord(rec.email_address);
    const email =
      normaliseEmail(addr?.address) ??
      normaliseEmail(rec.email_address) ??
      normaliseEmail(rec.address) ??
      normaliseEmail(rec.email);
    if (email) out.push(email);
  }
  return out;
}

/** Flat fallback, for hand-rolled test payloads and older shapes. */
function parseFlat(
  root: Record<string, unknown>,
  eventName: string | null,
): ParsedEvent[] {
  const email =
    normaliseEmail(root.email) ??
    normaliseEmail(root.email_address) ??
    normaliseEmail(root.recipient) ??
    normaliseEmail(root.mail_to) ??
    normaliseEmail(root.to);
  return email && eventName ? [{ email, eventName }] : [];
}

export function parseEvents(payload: unknown): ParsedEvent[] {
  if (Array.isArray(payload)) return payload.flatMap(parseEvents);

  const root = asRecord(payload);
  if (!root) return [];

  const topEventName = firstString(
    root.event_name,
    root.event,
    root.type,
    root.notification_type,
    root.bounce_type,
  );

  const messages = Array.isArray(root.event_message)
    ? root.event_message
    : Array.isArray(root.notifications)
      ? root.notifications
      : Array.isArray(root.event_data)
        ? root.event_data
        : [];

  const parsed: ParsedEvent[] = [];
  for (const entry of messages) {
    const message = asRecord(entry);
    if (!message) continue;
    const eventName = firstString(message.event_name, message.type) ?? topEventName;
    if (!eventName) continue;
    const recipients = recipientsOf(message);
    if (recipients.length) {
      for (const email of recipients) parsed.push({ email, eventName });
    } else {
      // A nested entry may itself be flat rather than an email_info envelope.
      parsed.push(...parseFlat(message, eventName));
    }
  }

  return parsed.length ? parsed : parseFlat(root, topEventName);
}
