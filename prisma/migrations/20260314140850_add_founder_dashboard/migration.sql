-- CreateTable
CREATE TABLE "FounderProfile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPhase" TEXT NOT NULL DEFAULT 'Phase1_MVP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FounderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FounderTask" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "phase" TEXT NOT NULL,
    "week" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT NOT NULL DEFAULT 'general',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "estimatedMinutes" INTEGER,
    "impact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FounderTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FounderMilestone" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "achievedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "celebration" TEXT,
    "badge" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FounderMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FounderDocumentView" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeSpentSeconds" INTEGER,

    CONSTRAINT "FounderDocumentView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FounderAIConversation" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "helpful" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FounderAIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FounderMetric" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "target" DECIMAL(15,2),
    "unit" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FounderMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FounderProfile_email_key" ON "FounderProfile"("email");

-- CreateIndex
CREATE INDEX "FounderTask_founderId_status_idx" ON "FounderTask"("founderId", "status");

-- CreateIndex
CREATE INDEX "FounderTask_dueDate_idx" ON "FounderTask"("dueDate");

-- CreateIndex
CREATE INDEX "FounderMilestone_founderId_status_idx" ON "FounderMilestone"("founderId", "status");

-- CreateIndex
CREATE INDEX "FounderMilestone_targetDate_idx" ON "FounderMilestone"("targetDate");

-- CreateIndex
CREATE INDEX "FounderDocumentView_founderId_viewedAt_idx" ON "FounderDocumentView"("founderId", "viewedAt");

-- CreateIndex
CREATE INDEX "FounderAIConversation_founderId_createdAt_idx" ON "FounderAIConversation"("founderId", "createdAt");

-- CreateIndex
CREATE INDEX "FounderMetric_founderId_metricType_periodDate_idx" ON "FounderMetric"("founderId", "metricType", "periodDate");

-- AddForeignKey
ALTER TABLE "FounderTask" ADD CONSTRAINT "FounderTask_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "FounderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FounderMilestone" ADD CONSTRAINT "FounderMilestone_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "FounderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FounderDocumentView" ADD CONSTRAINT "FounderDocumentView_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "FounderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FounderAIConversation" ADD CONSTRAINT "FounderAIConversation_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "FounderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FounderMetric" ADD CONSTRAINT "FounderMetric_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "FounderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
