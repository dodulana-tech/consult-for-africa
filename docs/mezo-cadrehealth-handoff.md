# Opening a Mezo place from CadreHealth

CadreHealth holds the register. Mezo holds the practice. This is how a doctor
who already has one gets the other without filling in a second registration
form.

Mezo runs in its own codebase against its own database, so this is an HTTP call
across a trust boundary rather than a shared table.

## The shape of it

1. A member answers the private practice survey at `/oncadre/mezo`.
2. The answers are written to `CadreMezoInterest` **first**. They are the thing
   we cannot recreate, so nothing that depends on a third party runs before
   they are committed.
3. CadreHealth calls Mezo and asks it to seed a doctor stub.
4. Mezo returns a claim URL. It is stored on the same row and shown to the
   member, on the page and afterwards on their dashboard.
5. The member sets a password and their real MDCN folio at that URL. Mezo drops
   them into its normal onboarding.

Nobody is verified by any of this. A seeded doctor is inactive, at onboarding
step 1, with `mdcnStatus` PENDING. MDCN verification and indemnity stay Mezo's
job and the doctor's.

## Who is eligible

Mezo runs on the MDCN register, so places are open to `MEDICINE` and
`DENTISTRY` only. That is 10,178 of the 10,226 records currently held, so the
constraint costs almost nothing, but the offer is hidden rather than shown and
then refused for everyone else.

## The call

```
POST {MEZO_BASE_URL}/api/partners/cadrehealth/provision
x-cfa-signature: <hex HMAC-SHA256 of the raw body, keyed with MEZO_PARTNER_SECRET>
```

```json
{
  "professionals": [
    {
      "externalId": "<CadreHealth professional id>",
      "email": "doctor@example.com",
      "firstName": "Francis",
      "lastName": "Korie",
      "phone": "08037155363",
      "primarySpecialty": "Paediatrics",
      "subSpecialty": "Neonatology",
      "state": "Lagos",
      "isDiaspora": false,
      "mdcnFolioNumber": "12345"
    }
  ]
}
```

```json
{
  "results": [
    { "externalId": "...", "status": "created", "claimUrl": "https://mezohealth.com/claim/<token>" }
  ]
}
```

`status` is `created`, `existing` or `skipped`. Up to 200 per request.

### Signing

HMAC-SHA256 over the **exact bytes** sent, hex encoded, in `x-cfa-signature`.
Mezo reads the body raw and verifies before parsing, the same discipline as
[the Paystack webhook](./paystack-shared-account.md). Serialise once and send
that same string: anything that re-serialises the JSON between signing and
sending will change the bytes and the signature will not verify.

Verified in both directions by `lib/__tests__/mezo-provision.test.ts`.

## Idempotency

Keyed on email, because that is the identity both sides agree on.

| State on Mezo | What happens |
|---|---|
| No account | Created, claim URL returned, `status: created` |
| Unclaimed stub | Claim token refreshed, new URL returned, `status: existing` |
| Already claimed | Nothing touched, `status: existing`, no URL |
| Email belongs to a non-doctor | `status: skipped` with a reason |

A repeat call never resets a password and never reopens an account someone has
already claimed. Refreshing the token on an unclaimed stub is deliberate: a
stale link should not be the reason a doctor cannot get in.

## When Mezo is unreachable

The survey still counts as answered. `mezoStatus` goes to `FAILED` with the
reason in `mezoError`, and the member is told their place is being opened
rather than being asked to fill the form in again. Retrying is a matter of
re-running provisioning for rows in that state; no answers are lost and nobody
is asked anything twice.

If `MEZO_PARTNER_SECRET` or `MEZO_BASE_URL` is unset, the survey records
normally and `mezoStatus` stays `PENDING`. Nothing throws.

## Environment

On the CadreHealth side (Vercel, Production):

```
MEZO_BASE_URL=https://mezohealth.com
MEZO_PARTNER_SECRET=<shared secret>
```

On the Mezo side:

```
MEZO_PARTNER_SECRET=<the same shared secret>
NEXT_PUBLIC_APP_URL=https://mezohealth.com
```

The Mezo endpoint refuses to run at all if the secret is unset, rather than
falling back to an empty key.

## Reading the answers

`/admin/mezo-survey`. The commercial questions render as distributions, because
a decision about which rooms to take turns on the shape of the answers rather
than on any single one. Cities are grouped case insensitively, since that is
the question that decides where the first room opens.
