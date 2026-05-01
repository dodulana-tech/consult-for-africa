-- CreateEnum
CREATE TYPE "CadreSubscriptionPlan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "CadreSubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CadreCoachingSessionStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "CadreSubscription" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "plan" "CadreSubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "CadreSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "paystackCustomerCode" TEXT,
    "paystackSubCode" TEXT,
    "paystackEmailToken" TEXT,
    "paystackPlanCode" TEXT,
    "amountNGN" INTEGER NOT NULL DEFAULT 0,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "aiMessagesThisMonth" INTEGER NOT NULL DEFAULT 0,
    "aiMessagesResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CadreSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CadreCoachingSession" (
    "id" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "mentorProfileId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "status" "CadreCoachingSessionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMinutes" INTEGER NOT NULL DEFAULT 45,
    "notes" TEXT,
    "amountNGN" INTEGER NOT NULL DEFAULT 5000,
    "paystackRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "rating" INTEGER,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CadreCoachingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CadreSubscription_professionalId_key" ON "CadreSubscription"("professionalId");

-- CreateIndex
CREATE INDEX "CadreSubscription_status_idx" ON "CadreSubscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CadreCoachingSession_paystackRef_key" ON "CadreCoachingSession"("paystackRef");

-- CreateIndex
CREATE INDEX "CadreCoachingSession_menteeId_status_idx" ON "CadreCoachingSession"("menteeId", "status");

-- CreateIndex
CREATE INDEX "CadreCoachingSession_mentorProfileId_status_idx" ON "CadreCoachingSession"("mentorProfileId", "status");

-- AddForeignKey
ALTER TABLE "CadreSubscription" ADD CONSTRAINT "CadreSubscription_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "CadreProfessional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CadreCoachingSession" ADD CONSTRAINT "CadreCoachingSession_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "CadreProfessional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CadreCoachingSession" ADD CONSTRAINT "CadreCoachingSession_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "CadreMentorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
