/**
 * Decides who owns a Paystack event and gets it there.
 *
 * One Paystack account serves several products and Paystack allows a single
 * webhook URL per mode, so every event for every product lands on this app.
 * This module works out whether the event belongs here, belongs to a product
 * in another codebase, or carries nothing that identifies an owner.
 *
 * Ownership is decided in this order:
 *
 *   1. metadata.product names a configured external target, so forward there
 *      and nowhere else. This is the convention every product should follow:
 *      set metadata.product on transaction.initialize.
 *   2. The event carries a marker this codebase recognises (invoiceId,
 *      trackPurchaseId, type=cadre_subscription), so handle it here.
 *   3. Nothing identifies an owner. Events like subscription.disable and
 *      transfer.* carry no metadata at all, so run the local handlers, which
 *      filter themselves, and fan the event out to every external target so
 *      each one can decide for itself. Everyone verifies the same signature
 *      against the same key, so this is safe.
 */
import { getForwardTargets, findTarget, type ForwardTarget } from "@/lib/paystack/targets";
import {
  handleTrackPurchase,
  handleInvoicePayment,
  handleCadreSubscription,
  type PaystackEvent,
} from "@/lib/paystack/handlers";

const FORWARD_TIMEOUT_MS = 8000;

export interface ForwardResult {
  target: string;
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
}

export interface RouteOutcome {
  /** Resolved owner: an external target key, "internal", or null */
  product: string | null;
  handledInternally: boolean;
  forwardResults: ForwardResult[];
  /** HANDLED | FORWARDED | PARTIAL | UNROUTED | FAILED */
  status: "HANDLED" | "FORWARDED" | "PARTIAL" | "UNROUTED" | "FAILED";
  error?: string;
}

/** Does this event carry something this codebase knows how to act on? */
function hasInternalMarker(event: PaystackEvent): boolean {
  const m = event.data?.metadata;
  if (m?.invoiceId || m?.trackPurchaseId) return true;
  if (m?.type === "cadre_subscription") return true;
  return false;
}

/**
 * Pass the event on untouched. The raw body and the original signature header
 * go through byte for byte, so the receiving app verifies the HMAC against the
 * shared secret key exactly as if Paystack had called it directly.
 */
async function forward(
  target: ForwardTarget,
  rawBody: string,
  signature: string
): Promise<ForwardResult> {
  try {
    const res = await fetch(target.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-paystack-signature": signature,
        "x-forwarded-by": "consult-for-africa",
      },
      body: rawBody,
      signal: AbortSignal.timeout(FORWARD_TIMEOUT_MS),
    });

    if (!res.ok) {
      return {
        target: target.key,
        url: target.url,
        ok: false,
        status: res.status,
        error: `HTTP ${res.status}`,
      };
    }
    return { target: target.key, url: target.url, ok: true, status: res.status };
  } catch (err) {
    return {
      target: target.key,
      url: target.url,
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

/** Run the local handlers. Each one filters itself and no-ops if not relevant. */
async function runInternal(event: PaystackEvent): Promise<void> {
  if (event.event === "charge.success") {
    if (event.data?.metadata?.trackPurchaseId) {
      await handleTrackPurchase(event);
      return;
    }
    if (event.data?.metadata?.type === "cadre_subscription") {
      await handleCadreSubscription(event);
      return;
    }
    if (event.data?.metadata?.invoiceId) {
      await handleInvoicePayment(event);
      return;
    }
    return;
  }

  if (event.event === "subscription.disable" || event.event === "subscription.not_renew") {
    await handleCadreSubscription(event);
  }
}

export async function routeEvent(
  event: PaystackEvent,
  rawBody: string,
  signature: string
): Promise<RouteOutcome> {
  // 1. Explicitly addressed to a product in another codebase
  const named = findTarget(event.data?.metadata?.product);
  if (named) {
    const result = await forward(named, rawBody, signature);
    return {
      product: named.key,
      handledInternally: false,
      forwardResults: [result],
      status: result.ok ? "FORWARDED" : "FAILED",
      error: result.error,
    };
  }

  // 2. Ours to handle
  if (hasInternalMarker(event)) {
    try {
      await runInternal(event);
      return { product: "internal", handledInternally: true, forwardResults: [], status: "HANDLED" };
    } catch (err) {
      return {
        product: "internal",
        handledInternally: false,
        forwardResults: [],
        status: "FAILED",
        error: err instanceof Error ? err.message : "unknown",
      };
    }
  }

  // 3. No owner named. Offer it to everyone and let each side filter.
  const targets = getForwardTargets();
  let internalError: string | undefined;
  let handledInternally = false;

  try {
    await runInternal(event);
    handledInternally = true;
  } catch (err) {
    internalError = err instanceof Error ? err.message : "unknown";
    console.error("[paystack/router] local handling failed:", err);
  }

  const forwardResults = await Promise.all(
    targets.map((t) => forward(t, rawBody, signature))
  );

  if (targets.length === 0) {
    return {
      product: null,
      handledInternally,
      forwardResults: [],
      status: internalError ? "FAILED" : "UNROUTED",
      error: internalError,
    };
  }

  const failed = forwardResults.filter((r) => !r.ok);
  const status =
    failed.length === 0
      ? "FORWARDED"
      : failed.length === forwardResults.length
        ? "FAILED"
        : "PARTIAL";

  return {
    product: null,
    handledInternally,
    forwardResults,
    status,
    error: internalError ?? (failed.length ? failed.map((f) => `${f.target}: ${f.error}`).join("; ") : undefined),
  };
}
