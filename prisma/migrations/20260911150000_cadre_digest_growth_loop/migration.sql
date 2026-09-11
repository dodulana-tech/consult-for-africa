-- The weekly digest becomes a growth loop rather than a summary: one rotating
-- ask per week, and five free Maarova assessments allocated to the members who
-- answered it.

-- CreateEnum
CREATE TYPE "CadreDigestAsk" AS ENUM ('SALARY', 'FACILITY_REVIEW', 'MEZO_INTEREST', 'CONFIRM_SPECIALTY', 'REFER_COLLEAGUE', 'SHOWCASE_CONSENT');

-- CreateEnum
CREATE TYPE "CadreAwardStatus" AS ENUM ('AWARDED', 'CLAIMED', 'EXPIRED');

-- AlterTable: showcase consent is opt in and never assumed
ALTER TABLE "CadreProfessional" ADD COLUMN "showcaseOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CadreProfessional" ADD COLUMN "showcaseOptInAt" TIMESTAMP(3);
ALTER TABLE "CadreProfessional" ADD COLUMN "featuredAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CadreMaarovaAward" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "earnedFor" "CadreDigestAsk" NOT NULL,
    "status" "CadreAwardStatus" NOT NULL DEFAULT 'AWARDED',
    "claimToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "maarovaUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CadreMaarovaAward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CadreMaarovaAward_claimToken_key" ON "CadreMaarovaAward"("claimToken");

-- CreateIndex
CREATE INDEX "CadreMaarovaAward_status_idx" ON "CadreMaarovaAward"("status");

-- CreateIndex
CREATE INDEX "CadreMaarovaAward_weekKey_idx" ON "CadreMaarovaAward"("weekKey");

-- CreateIndex: one award per member per week
CREATE UNIQUE INDEX "CadreMaarovaAward_professionalId_weekKey_key" ON "CadreMaarovaAward"("professionalId", "weekKey");

-- AddForeignKey
ALTER TABLE "CadreMaarovaAward" ADD CONSTRAINT "CadreMaarovaAward_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "CadreProfessional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
