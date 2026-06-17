-- Add FAILED status for MaarovaReport so the LLM-failure catch path in
-- lib/maarova/generateReport.ts can stop deleting rows. Deleting the row
-- raced with concurrent renderAndStoreReportPdf calls and produced
-- "Record to update not found" errors (orphan PDF in R2, no row linking it).

ALTER TYPE "MaarovaReportStatus" ADD VALUE IF NOT EXISTS 'FAILED';
