-- Org-level self-serve join link for Maarova. One shareable URL per
-- organisation: staff register themselves into the org rather than each being
-- created and emailed individually. Registration is capped by maxAssessments.

ALTER TABLE "MaarovaOrganisation"
  ADD COLUMN "joinToken" TEXT,
  ADD COLUMN "joinEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "joinExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "MaarovaOrganisation_joinToken_key" ON "MaarovaOrganisation"("joinToken");
