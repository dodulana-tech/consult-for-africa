-- Rename outreach status values to reflect that diaspora and retired pros are
-- positive engagement tracks, not terminal states.
ALTER TYPE "CadreOutreachStatus" RENAME VALUE 'EMIGRATED' TO 'DIASPORA_NETWORK';
ALTER TYPE "CadreOutreachStatus" RENAME VALUE 'RETIRED' TO 'ALUMNI_NETWORK';

-- New enum capturing the doctor's self-declared situation, set during claim.
CREATE TYPE "CadrePracticeLocation" AS ENUM ('IN_NIGERIA', 'DIASPORA', 'STEPPED_BACK');

-- Self-declared segment fields on the professional.
ALTER TABLE "CadreProfessional"
  ADD COLUMN "practiceLocation" "CadrePracticeLocation",
  ADD COLUMN "practiceLocationSetAt" TIMESTAMP(3);
