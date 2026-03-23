-- Replace EngagementType enum with new values (old values used only as String[], safe to change)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EngagementType') THEN
    DROP TYPE "EngagementType" CASCADE;
  END IF;
  CREATE TYPE "EngagementType" AS ENUM ('PROJECT', 'RETAINER', 'SECONDMENT', 'FRACTIONAL', 'TRANSFORMATION', 'TRANSACTION');
END $$;

-- Rename ProjectStatus enum (idempotent)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProjectStatus')
     AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EngagementStatus') THEN
    ALTER TYPE "ProjectStatus" RENAME TO "EngagementStatus";
  END IF;
END $$;

-- New enums (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DealStructure') THEN
    CREATE TYPE "DealStructure" AS ENUM ('SWEAT', 'CAPITAL', 'HYBRID');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MandateType') THEN
    CREATE TYPE "MandateType" AS ENUM ('SELL_SIDE', 'BUY_SIDE', 'FUNDRAISE');
  END IF;
END $$;

-- Add engagement type and type-specific fields to Project table
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "engagementType" "EngagementType" NOT NULL DEFAULT 'PROJECT';
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "engagementCode" TEXT;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Project_engagementCode_key') THEN
    ALTER TABLE "Project" ADD CONSTRAINT "Project_engagementCode_key" UNIQUE ("engagementCode");
  END IF;
END $$;

-- RETAINER fields
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "retainerMonthlyFee" DECIMAL(14,2);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "retainerHoursPool" INT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "retainerAutoRenew" BOOLEAN;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "retainerNoticePeriodDays" INT;

-- SECONDMENT fields
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "secondeeId" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "secondeeClientLineManager" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "secondeeRecallClauseDays" INT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "secondeeMaarovaProfileUrl" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "secondeeMonthlyFee" DECIMAL(14,2);

-- FRACTIONAL fields
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "fractionalPlacedName" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "fractionalRoleTitle" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "fractionalCommissionPct" DECIMAL(5,2);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "fractionalArrangementFee" DECIMAL(14,2);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "fractionalPlacementDate" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "fractionalConvertedToPermanent" BOOLEAN;

-- TRANSFORMATION fields
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "transformHospitalId" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "transformEquityPct" DECIMAL(5,2);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "transformDealStructure" "DealStructure";
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "transformEntryValuation" DECIMAL(14,2);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "transformBoardSeat" BOOLEAN;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "transformStepInTrigger" INT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "transformExitMonths" INT;

-- TRANSACTION fields
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "transactionMandateType" "MandateType";
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "transactionTargetCompany" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "transactionDealSize" DECIMAL(14,2);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "transactionSuccessFeePct" DECIMAL(5,2);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "transactionUpfrontRetainer" DECIMAL(14,2);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "transactionCloseDate" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "transactionSuccessFeeAmount" DECIMAL(14,2);

-- Index on engagement type
CREATE INDEX IF NOT EXISTS "Project_engagementType_idx" ON "Project"("engagementType");

-- ─── Transform OS tables ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Hospital" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "state" TEXT NOT NULL,
    "lga" TEXT,
    "bedCount" INT,
    "ownershipType" TEXT,
    "specialtyFocus" TEXT,
    "hmoPanelsCount" INT,
    "nhiaAccredited" BOOLEAN NOT NULL DEFAULT false,
    "registrationNumber" TEXT,
    "distressScore" DECIMAL(5,2),
    "distressTier" TEXT,
    "financialScore" DECIMAL(5,2),
    "operationalScore" DECIMAL(5,2),
    "clinicalScore" DECIMAL(5,2),
    "staffingScore" DECIMAL(5,2),
    "infrastructureScore" DECIMAL(5,2),
    "governanceScore" DECIMAL(5,2),
    "pipelineStage" TEXT NOT NULL DEFAULT 'IDENTIFIED',
    "founderMotivation" TEXT,
    "founderSuccession" BOOLEAN,
    "cfaRelationshipScore" INT,
    "source" TEXT,
    "referredBy" TEXT,
    "lastContactDate" TIMESTAMP(3),
    "nextAction" TEXT,
    "nextActionDate" TIMESTAMP(3),
    "priorityRank" INT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Hospital_pipelineStage_idx" ON "Hospital"("pipelineStage");
CREATE INDEX IF NOT EXISTS "Hospital_distressTier_idx" ON "Hospital"("distressTier");

CREATE TABLE IF NOT EXISTS "HospitalContactLog" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "contactedBy" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "nextAction" TEXT,
    "contactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HospitalContactLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HospitalContactLog_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "HospitalContactLog_hospitalId_contactedAt_idx" ON "HospitalContactLog"("hospitalId", "contactedAt");

CREATE TABLE IF NOT EXISTS "DealRecord" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "engagementId" TEXT,
    "version" INT NOT NULL DEFAULT 1,
    "structureType" TEXT NOT NULL,
    "recommendedByWizard" BOOLEAN NOT NULL DEFAULT false,
    "entryValuation" DECIMAL(14,2),
    "exitValBase" DECIMAL(14,2),
    "exitValBear" DECIMAL(14,2),
    "exitValBull" DECIMAL(14,2),
    "exitMultipleBase" DECIMAL(5,2),
    "cfaEquityPct" DECIMAL(5,2),
    "kickerPct" DECIMAL(5,2),
    "kickerTrigger" TEXT,
    "vestCliffMonths" INT,
    "vestMonthlyPct" DECIMAL(5,2),
    "antiDilution" BOOLEAN NOT NULL DEFAULT true,
    "cashFeeMonthly" DECIMAL(14,2),
    "cashFeePct" DECIMAL(5,2),
    "irrBase" DECIMAL(6,2),
    "irrBear" DECIMAL(6,2),
    "irrBull" DECIMAL(6,2),
    "moicBase" DECIMAL(5,2),
    "moicBear" DECIMAL(5,2),
    "moicBull" DECIMAL(5,2),
    "rtoType" TEXT,
    "rtoTermsJson" JSONB,
    "status" TEXT NOT NULL DEFAULT 'MODELLING',
    "termSheetUrl" TEXT,
    "termSheetVersion" INT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DealRecord_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DealRecord_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id")
);
CREATE INDEX IF NOT EXISTS "DealRecord_hospitalId_idx" ON "DealRecord"("hospitalId");
CREATE INDEX IF NOT EXISTS "DealRecord_engagementId_idx" ON "DealRecord"("engagementId");

