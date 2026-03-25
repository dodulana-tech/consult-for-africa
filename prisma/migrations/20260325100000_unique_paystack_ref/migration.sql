-- Add unique constraint on Payment.paystackRef for idempotent webhook processing
-- Drop the existing non-unique index first, then add unique constraint

DROP INDEX IF EXISTS "Payment_paystackRef_idx";

CREATE UNIQUE INDEX "Payment_paystackRef_key" ON "Payment"("paystackRef");
