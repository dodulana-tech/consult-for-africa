# Migrate outbound email from Zoho SMTP to ZeptoMail

## Why

Zoho rate-limited `hello@consultforafrica.com` after a series of bulk
admin sends (Email Reports to Leaders, Remind 360, etc.). Zoho regular
SMTP is built for human inboxes, not transactional volume. ZeptoMail
is Zoho's dedicated transactional service - same vendor, much higher
limits, free tier of 10,000 emails/month.

## What we did already

- Throttled every bulk send loop (Communications, notify-completed-reports,
  remind-360, remind-unredeemed, coaching-blast) from 200ms to 2s between
  sends. That alone keeps us well under Zoho's hourly cap, but ZeptoMail
  is the proper fix.

## What you need to do (5 minutes)

### Step 1: Unblock the current account

Click the "unblock" link in the Zoho email. This restores Zoho SMTP for
1-to-1 human emails (e.g. when you reply to a consultant from the
Communications module).

### Step 2: Sign up for ZeptoMail

1. Go to https://www.zoho.com/zeptomail/
2. Sign in with your existing Zoho Mail account (no separate signup
   needed if you already have Zoho)
3. Verify the `consultforafrica.com` domain (DNS TXT records, takes
   ~5 minutes)
4. In ZeptoMail dashboard: Mail Agents -> Add a new mail agent ->
   "CFA Platform"
5. Copy the **Send Mail Token** (looks like `Zoho-enczapikey ...`)

### Step 3: Update Vercel env vars

Vercel Dashboard -> consult-for-africa project -> Settings ->
Environment Variables. Update these (Production scope):

| Variable | Old value | New value |
|---|---|---|
| `SMTP_HOST` | smtp.zoho.com | `smtp.zeptomail.com` |
| `SMTP_PORT` | 465 | `587` |
| `SMTP_USER` | hello@... | `emailapikey` (literal string) |
| `SMTP_PASS` | (your zoho password) | (the Send Mail Token from step 2) |
| `SMTP_FROM` | unchanged | `Consult For Africa <hello@consultforafrica.com>` |
| `REPLY_TO_EMAIL` | unchanged | `hello@consultforafrica.com` |

### Step 4: Redeploy

In Vercel: trigger a redeploy of the latest commit so the function
runtime picks up the new env vars. (Or just push any commit.)

### Step 5: Test

Hit `/admin/maarova` -> "Email Reports to Leaders" with one test
recipient. ZeptoMail dashboard will show the send in real time. If the
email arrives at the recipient inbox, you're done.

## After migration

- All transactional emails (Maarova reports, Founding Circle, 360,
  reminders, password resets) flow through ZeptoMail
- Daily cron continues to fire safely
- Bulk sends from admin buttons are no longer constrained by the 2s
  throttle (you can revert it if you want, but it doesn't hurt)
- 10,000 emails/month free tier covers anything we'd realistically do
