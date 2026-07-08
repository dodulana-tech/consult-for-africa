-- CreateTable
CREATE TABLE "AuditSurveyResponse" (
    "id" TEXT NOT NULL,
    "survey" TEXT NOT NULL,
    "engagementId" TEXT,
    "payload" JSONB NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditSurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditSurveyResponse_survey_idx" ON "AuditSurveyResponse"("survey");

-- CreateIndex
CREATE INDEX "AuditSurveyResponse_createdAt_idx" ON "AuditSurveyResponse"("createdAt");
