import crypto from "crypto";

/**
 * HMAC-signed POST from Vercel to the Nuru bot service running on Fly.
 * Mirror of bot/webhook.ts on the bot side.
 */

function sign(timestamp: string, body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export interface DispatchOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

async function postToBot(path: string, payload: unknown, opts: DispatchOptions = {}): Promise<unknown> {
  const baseUrl = process.env.BOT_SERVICE_URL;
  const secret = process.env.BOT_SECRET;

  if (!baseUrl || !secret) {
    console.warn("[nuru-dispatch] BOT_SERVICE_URL or BOT_SECRET not set - skipping");
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify(payload);
  const signature = sign(timestamp, body, secret);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 10_000);
  const signal = opts.signal ?? controller.signal;

  try {
    const url = `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : "/" + path}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bot-Timestamp": timestamp,
        "X-Bot-Signature": signature,
      },
      body,
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`bot ${path} returned ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json().catch(() => ({}));
  } finally {
    clearTimeout(timeout);
  }
}

/** Schedule the bot to join a meeting at a specific time. */
export async function dispatchScheduleJob(meetingId: string, meetLink: string, scheduledAt: Date): Promise<void> {
  await postToBot("/jobs/schedule", {
    meetingId,
    meetLink,
    scheduledAt: scheduledAt.toISOString(),
  }).catch((err) => {
    console.error("[nuru-dispatch] schedule failed:", err);
    // Don't throw - meeting creation should succeed even if bot is unavailable
  });
}

/** Cancel a scheduled or active bot session. */
export async function dispatchCancelJob(meetingId: string): Promise<void> {
  await postToBot("/jobs/cancel", { meetingId }).catch((err) => {
    console.error("[nuru-dispatch] cancel failed:", err);
  });
}

/** Verify HMAC signature on inbound webhook from the bot. */
export function verifyBotSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
): boolean {
  const secret = process.env.BOT_SECRET;
  if (!secret || !timestamp || !signature) return false;

  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp, 10));
  if (Number.isNaN(ageSec) || ageSec > 300) return false;

  const expected = sign(timestamp, rawBody, secret);
  if (expected.length !== signature.length) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}
