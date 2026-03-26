-- EngagementTrack model (workstreams within projects)
CREATE TYPE "EngagementTrackStatus" AS ENUM ('OPEN', 'ACTIVE', 'PAUSED', 'COMPLETED');

CREATE TABLE "EngagementTrack" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "EngagementTrackStatus" NOT NULL DEFAULT 'OPEN',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budgetAmount" DECIMAL(14,2),
    "budgetCurrency" "Currency",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngagementTrack_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EngagementTrack_projectId_idx" ON "EngagementTrack"("projectId");

ALTER TABLE "EngagementTrack" ADD CONSTRAINT "EngagementTrack_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add trackId + new fields to Assignment
ALTER TABLE "Assignment" ADD COLUMN "trackId" TEXT;
ALTER TABLE "Assignment" ADD COLUMN "trackRole" TEXT;
ALTER TABLE "Assignment" ADD COLUMN "allocationPct" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Assignment" ADD COLUMN "billRate" DECIMAL(10,2);
ALTER TABLE "Assignment" ADD COLUMN "billCurrency" "Currency";
ALTER TABLE "Assignment" ADD COLUMN "isBillable" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Assignment_trackId_idx" ON "Assignment"("trackId");

ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_trackId_fkey"
    FOREIGN KEY ("trackId") REFERENCES "EngagementTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add trackId to Deliverable
ALTER TABLE "Deliverable" ADD COLUMN "trackId" TEXT;

CREATE INDEX "Deliverable_trackId_idx" ON "Deliverable"("trackId");

ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_trackId_fkey"
    FOREIGN KEY ("trackId") REFERENCES "EngagementTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add trackId to TimeEntry
ALTER TABLE "TimeEntry" ADD COLUMN "trackId" TEXT;

CREATE INDEX "TimeEntry_trackId_idx" ON "TimeEntry"("trackId");

ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_trackId_fkey"
    FOREIGN KEY ("trackId") REFERENCES "EngagementTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add trackId to StaffingRequest
ALTER TABLE "StaffingRequest" ADD COLUMN "trackId" TEXT;

ALTER TABLE "StaffingRequest" ADD CONSTRAINT "StaffingRequest_trackId_fkey"
    FOREIGN KEY ("trackId") REFERENCES "EngagementTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enable RLS on new table
ALTER TABLE "EngagementTrack" ENABLE ROW LEVEL SECURITY;
