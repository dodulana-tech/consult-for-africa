-- CreateEnum
CREATE TYPE "PhaseStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('GREEN', 'AMBER', 'RED');

-- CreateEnum
CREATE TYPE "RiskItemStatus" AS ENUM ('OPEN', 'MITIGATING', 'RESOLVED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "PaymentMilestoneStatus" AS ENUM ('PENDING', 'INVOICED', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('CALL', 'MEETING', 'EMAIL', 'WORKSHOP', 'SITE_VISIT', 'REPORT_DELIVERY');

-- CreateEnum
CREATE TYPE "InteractionSentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'CONCERNED', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "CommentAuthorType" AS ENUM ('INTERNAL', 'CLIENT');

-- CreateEnum
CREATE TYPE "DeliverableReviewStage" AS ENUM ('DRAFT', 'PEER_REVIEW', 'INTERNAL_QA', 'CLIENT_REVIEW', 'APPROVED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "KnowledgeAssetType" AS ENUM ('INSIGHT', 'FRAMEWORK', 'TEMPLATE', 'CASE_STUDY', 'LESSON_LEARNED');

-- CreateEnum
CREATE TYPE "ReferralType" AS ENUM ('CLIENT', 'CONSULTANT', 'STAFF');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'CONTACTED', 'CONVERTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FrameworkStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Deliverable" ADD COLUMN     "clientVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "reviewStage" "DeliverableReviewStage" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "clientSatisfactionScore" INTEGER,
ADD COLUMN     "methodology" TEXT,
ADD COLUMN     "methodologyId" TEXT;

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "type" "ReferralType" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "organisation" TEXT,
    "suggestedRole" TEXT,
    "notes" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectPhase" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "status" "PhaseStatus" NOT NULL DEFAULT 'PENDING',
    "percentComplete" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhaseGate" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "passedAt" TIMESTAMP(3),
    "passedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhaseGate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Operational',
    "severity" "RiskSeverity" NOT NULL DEFAULT 'AMBER',
    "likelihood" INTEGER NOT NULL DEFAULT 3,
    "impact" INTEGER NOT NULL DEFAULT 3,
    "riskScore" INTEGER NOT NULL DEFAULT 9,
    "ownerId" TEXT,
    "mitigation" TEXT,
    "status" "RiskItemStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'NGN',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "status" "PaymentMilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientInteraction" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "summary" TEXT NOT NULL,
    "sentiment" "InteractionSentiment" NOT NULL DEFAULT 'NEUTRAL',
    "conductedById" TEXT NOT NULL,
    "conductedAt" TIMESTAMP(3) NOT NULL,
    "nextActionDate" TIMESTAMP(3),
    "nextActionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliverableVersion" (
    "id" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "changeNotes" TEXT,
    "submittedById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliverableVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliverableComment" (
    "id" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorType" "CommentAuthorType" NOT NULL DEFAULT 'INTERNAL',
    "parentId" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliverableComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectImpactMetric" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "baselineValue" TEXT,
    "currentValue" TEXT,
    "unit" TEXT,
    "quantifiedValue" DECIMAL(14,2),
    "currency" "Currency",
    "clientQuote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectImpactMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeAsset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "assetType" "KnowledgeAssetType" NOT NULL,
    "tags" TEXT[],
    "isReusable" BOOLEAN NOT NULL DEFAULT false,
    "fileUrl" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientContact" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "title" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isPortalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MethodologyTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "serviceTypes" TEXT[],
    "estimatedWeeks" INTEGER NOT NULL DEFAULT 8,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MethodologyTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MethodologyPhaseTemplate" (
    "id" TEXT NOT NULL,
    "methodologyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "typicalWeeks" INTEGER NOT NULL DEFAULT 2,
    "keyActivities" TEXT[],
    "keyDeliverables" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MethodologyPhaseTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GateTemplate" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameworkTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dimensions" TEXT[],
    "guideText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrameworkTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectFramework" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "status" "FrameworkStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectFramework_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_status_createdAt_idx" ON "Referral"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectPhase_projectId_order_idx" ON "ProjectPhase"("projectId", "order");

-- CreateIndex
CREATE INDEX "PhaseGate_phaseId_idx" ON "PhaseGate"("phaseId");

-- CreateIndex
CREATE INDEX "RiskItem_projectId_severity_idx" ON "RiskItem"("projectId", "severity");

-- CreateIndex
CREATE INDEX "PaymentMilestone_projectId_status_idx" ON "PaymentMilestone"("projectId", "status");

-- CreateIndex
CREATE INDEX "ClientInteraction_projectId_conductedAt_idx" ON "ClientInteraction"("projectId", "conductedAt");

-- CreateIndex
CREATE INDEX "DeliverableVersion_deliverableId_versionNumber_idx" ON "DeliverableVersion"("deliverableId", "versionNumber");

-- CreateIndex
CREATE INDEX "DeliverableComment_deliverableId_parentId_idx" ON "DeliverableComment"("deliverableId", "parentId");

-- CreateIndex
CREATE INDEX "ProjectImpactMetric_projectId_idx" ON "ProjectImpactMetric"("projectId");

-- CreateIndex
CREATE INDEX "KnowledgeAsset_projectId_idx" ON "KnowledgeAsset"("projectId");

-- CreateIndex
CREATE INDEX "KnowledgeAsset_assetType_isReusable_idx" ON "KnowledgeAsset"("assetType", "isReusable");

-- CreateIndex
CREATE UNIQUE INDEX "ClientContact_email_key" ON "ClientContact"("email");

-- CreateIndex
CREATE INDEX "ClientContact_clientId_idx" ON "ClientContact"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "MethodologyTemplate_slug_key" ON "MethodologyTemplate"("slug");

-- CreateIndex
CREATE INDEX "MethodologyTemplate_category_idx" ON "MethodologyTemplate"("category");

-- CreateIndex
CREATE INDEX "MethodologyTemplate_isActive_idx" ON "MethodologyTemplate"("isActive");

-- CreateIndex
CREATE INDEX "MethodologyPhaseTemplate_methodologyId_order_idx" ON "MethodologyPhaseTemplate"("methodologyId", "order");

-- CreateIndex
CREATE INDEX "GateTemplate_phaseId_idx" ON "GateTemplate"("phaseId");

-- CreateIndex
CREATE UNIQUE INDEX "FrameworkTemplate_slug_key" ON "FrameworkTemplate"("slug");

-- CreateIndex
CREATE INDEX "FrameworkTemplate_category_idx" ON "FrameworkTemplate"("category");

-- CreateIndex
CREATE INDEX "FrameworkTemplate_isActive_idx" ON "FrameworkTemplate"("isActive");

-- CreateIndex
CREATE INDEX "ProjectFramework_projectId_idx" ON "ProjectFramework"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectFramework_projectId_frameworkId_key" ON "ProjectFramework"("projectId", "frameworkId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_methodologyId_fkey" FOREIGN KEY ("methodologyId") REFERENCES "MethodologyTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPhase" ADD CONSTRAINT "ProjectPhase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseGate" ADD CONSTRAINT "PhaseGate_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "ProjectPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskItem" ADD CONSTRAINT "RiskItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMilestone" ADD CONSTRAINT "PaymentMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientInteraction" ADD CONSTRAINT "ClientInteraction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverableVersion" ADD CONSTRAINT "DeliverableVersion_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "Deliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverableComment" ADD CONSTRAINT "DeliverableComment_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "Deliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverableComment" ADD CONSTRAINT "DeliverableComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DeliverableComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectImpactMetric" ADD CONSTRAINT "ProjectImpactMetric_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAsset" ADD CONSTRAINT "KnowledgeAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientContact" ADD CONSTRAINT "ClientContact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MethodologyPhaseTemplate" ADD CONSTRAINT "MethodologyPhaseTemplate_methodologyId_fkey" FOREIGN KEY ("methodologyId") REFERENCES "MethodologyTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateTemplate" ADD CONSTRAINT "GateTemplate_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "MethodologyPhaseTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFramework" ADD CONSTRAINT "ProjectFramework_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFramework" ADD CONSTRAINT "ProjectFramework_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "FrameworkTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
