/**
 * Where to forward Paystack events that belong to a product living outside
 * this codebase (Osibil, Mezo, Cureva and whatever comes next).
 *
 * Paystack allows one webhook URL per mode across the whole account, so this
 * app is the single front door and passes on what is not its own.
 *
 * Configure with one env var, a JSON object of product key to URL:
 *
 *   PAYSTACK_FORWARD_TARGETS={"mezo":"https://mezo.example/api/paystack/webhook","cureva":"https://cureva.example/api/webhooks/paystack"}
 *
 * Adding a product is an env change, not a code change.
 */

export interface ForwardTarget {
  /** Product key, matched against metadata.product on the event */
  key: string;
  url: string;
}

let cached: { raw: string | undefined; targets: ForwardTarget[] } | null = null;

/**
 * Parse PAYSTACK_FORWARD_TARGETS. Bad JSON is logged and treated as empty
 * rather than thrown: a malformed env var must not take the webhook offline
 * and lose events that this codebase can handle perfectly well on its own.
 */
export function getForwardTargets(): ForwardTarget[] {
  const raw = process.env.PAYSTACK_FORWARD_TARGETS;
  if (cached && cached.raw === raw) return cached.targets;

  let targets: ForwardTarget[] = [];

  if (raw?.trim()) {
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      targets = Object.entries(parsed)
        .filter(([key, url]) => {
          if (typeof url !== "string" || !/^https:\/\//i.test(url)) {
            console.error(`[paystack/targets] ignoring "${key}": url must be https`);
            return false;
          }
          return true;
        })
        .map(([key, url]) => ({ key: key.toLowerCase(), url }));
    } catch (err) {
      console.error("[paystack/targets] PAYSTACK_FORWARD_TARGETS is not valid JSON:", err);
    }
  }

  cached = { raw, targets };
  return targets;
}

export function findTarget(product: string | undefined | null): ForwardTarget | null {
  if (!product) return null;
  const key = String(product).toLowerCase();
  return getForwardTargets().find((t) => t.key === key) ?? null;
}
