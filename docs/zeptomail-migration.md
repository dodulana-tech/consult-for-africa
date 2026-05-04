# Migrate outbound email to ZeptoMail (HTTP API)

## Why

Zoho rate-limited `hello@consultforafrica.com` after a series of bulk
admin sends. Zoho regular SMTP is built for human inboxes, not
transactional volume. ZeptoMail is Zoho's dedicated transactional
service - higher limits, delivery webhooks, simple HTTP API.

## What's already wired in the code

`lib/email.ts` now prefers the **ZeptoMail HTTP API** when
`ZEPTOMAIL_API_KEY` is set, and falls back to SMTP via nodemailer
when it isn't. So the migration is literally:

> Set one env var. Done.

## What you need to do (5 minutes)

### Step 1: Unblock the Zoho account

Click the unblock link in the Zoho email so you can still send 1-to-1
emails from `hello@consultforafrica.com`.

### Step 2: Sign up for ZeptoMail

1. Go to https://www.zoho.com/zeptomail/ and sign in with your
   existing Zoho account
2. **Verify the `consultforafrica.com` domain** by adding the DNS TXT
   records ZeptoMail provides. Wait ~5 minutes.
3. **Verify `hello@consultforafrica.com`** as a sender (one-click
   confirmation email)
4. Mail Agents -> Add new -> name it "CFA Platform"
5. Copy the **Send Mail Token** from the agent page

### Step 3: Add the env var to Vercel

Vercel Dashboard -> consult-for-africa project -> Settings ->
Environment Variables. Add in **Production** scope:

| Variable | Value |
|---|---|
| `ZEPTOMAIL_API_KEY` | (the Send Mail Token from step 2) |

Leave `SMTP_*` env vars alone - they stay as the fallback if you
ever need to revert.

### Step 4: Redeploy

Trigger a Vercel redeploy of latest main so the function runtime
picks up the new env var. Push any commit, or use the redeploy
button.

### Step 5: Test

Send a test from `/admin/maarova` -> "Email Reports to Leaders"
or any other admin button. The ZeptoMail dashboard shows the send
in real time. Logs in Vercel will show
`[email] sending to ... via ZeptoMail`.

## After migration

- All transactional emails flow through the ZeptoMail HTTP API
- Daily/weekly crons resume safely
- Open + click tracking available in the ZeptoMail dashboard
- 10,000 emails/month free tier covers our realistic volume
- Delivery webhooks available if we ever need real-time bounce
  handling (separate work)

## Rolling back

Remove `ZEPTOMAIL_API_KEY` from Vercel env vars. The send helper
falls back to the existing SMTP credentials. No code change needed.

## Bumping the cron back to daily

Once ZeptoMail is confirmed working, edit `vercel.json`:

```diff
-      "schedule": "0 9 * * 1"
+      "schedule": "0 9 * * *"
```

Push, redeploy, daily reminders resume.
