-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('INVITED', 'PROFILE_SETUP', 'ASSESSMENT_PENDING', 'ASSESSMENT_COMPLETE', 'REVIEW', 'ACTIVE', 'REJECTED');

-- AlterEnum
ALTER TYPE "TalentApplicationStatus" ADD VALUE 'APPROVED';

-- AlterTable
ALTER TABLE "TalentApplication" ADD COLUMN "convertedToUserId" TEXT,
ADD COLUMN "assessmentLevel" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN "cvFileUrl" TEXT;

-- CreateTable
CREATE TABLE "ConsultantOnboarding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'INVITED',
    "assessmentLevel" TEXT NOT NULL DEFAULT 'STANDARD',
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "assessmentCompleted" BOOLEAN NOT NULL DEFAULT false,
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "applicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultantOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsultantOnboarding_userId_key" ON "ConsultantOnboarding"("userId");

-- CreateIndex
CREATE INDEX "ConsultantOnboarding_status_idx" ON "ConsultantOnboarding"("status");

-- AddForeignKey
ALTER TABLE "ConsultantOnboarding" ADD CONSTRAINT "ConsultantOnboarding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
