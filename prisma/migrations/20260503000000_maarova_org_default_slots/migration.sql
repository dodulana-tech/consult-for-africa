-- Bump the default assessment slots from 1 to 20. The 1-slot default was
-- not growth-forward: hospitals would hit the cap on their first user's
-- first session, which presents as "Failed to start session" and looks
-- like a platform bug.
ALTER TABLE "MaarovaOrganisation"
  ALTER COLUMN "maxAssessments" SET DEFAULT 20;

-- Backfill ONLY the orgs still at the original default of 1. Anything
-- explicitly configured (5, 10, 50, etc.) is left alone -- those values
-- represent intentional choices.
UPDATE "MaarovaOrganisation"
  SET "maxAssessments" = 20
  WHERE "maxAssessments" = 1;
