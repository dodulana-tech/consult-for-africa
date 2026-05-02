-- Track when we last reminded the leader to invite raters, so the bulk
-- "remind all" admin endpoint can dedupe and not re-spam recently-emailed
-- leaders.

ALTER TABLE "Maarova360Request"
ADD COLUMN "lastReminderSentAt" TIMESTAMP(3);
