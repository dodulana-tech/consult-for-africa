-- CreateEnum
CREATE TYPE "TalentApplicationStatus" AS ENUM ('SUBMITTED', 'AI_SCREENED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED', 'HIRED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "EngagementType" AS ENUM ('FULL_TIME', 'PART_TIME', 'PROJECT_BASED', 'INTERIM', 'ADVISORY');

-- CreateTable
CREATE TABLE "TalentApplication" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "location" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "yearsExperience" INTEGER NOT NULL,
    "currentRole" TEXT,
    "currentOrg" TEXT,
    "workAuthorization" TEXT NOT NULL DEFAULT 'nigerian_citizen',
    "cvText" TEXT,
    "coverLetter" TEXT,
    "availableFrom" TIMESTAMP(3),
    "engagementTypes" TEXT[],
    "aiScore" INTEGER,
    "aiScoreBreakdown" JSONB,
    "aiSummary" TEXT,
    "aiStrengths" TEXT[],
    "aiConcerns" TEXT[],
    "aiRecommendation" TEXT,
    "status" "TalentApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TalentApplication_email_key" ON "TalentApplication"("email");

-- CreateIndex
CREATE INDEX "TalentApplication_status_createdAt_idx" ON "TalentApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TalentApplication_specialty_idx" ON "TalentApplication"("specialty");

-- CreateIndex
CREATE INDEX "TalentApplication_aiScore_idx" ON "TalentApplication"("aiScore");

-- AddForeignKey
ALTER TABLE "TalentApplication" ADD CONSTRAINT "TalentApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
