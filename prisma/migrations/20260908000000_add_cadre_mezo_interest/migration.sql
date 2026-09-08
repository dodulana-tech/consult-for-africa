-- CreateTable
CREATE TABLE "CadreMezoInterest" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "seesPrivatePatients" TEXT,
    "sessionalAppetite" TEXT,
    "sessionBudget" TEXT,
    "billingPreference" TEXT,
    "membershipBudget" TEXT,
    "consultationFee" TEXT,
    "practiceCity" TEXT,
    "startTimeline" TEXT,
    "teleconsultInterest" BOOLEAN NOT NULL DEFAULT false,
    "mezoStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "mezoClaimUrl" TEXT,
    "mezoProvisionedAt" TIMESTAMP(3),
    "mezoError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CadreMezoInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CadreMezoInterest_professionalId_key" ON "CadreMezoInterest"("professionalId");

-- CreateIndex
CREATE INDEX "CadreMezoInterest_mezoStatus_idx" ON "CadreMezoInterest"("mezoStatus");

-- CreateIndex
CREATE INDEX "CadreMezoInterest_sessionalAppetite_idx" ON "CadreMezoInterest"("sessionalAppetite");

-- CreateIndex
CREATE INDEX "CadreMezoInterest_createdAt_idx" ON "CadreMezoInterest"("createdAt");

-- AddForeignKey
ALTER TABLE "CadreMezoInterest" ADD CONSTRAINT "CadreMezoInterest_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "CadreProfessional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
