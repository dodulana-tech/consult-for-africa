-- Schema/DB drift fix: CadrePracticeLocation enum + practiceLocation columns
-- existed in prisma/schema.prisma but never had a migration. This was causing
-- every Prisma read of CadreProfessional to error in production
-- (forgot-password, login, profile views), since Prisma SELECTs all columns.

-- Create enum if it doesn't already exist (idempotent guard)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CadrePracticeLocation') THEN
    CREATE TYPE "CadrePracticeLocation" AS ENUM ('IN_NIGERIA', 'DIASPORA', 'STEPPED_BACK');
  END IF;
END $$;

-- Add columns if missing
ALTER TABLE "CadreProfessional"
  ADD COLUMN IF NOT EXISTS "practiceLocation" "CadrePracticeLocation",
  ADD COLUMN IF NOT EXISTS "practiceLocationSetAt" TIMESTAMP(3);
