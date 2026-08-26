import { prisma } from "@/lib/prisma";
import { createHmac, timingSafeEqual } from "crypto";
import { handler } from "@/lib/api-handler";
import { routeEvent } from "@/lib/paystack/router";
import type { PaystackEvent } from "@/lib/paystack/handlers";

/**
 * POST /api/paystack/webhook
 *
 * The single Paystack webhook for the whole account. Paystack allows one
 * webhook URL per mode, and that account serves several products, some of
 * which live in other codebases. So this endpoint verifies the signature,
 * writes the event down, then either handles it here or forwards it to the
 * product that owns it. See lib/paystack/router.ts for how ownership is
 * decided, and lib/paystack/targets.ts for how to add a product.
 *
 * Public endpoint: authenticated by HMAC-SHA512 over the raw body, no session.
 */

/** Compare in constant time so the signature cannot be probed byte by byte. */
function signatureMatches(expected: string, received: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const POST = handler(async function POST(req: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return Response.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  const expectedSignature = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  if (!signatureMatches(expectedSignature, signature)) {
    console.error("[paystack/webhook] invalid signature");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // The signature is a hash of the body, so an identical redelivery produces
  // an identical signature. That makes it a natural idempotency key.
  const existing = await prisma.paystackWebhookEvent.findUnique({
    where: { signature },
    select: { id: true, status: true, attempts: true },
  });

  // Already dealt with. Say OK and do nothing again.
  if (existing && ["HANDLED", "FORWARDED", "UNROUTED"].includes(existing.status)) {
    return new Response("OK", { status: 200 });
  }

  const record = existing
    ? await prisma.paystackWebhookEvent.update({
        where: { id: existing.id },
        data: { attempts: { increment: 1 }, status: "PENDING" },
        select: { id: true },
      })
    : await prisma.paystackWebhookEvent.create({
        data: {
          eventType: event.event ?? "unknown",
          reference: event.data?.reference ?? null,
          paystackId: event.data?.id ? String(event.data.id) : null,
          signature,
          rawBody,
          status: "PENDING",
          attempts: 1,
        },
        select: { id: true },
      });

  const outcome = await routeEvent(event, rawBody, signature);

  await prisma.paystackWebhookEvent.update({
    where: { id: record.id },
    data: {
      product: outcome.product,
      status: outcome.status,
      handledInternally: outcome.handledInternally,
      forwardResults: outcome.forwardResults.length
        ? JSON.parse(JSON.stringify(outcome.forwardResults))
        : undefined,
      lastError: outcome.error?.slice(0, 2000) ?? null,
    },
  });

  if (outcome.status === "UNROUTED") {
    console.warn(
      `[paystack/webhook] ${event.event} ref ${event.data?.reference ?? "?"} matched no product. ` +
        `Set metadata.product on initialize, or add the product to PAYSTACK_FORWARD_TARGETS.`
    );
  }

  // A failed forward is usually a downstream deploy or outage, and Paystack's
  // own retries are the cheapest way to ride that out. Ask for one.
  const forwardFailed = outcome.forwardResults.some((r) => !r.ok);
  if (forwardFailed) {
    return Response.json(
      { error: "Downstream delivery failed", eventId: record.id },
      { status: 500 }
    );
  }

  // A failed local handler is a bug or a data problem, and retrying rarely
  // fixes either. The event is on record, so replay it deliberately instead:
  //   npx tsx --env-file=.env.local scripts/replay-paystack-events.ts --apply
  if (outcome.status === "FAILED") {
    console.error(
      `[paystack/webhook] local handling failed for ${record.id}: ${outcome.error}`
    );
  }

  return new Response("OK", { status: 200 });
});
