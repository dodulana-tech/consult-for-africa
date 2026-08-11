-- CreateTable
CREATE TABLE "MediparkSurveyResponse" (
    "id" TEXT NOT NULL,
    "survey" TEXT NOT NULL DEFAULT 'premium-medipark',
    "payload" JSONB NOT NULL,
    "contactChoice" TEXT,
    "name" TEXT,
    "specialty" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contactedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediparkSurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediparkSurveyResponse_survey_idx" ON "MediparkSurveyResponse"("survey");

-- CreateIndex
CREATE INDEX "MediparkSurveyResponse_createdAt_idx" ON "MediparkSurveyResponse"("createdAt");

-- CreateIndex
CREATE INDEX "MediparkSurveyResponse_contactChoice_idx" ON "MediparkSurveyResponse"("contactChoice");
