-- Maarova org slots redesign.
--
-- Previously usedAssessments counted sessions started (incremented on
-- create). That model leaked slots: abandoned sessions, expired sessions,
-- and retakes all consumed credits without producing the value the
-- hospital paid for (a delivered leadership report).
--
-- The new semantic is "leader coverage": one slot = one distinct user in
-- the org with at least one COMPLETED assessment, excluding the org admin
-- (whose first assessment is free since they are the paying contact).
--
-- This backfill recalculates usedAssessments under the new rule.
UPDATE "MaarovaOrganisation" o
SET "usedAssessments" = COALESCE((
    SELECT COUNT(DISTINCT s."userId")
    FROM "MaarovaAssessmentSession" s
    JOIN "MaarovaUser" u ON s."userId" = u.id
    WHERE u."organisationId" = o.id
      AND s.status = 'COMPLETED'
      AND u.email != o."contactEmail"
), 0);