CREATE TABLE IF NOT EXISTS "Diagnostic" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "clinicalJson" JSONB,
    "operationalJson" JSONB,
    "revenueJson" JSONB,
    "financialJson" JSONB,
    "hrJson" JSONB,
    "governanceJson" JSONB,
    "revenueMonthly" DECIMAL(14,2),
    "revenuePerBedDay" DECIMAL(14,2),
    "revenuePerOpd" DECIMAL(14,2),
    "ebitdaMarginPct" DECIMAL(5,2),
    "grossMarginPct" DECIMAL(5,2),
    "costPerPatient" DECIMAL(14,2),
    "bedOccupancyPct" DECIMAL(5,2),
    "opdVolumeDaily" DECIMAL(8,2),
    "theatreUtilisationPct" DECIMAL(5,2),
    "alosDays" DECIMAL(5,2),
    "hmoDenialRatePct" DECIMAL(5,2),
    "arDays" DECIMAL(8,2),
    "hmoPanelsCount" INT,
    "cleanClaimRatePct" DECIMAL(5,2),
    "collectionRatePct" DECIMAL(5,2),
    "staffTurnoverPct" DECIMAL(5,2),
    "doctorBedRatio" DECIMAL(5,2),
    "nurseBedRatio" DECIMAL(5,2),
    "vacancyRatePct" DECIMAL(5,2),
    "readmissionRatePct" DECIMAL(5,2),
    "complaintRate" DECIMAL(8,2),
    "infectionRatePct" DECIMAL(5,2),
    "quickWinsJson" JSONB,
    "planDay1to30" JSONB,
    "planDay31to60" JSONB,
    "planDay61to90" JSONB,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "lockedBy" TEXT,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Diagnostic_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Diagnostic_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id")
);
CREATE INDEX IF NOT EXISTS "Diagnostic_hospitalId_idx" ON "Diagnostic"("hospitalId");
CREATE INDEX IF NOT EXISTS "Diagnostic_engagementId_idx" ON "Diagnostic"("engagementId");

