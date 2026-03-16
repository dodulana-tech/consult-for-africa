-- Maarova Assessment Platform

-- Enums
CREATE TYPE "MaarovaStream" AS ENUM ('RECRUITMENT', 'DEVELOPMENT', 'INTELLIGENCE');
CREATE TYPE "MaarovaAssessmentStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');
CREATE TYPE "MaarovaModuleType" AS ENUM ('DISC', 'VALUES_DRIVERS', 'EMOTIONAL_INTEL', 'CILTI', 'THREE_SIXTY', 'CULTURE_TEAM');
CREATE TYPE "MaarovaReportStatus" AS ENUM ('GENERATING', 'READY', 'DELIVERED', 'ARCHIVED');
CREATE TYPE "MaarovaCoachingStatus" AS ENUM ('PENDING_MATCH', 'MATCHED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "MaarovaDevelopmentGoalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DEFERRED');
CREATE TYPE "MaarovaRaterRole" AS ENUM ('SELF', 'SUPERVISOR', 'PEER', 'DIRECT_REPORT');
CREATE TYPE "MaarovaQuestionFormat" AS ENUM ('FORCED_CHOICE_PAIR', 'RANKING', 'SCENARIO_RESPONSE', 'LIKERT_5', 'LIKERT_7', 'FREQUENCY_SCALE', 'FREE_TEXT');

-- MaarovaOrganisation
CREATE TABLE "MaarovaOrganisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "city" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "stream" "MaarovaStream" NOT NULL,
    "maxAssessments" INTEGER NOT NULL DEFAULT 1,
    "usedAssessments" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaarovaOrganisation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MaarovaOrganisation_stream_isActive_idx" ON "MaarovaOrganisation"("stream", "isActive");

-- MaarovaUser
CREATE TABLE "MaarovaUser" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "title" TEXT,
    "department" TEXT,
    "yearsInRole" INTEGER,
    "yearsInHealthcare" INTEGER,
    "clinicalBackground" TEXT,
    "isPortalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "invitedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaarovaUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MaarovaUser_email_key" ON "MaarovaUser"("email");
CREATE INDEX "MaarovaUser_organisationId_idx" ON "MaarovaUser"("organisationId");
ALTER TABLE "MaarovaUser" ADD CONSTRAINT "MaarovaUser_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "MaarovaOrganisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- MaarovaCoach
CREATE TABLE "MaarovaCoach" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "specialisms" TEXT[],
    "certifications" TEXT[],
    "country" TEXT NOT NULL,
    "city" TEXT,
    "yearsExperience" INTEGER NOT NULL,
    "maxClients" INTEGER NOT NULL DEFAULT 8,
    "activeClients" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaarovaCoach_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MaarovaCoach_email_key" ON "MaarovaCoach"("email");
