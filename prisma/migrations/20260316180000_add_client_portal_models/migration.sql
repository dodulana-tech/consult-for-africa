-- AlterTable: Add clientVisible to KnowledgeAsset
ALTER TABLE "KnowledgeAsset" ADD COLUMN "clientVisible" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: ClientExpansionRequest
CREATE TABLE "ClientExpansionRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "projectId" TEXT,
    "serviceType" "ServiceType",
    "description" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientExpansionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ClientSatisfactionPulse
CREATE TABLE "ClientSatisfactionPulse" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" TEXT,
    "period" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientSatisfactionPulse_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ClientRecommendation
CREATE TABLE "ClientRecommendation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceType" "ServiceType",
    "estimatedImpact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUGGESTED',
    "clientResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "ClientRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientExpansionRequest_clientId_status_idx" ON "ClientExpansionRequest"("clientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ClientSatisfactionPulse_projectId_contactId_period_key" ON "ClientSatisfactionPulse"("projectId", "contactId", "period");

-- CreateIndex
CREATE INDEX "ClientSatisfactionPulse_projectId_idx" ON "ClientSatisfactionPulse"("projectId");

-- CreateIndex
CREATE INDEX "ClientRecommendation_projectId_status_idx" ON "ClientRecommendation"("projectId", "status");

-- AddForeignKey
ALTER TABLE "ClientExpansionRequest" ADD CONSTRAINT "ClientExpansionRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSatisfactionPulse" ADD CONSTRAINT "ClientSatisfactionPulse_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRecommendation" ADD CONSTRAINT "ClientRecommendation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
