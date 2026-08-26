import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { handleCadreSubscription, type PaystackEvent } from "@/lib/paystack/handlers";

/**
 * POST /api/cadre/subscribe/webhook
 * CadreHealth subscription events from Paystack.
 *
 * Paystack allows one webhook URL per mode across the account, and that URL
 * should be /api/paystack/webhook, which routes to every product including
 * this one. This endpoint stays because it is harmless to keep a second door
 * open: if the dashboard is ever pointed here instead, subscriptions still
 * work. The logic itself lives in lib/paystack/handlers.ts so there is one
 * copy of it, not two.
 */
export async function POST(req: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const body = await req.text();
  const sig = req.headers.get("x-paystack-signature");
  const hash = crypto.createHmac("sha512", secretKey).update(body).digest("hex");
  if (sig !== hash) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await handleCadreSubscription(event);

  return NextResponse.json({ ok: true });
}
