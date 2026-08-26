# One Paystack account, several products

Paystack allows **one webhook URL per mode** for the whole account. We run several products on a single account, some of which live in other codebases (Osibil, Mezo, Cureva), so every event for every product arrives at one place and has to be passed on from there.

The single URL is:

```
https://www.consultforafrica.com/api/paystack/webhook
```

Set it in the Paystack dashboard under Settings, API Keys & Webhooks. **Test mode and live mode hold separate URLs**, so setting one does not set the other.

That endpoint verifies the signature, writes the event to the `PaystackWebhookEvent` table, then either handles it here or forwards it to whichever product owns it.

## What a product outside this codebase must do

### 1. Tag every transaction with `metadata.product`

On `transaction.initialize`, set `metadata.product` to your product key:

```json
{
  "email": "customer@example.com",
  "amount": 500000,
  "metadata": {
    "product": "mezo",
    "orderId": "your-own-id"
  }
}
```

Without this tag your events cannot be addressed to you. They still reach you, but only via the fan-out described below, which is slower to reason about and noisier.

### 2. Expose a webhook endpoint that verifies the signature itself

Events are forwarded with the raw body and the original `x-paystack-signature` header unchanged, so verify exactly as if Paystack had called you directly: HMAC-SHA512 over the raw request body, keyed with the shared **secret key**.

```ts
const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
if (hash !== req.headers["x-paystack-signature"]) return res.status(401).end();
```

Read the body **raw**. Anything that re-serialises the JSON before you hash it will change the bytes and the signature will not match.

Forwarded requests also carry `x-forwarded-by: consult-for-africa`, which is informational only. Never trust it in place of the signature.

### 3. Ignore what is not yours, and return 2xx when you do

You will receive events belonging to other products. Check `metadata.product`, or your own identifiers, and return `200` for anything you do not recognise. **Do not return an error for an event that is not yours**: a non-2xx is read as a delivery failure and triggers retries for everyone.

### 4. Be idempotent

The same event can arrive more than once: Paystack retries on any non-2xx, and we replay deliberately after an outage. Key off `data.reference` and make a second delivery a no-op.

### 5. Send us your URL

Add it to `PAYSTACK_FORWARD_TARGETS` in the CFA Vercel project, Production:

```
PAYSTACK_FORWARD_TARGETS={"mezo":"https://mezo.example/api/paystack/webhook","cureva":"https://cureva.example/api/webhooks/paystack","osibil":"https://osibil.example/api/paystack"}
```

Must be `https`. A plain `http` entry is refused and logged rather than used. Adding a product is an env change and a redeploy, not a code change.

## How an event finds its owner

Decided in [lib/paystack/router.ts](../lib/paystack/router.ts), in this order:

1. **`metadata.product` names a configured target.** Forwarded there and nowhere else.
2. **The event carries a marker this codebase owns** (`metadata.invoiceId`, `metadata.trackPurchaseId`, `metadata.type === "cadre_subscription"`). Handled here.
3. **Nothing identifies an owner.** Some events genuinely carry no metadata, notably `subscription.disable`, `subscription.not_renew` and the `transfer.*` family. These are offered to everyone: local handlers run and filter themselves, and the event is fanned out to every configured target so each can decide for itself. Everyone verifies the same signature against the same key, so this is safe.

## When something fails

Every event is written down before it is acted on, so a failure costs a retry rather than the event.

| Status | Meaning |
|---|---|
| `HANDLED` | Dealt with inside this codebase |
| `FORWARDED` | Accepted by every destination it was sent to |
| `PARTIAL` | Some destinations accepted it, others did not |
| `FAILED` | A local handler threw, or every destination rejected it |
| `UNROUTED` | Matched no product, and no targets were configured |

A failed **forward** returns 500 to Paystack, which enlists Paystack's own retries. A failed **local handler** returns 200, because retrying a bug rarely fixes it; replay it deliberately instead:

```bash
npx tsx --env-file=.env.local scripts/replay-paystack-events.ts               # list
npx tsx --env-file=.env.local scripts/replay-paystack-events.ts --apply
npx tsx --env-file=.env.local scripts/replay-paystack-events.ts --apply --unrouted   # after adding a new product
```

Replay uses the stored raw body and signature, so the receiving side verifies exactly what Paystack originally sent.

## Separate accounts instead

If a product needs its own books, its own settlement account or independent key rotation, the clean answer is a **separate Paystack integration** with its own keys and its own webhook URL, not this router. Subaccounts do not help here: they split settlement, they do not route events.