CREATE TABLE IF NOT EXISTS "TransformKPISnapshot" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "revenueMonthly" DECIMAL(14,2),
    "revenuePerBedDay" DECIMAL(14,2),
    "ebitdaMarginPct" DECIMAL(5,2),
    "bedOccupancyPct" DECIMAL(5,2),
    "opdVolumeDaily" DECIMAL(8,2),
    "hmoDenialRatePct" DECIMAL(5,2),
    "arDays" DECIMAL(8,2),
    "hmoPanelsCount" INT,
    "cleanClaimRatePct" DECIMAL(5,2),
    "collectionRatePct" DECIMAL(5,2),
    "staffTurnoverPct" DECIMAL(5,2),
    "doctorBedRatio" DECIMAL(5,2),
    "nurseBedRatio" DECIMAL(5,2),
    "readmissionRatePct" DECIMAL(5,2),
    "redCount" INT,
    "amberCount" INT,
    "greenCount" INT,
    "vsBaselineJson" JSONB,
    "enteredBy" TEXT NOT NULL,
    "notes" TEXT,
    "boardPackIncluded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransformKPISnapshot_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TransformKPISnapshot_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id"),
    CONSTRAINT "TransformKPISnapshot_hospitalId_engagementId_period_key" UNIQUE ("hospitalId", "engagementId", "period")
);
CREATE INDEX IF NOT EXISTS "TransformKPISnapshot_engagementId_period_idx" ON "TransformKPISnapshot"("engagementId", "period");

CREATE TABLE IF NOT EXISTS "ConsultantActivityLog" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "activity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hours" DECIMAL(5,2),
    "immutable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsultantActivityLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ConsultantActivityLog_engagementId_date_idx" ON "ConsultantActivityLog"("engagementId", "date");

CREATE TABLE IF NOT EXISTS "GovernanceAlert" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "detailsJson" JSONB NOT NULL,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "GovernanceAlert_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "GovernanceAlert_engagementId_status_idx" ON "GovernanceAlert"("engagementId", "status");
CREATE INDEX IF NOT EXISTS "GovernanceAlert_alertType_status_idx" ON "GovernanceAlert"("alertType", "status");

CREATE TABLE IF NOT EXISTS "ExitDossier" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "exitEbitda" DECIMAL(14,2),
    "exitMultipleApplied" DECIMAL(5,2),
    "exitValuation" DECIMAL(14,2),
    "exitValRangeLow" DECIMAL(14,2),
    "exitValRangeHigh" DECIMAL(14,2),
    "dataRoomCompletenessPct" INT,
    "documentsJson" JSONB,
    "buyersJson" JSONB,
    "imVersion" INT,
    "imUrl" TEXT,
    "ndaLogJson" JSONB,
    "ioiLogJson" JSONB,
    "preferredBidder" TEXT,
    "equityProceeds" DECIMAL(14,2),
    "managementFeesTotal" DECIMAL(14,2),
    "totalCfaReturn" DECIMAL(14,2),
    "realisedMoic" DECIMAL(5,2),
    "realisedIrr" DECIMAL(6,2),
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExitDossier_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ExitDossier_hospitalId_key" UNIQUE ("hospitalId"),
    CONSTRAINT "ExitDossier_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id")
);
CREATE INDEX IF NOT EXISTS "ExitDossier_engagementId_idx" ON "ExitDossier"("engagementId");

