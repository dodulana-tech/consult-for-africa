-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PartnerRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'MATCHING', 'SHORTLIST_SENT', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PartnerDeploymentStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'ACTIVE', 'COMPLETED', 'RECALLED', 'DECLINED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PartnerFirm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "website" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "city" TEXT,
    "notes" TEXT,
    "defaultMarkupPct" DECIMAL(5,2),
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'PROSPECT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerFirm_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PartnerContact" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "title" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isPortalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerContact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PartnerStaffingRequest" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "requestCode" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectDescription" TEXT NOT NULL,
    "rolesNeeded" INTEGER NOT NULL DEFAULT 1,
    "skillsRequired" TEXT[],
    "serviceTypes" TEXT[],
    "seniority" TEXT,
    "hoursPerWeek" INTEGER,
    "startDate" TIMESTAMP(3),
    "durationWeeks" INTEGER,
    "clientBudgetPerDay" DECIMAL(10,2),
    "budgetCurrency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "PartnerRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "matchedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "cfaReviewedById" TEXT,
    "cfaNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerStaffingRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PartnerDeployment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "ratePerDay" DECIMAL(10,2) NOT NULL,
    "billingRatePerDay" DECIMAL(10,2) NOT NULL,
    "rateCurrency" TEXT NOT NULL DEFAULT 'NGN',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "hoursPerWeek" INTEGER,
    "anonymisedProfile" JSONB,
    "status" "PartnerDeploymentStatus" NOT NULL DEFAULT 'PROPOSED',
    "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "declinedReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "partnerRating" INTEGER,
    "partnerFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerDeployment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PartnerInvoice" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "lineItems" JSONB NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "tax" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "period" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issuedDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "paymentRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PartnerContact_email_key" ON "PartnerContact"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "PartnerStaffingRequest_requestCode_key" ON "PartnerStaffingRequest"("requestCode");
CREATE UNIQUE INDEX IF NOT EXISTS "PartnerInvoice_invoiceNumber_key" ON "PartnerInvoice"("invoiceNumber");

CREATE INDEX IF NOT EXISTS "PartnerFirm_status_idx" ON "PartnerFirm"("status");
CREATE INDEX IF NOT EXISTS "PartnerContact_partnerId_idx" ON "PartnerContact"("partnerId");
CREATE INDEX IF NOT EXISTS "PartnerStaffingRequest_partnerId_status_idx" ON "PartnerStaffingRequest"("partnerId", "status");
CREATE INDEX IF NOT EXISTS "PartnerDeployment_requestId_idx" ON "PartnerDeployment"("requestId");
CREATE INDEX IF NOT EXISTS "PartnerDeployment_consultantId_idx" ON "PartnerDeployment"("consultantId");
CREATE INDEX IF NOT EXISTS "PartnerDeployment_status_idx" ON "PartnerDeployment"("status");
CREATE INDEX IF NOT EXISTS "PartnerInvoice_partnerId_idx" ON "PartnerInvoice"("partnerId");
CREATE INDEX IF NOT EXISTS "PartnerInvoice_status_idx" ON "PartnerInvoice"("status");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PartnerContact" ADD CONSTRAINT "PartnerContact_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerFirm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PartnerStaffingRequest" ADD CONSTRAINT "PartnerStaffingRequest_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerFirm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PartnerDeployment" ADD CONSTRAINT "PartnerDeployment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PartnerStaffingRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PartnerInvoice" ADD CONSTRAINT "PartnerInvoice_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerFirm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
