-- Step 1: Remove duplicate OutreachTarget rows on the same campaign + email,
-- keeping only the earliest by createdAt (and then by id as a tiebreaker).
-- This cleans up Gabriel Uche being added 18 times to the Founding Circle
-- on 2026-05-01, plus any other historical dupes.

DELETE FROM "OutreachTarget" t
USING "OutreachTarget" t2
WHERE t.email IS NOT NULL
  AND t.email = t2.email
  AND t."campaignId" = t2."campaignId"
  AND (
    t."createdAt" > t2."createdAt"
    OR (t."createdAt" = t2."createdAt" AND t.id > t2.id)
  );

-- Step 2: Enforce uniqueness going forward so this can't recur even if the
-- application-level guard is bypassed.

CREATE UNIQUE INDEX "OutreachTarget_campaignId_email_key"
  ON "OutreachTarget"("campaignId", email);
