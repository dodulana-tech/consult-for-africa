-- Track when we last reminded an outreach target to redeem their onboarding
-- link, so the bulk "remind unredeemed" admin endpoint can dedupe and not
-- re-spam recently-emailed leaders.

ALTER TABLE "OutreachTarget"
ADD COLUMN IF NOT EXISTS "lastReminderSentAt" TIMESTAMP(3);
