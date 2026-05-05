import crypto from "crypto";

/**
 * HMAC-signed POST to the Vercel platform.
 * Bot service uses this to call back to webhook endpoints with results.
 */

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} env var is required`);
  return v;
}

function sign(timestamp: string, body: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

export async function postToVercel(path: string, payload: unknown): Promise<unknown> {
  const baseUrl = requireEnv("VERCEL_WEBHOOK_URL").replace(/\/$/, "");
  const secret = requireEnv("BOT_SECRET");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify(payload);
  const signature = sign(timestamp, body, secret);

  const url = `${baseUrl}${path.startsWith("/") ? path : "/" + path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Bot-Timestamp": timestamp,
      "X-Bot-Signature": signature,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Vercel webhook ${path} returned ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json().catch(() => ({}));
}