CREATE INDEX "MaarovaCoach_isActive_idx" ON "MaarovaCoach"("isActive");
ALTER TABLE "MaarovaCoach" ADD CONSTRAINT "MaarovaCoach_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "MaarovaOrganisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- MaarovaModule
CREATE TABLE "MaarovaModule" (
    "id" TEXT NOT NULL,
    "type" "MaarovaModuleType" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scoringConfig" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaarovaModule_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MaarovaModule_slug_key" ON "MaarovaModule"("slug");
CREATE INDEX "MaarovaModule_type_idx" ON "MaarovaModule"("type");
CREATE INDEX "MaarovaModule_order_idx" ON "MaarovaModule"("order");

-- MaarovaQuestionGroup
CREATE TABLE "MaarovaQuestionGroup" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaarovaQuestionGroup_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MaarovaQuestionGroup_moduleId_order_idx" ON "MaarovaQuestionGroup"("moduleId", "order");
ALTER TABLE "MaarovaQuestionGroup" ADD CONSTRAINT "MaarovaQuestionGroup_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "MaarovaModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MaarovaQuestion
CREATE TABLE "MaarovaQuestion" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "format" "MaarovaQuestionFormat" NOT NULL,
    "text" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "dimension" TEXT,
    "subDimension" TEXT,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "weight" DECIMAL(4,2) NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaarovaQuestion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MaarovaQuestion_groupId_order_idx" ON "MaarovaQuestion"("groupId", "order");
ALTER TABLE "MaarovaQuestion" ADD CONSTRAINT "MaarovaQuestion_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MaarovaQuestionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MaarovaAssessmentSession
CREATE TABLE "MaarovaAssessmentSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MaarovaAssessmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "sessionType" TEXT NOT NULL DEFAULT 'full',
    "stream" "MaarovaStream" NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "totalTimeMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaarovaAssessmentSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MaarovaAssessmentSession_userId_status_idx" ON "MaarovaAssessmentSession"("userId", "status");
CREATE INDEX "MaarovaAssessmentSession_status_expiresAt_idx" ON "MaarovaAssessmentSession"("status", "expiresAt");
ALTER TABLE "MaarovaAssessmentSession" ADD CONSTRAINT "MaarovaAssessmentSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MaarovaUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MaarovaModuleResponse
CREATE TABLE "MaarovaModuleResponse" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "status" "MaarovaAssessmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "timeSpentSeconds" INTEGER,
    "rawScores" JSONB,
    "scaledScores" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaarovaModuleResponse_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MaarovaModuleResponse_sessionId_moduleId_key" ON "MaarovaModuleResponse"("sessionId", "moduleId");
CREATE INDEX "MaarovaModuleResponse_sessionId_idx" ON "MaarovaModuleResponse"("sessionId");
CREATE INDEX "MaarovaModuleResponse_moduleId_idx" ON "MaarovaModuleResponse"("moduleId");
ALTER TABLE "MaarovaModuleResponse" ADD CONSTRAINT "MaarovaModuleResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MaarovaAssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaarovaModuleResponse" ADD CONSTRAINT "MaarovaModuleResponse_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "MaarovaModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- MaarovaItemResponse
CREATE TABLE "MaarovaItemResponse" (
    "id" TEXT NOT NULL,
    "moduleResponseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "responseTimeMs" INTEGER,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaarovaItemResponse_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MaarovaItemResponse_moduleResponseId_questionId_key" ON "MaarovaItemResponse"("moduleResponseId", "questionId");
CREATE INDEX "MaarovaItemResponse_moduleResponseId_idx" ON "MaarovaItemResponse"("moduleResponseId");
ALTER TABLE "MaarovaItemResponse" ADD CONSTRAINT "MaarovaItemResponse_moduleResponseId_fkey" FOREIGN KEY ("moduleResponseId") REFERENCES "MaarovaModuleResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaarovaItemResponse" ADD CONSTRAINT "MaarovaItemResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "MaarovaQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Maarova360Request
CREATE TABLE "Maarova360Request" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "sessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COLLECTING',
    "minRaters" INTEGER NOT NULL DEFAULT 5,
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Maarova360Request_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Maarova360Request_subjectId_idx" ON "Maarova360Request"("subjectId");
ALTER TABLE "Maarova360Request" ADD CONSTRAINT "Maarova360Request_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "MaarovaUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Maarova360RaterInvite
CREATE TABLE "Maarova360RaterInvite" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "raterId" TEXT,
    "raterEmail" TEXT NOT NULL,
    "raterName" TEXT NOT NULL,
    "role" "MaarovaRaterRole" NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INVITED',
    "completedAt" TIMESTAMP(3),
    "responses" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Maarova360RaterInvite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Maarova360RaterInvite_token_key" ON "Maarova360RaterInvite"("token");
CREATE INDEX "Maarova360RaterInvite_requestId_idx" ON "Maarova360RaterInvite"("requestId");
ALTER TABLE "Maarova360RaterInvite" ADD CONSTRAINT "Maarova360RaterInvite_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Maarova360Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Maarova360RaterInvite" ADD CONSTRAINT "Maarova360RaterInvite_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "MaarovaUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- MaarovaReport
CREATE TABLE "MaarovaReport" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MaarovaReportStatus" NOT NULL DEFAULT 'GENERATING',
    "overallScore" INTEGER,
    "dimensionScores" JSONB,
    "radarChartData" JSONB,
    "benchmarkComparisons" JSONB,
    "executiveSummary" TEXT,
    "strengthsAnalysis" TEXT,
    "developmentAreas" TEXT,
    "blindSpotAnalysis" TEXT,
    "coachingPriorities" JSONB,
    "leadershipArchetype" TEXT,
    "fullReportContent" JSONB,
    "generatedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaarovaReport_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MaarovaReport_sessionId_key" ON "MaarovaReport"("sessionId");
CREATE INDEX "MaarovaReport_userId_idx" ON "MaarovaReport"("userId");
CREATE INDEX "MaarovaReport_status_idx" ON "MaarovaReport"("status");
ALTER TABLE "MaarovaReport" ADD CONSTRAINT "MaarovaReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MaarovaAssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaarovaReport" ADD CONSTRAINT "MaarovaReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MaarovaUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- MaarovaCoachingMatch
CREATE TABLE "MaarovaCoachingMatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "status" "MaarovaCoachingStatus" NOT NULL DEFAULT 'PENDING_MATCH',
    "matchScore" INTEGER,
    "matchRationale" TEXT,
    "programme" TEXT NOT NULL DEFAULT 'standard_6_month',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "sessionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "sessionsScheduled" INTEGER NOT NULL DEFAULT 0,
    "lastSessionAt" TIMESTAMP(3),
    "nextSessionAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaarovaCoachingMatch_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MaarovaCoachingMatch_userId_idx" ON "MaarovaCoachingMatch"("userId");
CREATE INDEX "MaarovaCoachingMatch_coachId_status_idx" ON "MaarovaCoachingMatch"("coachId", "status");
ALTER TABLE "MaarovaCoachingMatch" ADD CONSTRAINT "MaarovaCoachingMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MaarovaUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaarovaCoachingMatch" ADD CONSTRAINT "MaarovaCoachingMatch_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "MaarovaCoach"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- MaarovaCoachingSession
CREATE TABLE "MaarovaCoachingSession" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "notes" TEXT,
    "focusAreas" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaarovaCoachingSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MaarovaCoachingSession_matchId_scheduledAt_idx" ON "MaarovaCoachingSession"("matchId", "scheduledAt");
ALTER TABLE "MaarovaCoachingSession" ADD CONSTRAINT "MaarovaCoachingSession_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "MaarovaCoachingMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MaarovaDevelopmentGoal
CREATE TABLE "MaarovaDevelopmentGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3),
    "status" "MaarovaDevelopmentGoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "milestones" JSONB,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "coachNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaarovaDevelopmentGoal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MaarovaDevelopmentGoal_userId_status_idx" ON "MaarovaDevelopmentGoal"("userId", "status");
ALTER TABLE "MaarovaDevelopmentGoal" ADD CONSTRAINT "MaarovaDevelopmentGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MaarovaUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MaarovaNormativeData
CREATE TABLE "MaarovaNormativeData" (
    "id" TEXT NOT NULL,
    "moduleType" "MaarovaModuleType" NOT NULL,
    "dimension" TEXT NOT NULL,
    "subDimension" TEXT,
    "country" TEXT,
    "sectorType" TEXT,
    "roleLevel" TEXT,
    "sampleSize" INTEGER NOT NULL,
    "mean" DECIMAL(6,2) NOT NULL,
    "stdDev" DECIMAL(6,2) NOT NULL,
    "percentiles" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaarovaNormativeData_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MaarovaNormativeData_moduleType_dimension_subDimension_country_sectorType_roleLevel_key" ON "MaarovaNormativeData"("moduleType", "dimension", "subDimension", "country", "sectorType", "roleLevel");
CREATE INDEX "MaarovaNormativeData_moduleType_dimension_idx" ON "MaarovaNormativeData"("moduleType", "dimension");
