-- CreateTable
CREATE TABLE "ConsultantMatchScore" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "rankPosition" INTEGER NOT NULL,
    "expertiseScore" DECIMAL(4,3) NOT NULL,
    "performanceScore" DECIMAL(4,3) NOT NULL,
    "availabilityScore" DECIMAL(4,3) NOT NULL,
    "costScore" DECIMAL(4,3) NOT NULL,
    "fitScore" DECIMAL(4,3) NOT NULL,
    "explanation" TEXT NOT NULL,
    "confidenceLevel" DECIMAL(4,3) NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT 'v1',
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultantMatchScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedProposal" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "projectName" TEXT,
    "inputData" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsultantMatchScore_projectId_rankPosition_idx" ON "ConsultantMatchScore"("projectId", "rankPosition");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultantMatchScore_projectId_consultantId_key" ON "ConsultantMatchScore"("projectId", "consultantId");
