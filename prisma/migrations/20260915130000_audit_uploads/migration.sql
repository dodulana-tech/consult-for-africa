-- CreateTable
CREATE TABLE "AuditUpload" (
    "id" TEXT NOT NULL,
    "engagement" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedBy" TEXT,
    "note" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuditUpload_storageKey_key" ON "AuditUpload"("storageKey");

-- CreateIndex
CREATE INDEX "AuditUpload_engagement_section_idx" ON "AuditUpload"("engagement", "section");

-- CreateIndex
CREATE INDEX "AuditUpload_engagement_createdAt_idx" ON "AuditUpload"("engagement", "createdAt");