-- ─── PlaybookOS tables ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "LibraryAsset" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "streamTags" TEXT[],
    "problemTags" TEXT[],
    "outputFormat" TEXT,
    "geographyTags" TEXT[],
    "maturity" TEXT NOT NULL DEFAULT 'DRAFT',
    "fileUrl" TEXT,
    "fileType" TEXT,
    "version" INT NOT NULL DEFAULT 1,
    "versionHistoryJson" JSONB,
    "authorId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "viewCount" INT NOT NULL DEFAULT 0,
    "downloadCount" INT NOT NULL DEFAULT 0,
    "engagementAssociationCount" INT NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "lastUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LibraryAsset_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LibraryAsset_assetType_maturity_idx" ON "LibraryAsset"("assetType", "maturity");
CREATE INDEX IF NOT EXISTS "LibraryAsset_authorId_idx" ON "LibraryAsset"("authorId");

CREATE TABLE IF NOT EXISTS "EngagementPlaybook" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "templateUsed" TEXT,
    "phasesJson" JSONB,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EngagementPlaybook_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EngagementPlaybook_engagementId_key" UNIQUE ("engagementId")
);
CREATE INDEX IF NOT EXISTS "EngagementPlaybook_engagementId_idx" ON "EngagementPlaybook"("engagementId");

CREATE TABLE IF NOT EXISTS "PlaybookAssetLink" (
    "id" TEXT NOT NULL,
    "playbookId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "phase" TEXT,
    "notes" TEXT,
    CONSTRAINT "PlaybookAssetLink_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PlaybookAssetLink_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "LibraryAsset"("id"),
    CONSTRAINT "PlaybookAssetLink_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "EngagementPlaybook"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PlaybookAssetLink_playbookId_idx" ON "PlaybookAssetLink"("playbookId");
CREATE INDEX IF NOT EXISTS "PlaybookAssetLink_assetId_idx" ON "PlaybookAssetLink"("assetId");

CREATE TABLE IF NOT EXISTS "EngagementDebrief" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "summaryProblem" TEXT,
    "summaryApproach" TEXT,
    "summaryOutcome" TEXT,
    "whatWorkedJson" JSONB,
    "whatFailedJson" JSONB,
    "clientContext" TEXT,
    "newAssetsJson" JSONB,
    "sectorInsightsJson" JSONB,
    "submittedBy" TEXT,
    "reviewedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EngagementDebrief_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EngagementDebrief_engagementId_key" UNIQUE ("engagementId")
);
CREATE INDEX IF NOT EXISTS "EngagementDebrief_status_idx" ON "EngagementDebrief"("status");

CREATE TABLE IF NOT EXISTS "DebriefAssetLink" (
    "id" TEXT NOT NULL,
    "debriefId" TEXT NOT NULL,
    "assetId" TEXT,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "DebriefAssetLink_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DebriefAssetLink_debriefId_fkey" FOREIGN KEY ("debriefId") REFERENCES "EngagementDebrief"("id") ON DELETE CASCADE,
    CONSTRAINT "DebriefAssetLink_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "LibraryAsset"("id")
);
CREATE INDEX IF NOT EXISTS "DebriefAssetLink_debriefId_idx" ON "DebriefAssetLink"("debriefId");
CREATE INDEX IF NOT EXISTS "DebriefAssetLink_assetId_idx" ON "DebriefAssetLink"("assetId");

CREATE TABLE IF NOT EXISTS "AssetDownloadLog" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "engagementId" TEXT,
    "downloadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssetDownloadLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AssetDownloadLog_assetId_idx" ON "AssetDownloadLog"("assetId");
CREATE INDEX IF NOT EXISTS "AssetDownloadLog_engagementId_idx" ON "AssetDownloadLog"("engagementId");
