-- CreateEnum
CREATE TYPE "IleRelationship" AS ENUM ('PARENT', 'GRANDPARENT', 'SPOUSE', 'OTHER_RELATIVE', 'SELF', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "IleInterest" AS ENUM ('RESIDENTIAL', 'HOME_CARE', 'BOTH', 'UNDECIDED');

-- CreateEnum
CREATE TYPE "IleCareNeed" AS ENUM ('COMPANIONSHIP', 'PERSONAL_CARE', 'SKILLED_NURSING', 'DEMENTIA_SUPPORT', 'POST_HOSPITAL', 'END_OF_LIFE', 'NOT_SURE');

-- CreateEnum
CREATE TYPE "IleUrgency" AS ENUM ('NOW', 'WITHIN_3_MONTHS', 'WITHIN_6_MONTHS', 'PLANNING_AHEAD');

-- CreateEnum
CREATE TYPE "IleWaitlistStatus" AS ENUM ('NEW', 'CONTACTED', 'ASSESSED', 'PILOT_CLIENT', 'RESIDENT', 'NOT_PROCEEDING');

-- CreateTable
CREATE TABLE "IleWaitlistEntry" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "relationship" "IleRelationship" NOT NULL,
    "basedOutsideNigeria" BOOLEAN NOT NULL DEFAULT false,
    "basedCountry" TEXT,
    "careCity" TEXT,
    "interest" "IleInterest" NOT NULL DEFAULT 'UNDECIDED',
    "careNeeds" "IleCareNeed"[],
    "urgency" "IleUrgency" NOT NULL,
    "notes" TEXT,
    "foundingFamily" BOOLEAN NOT NULL DEFAULT false,
    "referralCode" TEXT NOT NULL,
    "referredByCode" TEXT,
    "consentedAt" TIMESTAMP(3) NOT NULL,
    "consentText" TEXT NOT NULL,
    "sourcePath" TEXT,
    "ipHash" TEXT,
    "status" "IleWaitlistStatus" NOT NULL DEFAULT 'NEW',
    "contactedAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IleWaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IleWaitlistEntry_email_key" ON "IleWaitlistEntry"("email");

-- CreateIndex
CREATE UNIQUE INDEX "IleWaitlistEntry_referralCode_key" ON "IleWaitlistEntry"("referralCode");

-- CreateIndex
CREATE INDEX "IleWaitlistEntry_status_idx" ON "IleWaitlistEntry"("status");

-- CreateIndex
CREATE INDEX "IleWaitlistEntry_interest_idx" ON "IleWaitlistEntry"("interest");

-- CreateIndex
CREATE INDEX "IleWaitlistEntry_urgency_idx" ON "IleWaitlistEntry"("urgency");

-- CreateIndex
CREATE INDEX "IleWaitlistEntry_basedOutsideNigeria_idx" ON "IleWaitlistEntry"("basedOutsideNigeria");

-- CreateIndex
CREATE INDEX "IleWaitlistEntry_referredByCode_idx" ON "IleWaitlistEntry"("referredByCode");

-- CreateIndex
CREATE INDEX "IleWaitlistEntry_createdAt_idx" ON "IleWaitlistEntry"("createdAt");
