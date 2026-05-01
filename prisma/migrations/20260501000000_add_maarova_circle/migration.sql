-- CreateEnum
CREATE TYPE "MaarovaCircleStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'DECLINED', 'WAITLISTED', 'COMPLETED', 'EXPIRED');

-- CreateTable
CREATE TABLE "MaarovaCircleApplication" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "linkedinUrl" TEXT NOT NULL,
    "currentRole" TEXT NOT NULL,
    "currentEmployer" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "yearsInRole" INTEGER,
    "cvFileUrl" TEXT,
    "cvText" TEXT,
    "status" "MaarovaCircleStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "aiScore" INTEGER,
    "aiSummary" TEXT,
    "aiStrengths" TEXT[],
    "aiConcerns" TEXT[],
    "aiRecommendation" TEXT,
    "aiBreakdown" JSONB,
    "reviewedById" TEXT,
    "reviewedById2" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "outreachTargetId" TEXT,
    "inviteToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "invitedAt" TIMESTAMP(3),
    "coachingOptIn" BOOLEAN NOT NULL DEFAULT true,
    "coachingDiscountCode" TEXT,
    "coachingNotifiedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaarovaCircleApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaarovaCircleApplication_email_key" ON "MaarovaCircleApplication"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MaarovaCircleApplication_outreachTargetId_key" ON "MaarovaCircleApplication"("outreachTargetId");

-- CreateIndex
CREATE UNIQUE INDEX "MaarovaCircleApplication_inviteToken_key" ON "MaarovaCircleApplication"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "MaarovaCircleApplication_coachingDiscountCode_key" ON "MaarovaCircleApplication"("coachingDiscountCode");

-- CreateIndex
CREATE INDEX "MaarovaCircleApplication_status_idx" ON "MaarovaCircleApplication"("status");

-- CreateIndex
CREATE INDEX "MaarovaCircleApplication_createdAt_idx" ON "MaarovaCircleApplication"("createdAt");

-- CreateIndex
CREATE INDEX "MaarovaCircleApplication_campaignId_idx" ON "MaarovaCircleApplication"("campaignId");

-- AddForeignKey
ALTER TABLE "MaarovaCircleApplication" ADD CONSTRAINT "MaarovaCircleApplication_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "OutreachCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaarovaCircleApplication" ADD CONSTRAINT "MaarovaCircleApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
