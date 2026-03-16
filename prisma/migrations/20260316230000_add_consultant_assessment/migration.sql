-- CreateEnum
CREATE TYPE "ConsultantAssessmentStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');

-- CreateTable
CREATE TABLE "ConsultantAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "status" "ConsultantAssessmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "tabSwitchCount" INTEGER NOT NULL DEFAULT 0,
    "pasteEventCount" INTEGER NOT NULL DEFAULT 0,
    "suspiciousFlags" JSONB,
    "aiContentScore" INTEGER,
    "aiIntegrityScore" INTEGER,
    "aiBreakdown" JSONB,
    "videoUrl" TEXT,
    "videoDurationSec" INTEGER,
    "adminScore" INTEGER,
    "adminTier" TEXT,
    "adminNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultantAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultantAssessmentResponse" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "part" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "timeSpentSec" INTEGER,
    "pasteEvents" INTEGER NOT NULL DEFAULT 0,
    "tabSwitches" INTEGER NOT NULL DEFAULT 0,
    "typingPattern" JSONB,
    "wordCount" INTEGER,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultantAssessmentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsultantAssessment_userId_status_idx" ON "ConsultantAssessment"("userId", "status");

-- CreateIndex
CREATE INDEX "ConsultantAssessmentResponse_assessmentId_idx" ON "ConsultantAssessmentResponse"("assessmentId");

-- AddForeignKey
ALTER TABLE "ConsultantAssessment" ADD CONSTRAINT "ConsultantAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultantAssessmentResponse" ADD CONSTRAINT "ConsultantAssessmentResponse_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "ConsultantAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
