/**
 * ZeptoMail HTTP API client.
 *
 * Used as the primary transactional sender when ZEPTOMAIL_API_KEY is set.
 * Falls back to SMTP via nodemailer when not configured (see lib/email.ts).
 *
 * Docs: https://www.zoho.com/zeptomail/help/api/email-sending-api.html
 */

const ZEPTO_ENDPOINT = "https://api.zeptomail.com/v1.1/email";

export interface ZeptoMailRecipient {
  email: string;
  name?: string;
}

export interface ZeptoMailSendInput {
  from: ZeptoMailRecipient;
  to: ZeptoMailRecipient[];
  subject: string;
  htmlbody?: string;
  textbody?: string;
  replyTo?: ZeptoMailRecipient;
  /** Optional inline tracking tags - shows up in ZeptoMail logs */
  trackingTag?: string;
}

export interface ZeptoMailSendResult {
  ok: boolean;
  requestId?: string;
  messageId?: string;
  error?: string;
}

/**
 * Parse a "Display Name <email@addr>" string into a ZeptoMail recipient.
 * If no display name, returns just { email }.
 */
function parseAddress(input: string): ZeptoMailRecipient {
  const match = input.match(/^\s*([^<]+?)\s*<([^>]+)>\s*$/);
  if (match) {
    return { email: match[2].trim(), name: match[1].trim() };
  }
  return { email: input.trim() };
}

export async function sendViaZeptoMail(input: ZeptoMailSendInput): Promise<ZeptoMailSendResult> {
  const rawKey = process.env.ZEPTOMAIL_API_KEY;
  if (!rawKey) {
    return { ok: false, error: "ZEPTOMAIL_API_KEY not set" };
  }
  // Strip the "Zoho-enczapikey " or "Zoho-enczapikey" prefix if the user
  // pasted it from the ZeptoMail dashboard which sometimes shows the
  // full Authorization header value.
  const apiKey = rawKey.replace(/^Zoho-enczapikey\s*/i, "").trim();

  const body = {
    from: { address: input.from.email, name: input.from.name },
    to: input.to.map((r) => ({ email_address: { address: r.email, name: r.name } })),
    subject: input.subject,
    htmlbody: input.htmlbody,
    textbody: input.textbody,
    ...(input.replyTo && {
      reply_to: [{ address: input.replyTo.email, name: input.replyTo.name }],
    }),
    ...(input.trackingTag && { track_clicks: true, track_opens: true }),
  };

  try {
    const res = await fetch(ZEPTO_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Zoho-enczapikey ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => null)) as {
      data?: Array<{ message_id?: string }>;
      message?: string;
      request_id?: string;
      error?: { details?: Array<{ message?: string }>; message?: string };
    } | null;

    if (!res.ok) {
      const errMsg =
        data?.error?.details?.[0]?.message ??
        data?.error?.message ??
        data?.message ??
        `HTTP ${res.status}`;
      return { ok: false, error: errMsg, requestId: data?.request_id };
    }

    return {
      ok: true,
      requestId: data?.request_id,
      messageId: data?.data?.[0]?.message_id,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

/**
 * Translates a "from string" + plain to/subject/html into a ZeptoMail send.
 * Used by the lib/email.ts send() helper as a drop-in alternative to nodemailer.
 */
export async function sendTransactionalEmail({
  from,
  replyTo,
  to,
  subject,
  html,
  text,
}: {
  from: string;
  replyTo?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<ZeptoMailSendResult> {
  return sendViaZeptoMail({
    from: parseAddress(from),
    to: [parseAddress(to)],
    subject,
    htmlbody: html,
    textbody: text,
    replyTo: replyTo ? parseAddress(replyTo) : undefined,
  });
}
