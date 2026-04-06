import crypto from "crypto";

// ─── CadreHealth: WhatsApp Cloud API Client ───

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

function getConfig() {
  const token = process.env.CADRE_WHATSAPP_TOKEN;
  const phoneId = process.env.CADRE_WHATSAPP_PHONE_ID;
  if (!token || !phoneId) {
    throw new Error("Missing CADRE_WHATSAPP_TOKEN or CADRE_WHATSAPP_PHONE_ID");
  }
  return { token, phoneId };
}

/**
 * Normalize a phone number to international format: 234XXXXXXXXXX
 * Handles: +234..., 0803..., 234..., 08..., etc.
 */
export function normalizePhoneNumber(phone: string): string {
  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // Remove leading + if it was stripped
  // If starts with 234 and is 13 digits, it's already international
  if (digits.startsWith("234") && digits.length >= 13) {
    return digits;
  }

  // Nigerian local format: 0803... -> 234803...
  if (digits.startsWith("0") && digits.length === 11) {
    return "234" + digits.slice(1);
  }

  // Already 10 digits without leading 0 (e.g. 8031234567)
  if (digits.length === 10 && !digits.startsWith("234")) {
    return "234" + digits;
  }

  // If it already starts with country code
  if (digits.startsWith("234")) {
    return digits;
  }

  // Fallback: return as-is (could be non-Nigerian number)
  return digits;
}

/**
 * Verify Meta webhook signature (X-Hub-Signature-256 header).
 * Body should be the raw request body string.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const secret = process.env.CADRE_WHATSAPP_APP_SECRET;
  if (!secret) {
    console.error("Missing CADRE_WHATSAPP_APP_SECRET");
    return false;
  }

  const expectedSig =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(body).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  );
}

/**
 * Send a text message via WhatsApp Cloud API.
 * Returns the Meta message ID on success, null on failure.
 */
export async function sendWhatsAppText(
  to: string,
  text: string
): Promise<string | null> {
  const { token, phoneId } = getConfig();
  const normalizedTo = normalizePhoneNumber(to);

  try {
    const res = await fetch(`${GRAPH_API_BASE}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizedTo,
        type: "text",
        text: { body: text },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`WhatsApp send failed (${res.status}):`, err);
      return null;
    }

    const data = await res.json();
    return data.messages?.[0]?.id ?? null;
  } catch (err) {
    console.error("WhatsApp send error:", err);
    return null;
  }
}

/**
 * Send a template message via WhatsApp Cloud API.
 * Template must be pre-approved in Meta Business Manager.
 * Returns the Meta message ID on success, null on failure.
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  params: string[]
): Promise<string | null> {
  const { token, phoneId } = getConfig();
  const normalizedTo = normalizePhoneNumber(to);

  const components =
    params.length > 0
      ? [
          {
            type: "body",
            parameters: params.map((p) => ({
              type: "text",
              text: p,
            })),
          },
        ]
      : [];

  try {
    const res = await fetch(`${GRAPH_API_BASE}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizedTo,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`WhatsApp template send failed (${res.status}):`, err);
      return null;
    }

    const data = await res.json();
    return data.messages?.[0]?.id ?? null;
  } catch (err) {
    console.error("WhatsApp template send error:", err);
    return null;
  }
}
