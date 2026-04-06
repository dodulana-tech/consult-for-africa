/**
 * CadreHealth SMS Client (Termii)
 *
 * Sends SMS messages via the Termii API for outreach fallback.
 */

const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID ?? "CadreHlth";
const TERMII_ENDPOINT = "https://api.ng.termii.com/api/sms/send";

/** Normalize phone to international format without + (e.g. 2348034531236) */
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+234")) return cleaned.slice(1);
  if (cleaned.startsWith("234")) return cleaned;
  if (cleaned.startsWith("0")) return "234" + cleaned.slice(1);
  return cleaned;
}

export async function sendSMS(to: string, message: string): Promise<boolean> {
  if (!TERMII_API_KEY) {
    console.log(`[sms] TERMII_API_KEY not set. Would send to ${to}: ${message}`);
    return false;
  }

  const normalizedPhone = normalizePhone(to);

  try {
    const res = await fetch(TERMII_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: normalizedPhone,
        from: TERMII_SENDER_ID,
        sms: message,
        type: "plain",
        channel: "generic",
        api_key: TERMII_API_KEY,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[sms] Termii API error (${res.status}): ${errorText}`);
      return false;
    }

    const data = await res.json();
    console.log(`[sms] Sent to ${normalizedPhone}: message_id=${data.message_id}`);
    return true;
  } catch (err) {
    console.error(`[sms] Failed to send to ${normalizedPhone}:`, err);
    return false;
  }
}
