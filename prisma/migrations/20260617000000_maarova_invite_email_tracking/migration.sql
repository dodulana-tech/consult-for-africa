-- Track the outcome of Maarova invite emails (previously fire-and-forget with
-- no persisted record). Nullable columns: null = not yet attempted.

ALTER TABLE "MaarovaUser"
  ADD COLUMN "inviteEmailStatus" TEXT,
  ADD COLUMN "inviteEmailSentAt" TIMESTAMP(3),
  ADD COLUMN "inviteEmailError" TEXT;

ALTER TABLE "OutreachTarget"
  ADD COLUMN "inviteEmailStatus" TEXT,
  ADD COLUMN "inviteEmailSentAt" TIMESTAMP(3),
  ADD COLUMN "inviteEmailError" TEXT;
