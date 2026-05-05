# Nuru Bot

Headless-Chrome service that joins Google Meet calls, transcribes them with
Deepgram, and posts results back to the CFA Vercel app.

Lives in its own folder so Fly.io only deploys this — not the entire Next.js
platform — keeping the image small (~250MB) and the runtime cheap (scale to
zero when idle).

## Architecture

```
Vercel /api/meetings (POST)
    │
    ├── Save meeting to DB
    └── dispatchScheduleJob() ──HMAC POST──►  Fly bot /jobs/schedule
                                                   │
                                                   ▼
                                          (timer fires at scheduled time)
                                                   │
                                                   ▼
                                          puppeteer joins Meet
                                                   │
                                                   ▼
                                          Web Audio API captures audio
                                                   │
                                                   ▼
                                          Deepgram streaming transcribes
                                                   │
                                                   ▼
                                          Meeting ends
                                                   │
                                                   ▼
            Vercel ◄──HMAC POST──  /api/meetings/[id]/nuru/complete
                                          (transcript, durationSec)
            │
            ├── Save transcript to DB + R2
            ├── Run Claude summarisation
            └── Email participants
```

## Deploy

```bash
# Install Fly CLI (one-time)
brew install flyctl
fly auth login

# From repo root, destroy any wrong-target app first
fly apps destroy consult-for-africa --yes

# From inside bot/
cd bot
fly launch --name cfa-nuru-bot --no-deploy --copy-config

# Generate a shared secret and set bot-side env vars
SECRET=$(openssl rand -hex 32)
fly secrets set \
  BOT_SECRET="$SECRET" \
  DEEPGRAM_API_KEY="$(grep DEEPGRAM_API_KEY ../.env.local | cut -d= -f2 | tr -d '"')" \
  VERCEL_WEBHOOK_URL="https://www.consultforafrica.com"

# Deploy
fly deploy

# Get the public URL
APP_URL=$(fly status --json | jq -r '.Hostname')
echo "Bot deployed at: https://$APP_URL"

# Now set the same SECRET + URL on Vercel:
#   BOT_SERVICE_URL=https://cfa-nuru-bot.fly.dev   (whatever fly assigned)
#   BOT_SECRET=<same value as Fly>
# Then redeploy Vercel.
```

## Verify

```bash
# Public health check (no auth)
curl https://cfa-nuru-bot.fly.dev/health
# {"ok":true,"activeSessions":0,"scheduledJobs":0}
```

## Local dev

```bash
cd bot
npm install
DEEPGRAM_API_KEY=... BOT_SECRET=devsecret VERCEL_WEBHOOK_URL=http://localhost:3000 \
  CHROME_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  npm run dev
```

## Constraints

- One Fly machine handles up to 5 concurrent meetings (memory cap).
- Bot joins 60 seconds before the scheduled start time.
- Maximum meeting duration: 4 hours (Fly machine timeout).
- If the bot crashes mid-meeting, the meeting still happens — only the
  transcript is lost. Vercel will see no `complete` callback and the
  meeting will stay in `IN_PROGRESS` until manually marked done.

## Authentication

All `/jobs/*` endpoints require an HMAC signature header pair:

- `X-Bot-Timestamp`: unix seconds
- `X-Bot-Signature`: `hmac-sha256(timestamp + "." + raw_body, BOT_SECRET)`

Same scheme on the Vercel webhook receivers (`/api/meetings/[id]/nuru/*`).
Implementation: `bot/webhook.ts` and `lib/nuru-bot/dispatch.ts`.
