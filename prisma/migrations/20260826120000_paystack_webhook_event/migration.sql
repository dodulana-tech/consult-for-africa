-- Durable log of every Paystack webhook event. One account serves several
-- products and Paystack allows one webhook URL per mode, so every event lands
-- on this codebase and is either handled here or forwarded to the product that
-- owns it. Recording the raw body and signature makes a failed forward
-- replayable rather than lost.

CREATE TABLE "PaystackWebhookEvent" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "reference" TEXT,
  "paystackId" TEXT,
  "product" TEXT,
  "signature" TEXT NOT NULL,
  "rawBody" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "handledInternally" BOOLEAN NOT NULL DEFAULT false,
  "forwardResults" JSONB,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PaystackWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaystackWebhookEvent_signature_key" ON "PaystackWebhookEvent"("signature");
CREATE INDEX "PaystackWebhookEvent_status_createdAt_idx" ON "PaystackWebhookEvent"("status", "createdAt");
CREATE INDEX "PaystackWebhookEvent_reference_idx" ON "PaystackWebhookEvent"("reference");
CREATE INDEX "PaystackWebhookEvent_eventType_createdAt_idx" ON "PaystackWebhookEvent"("eventType", "createdAt");
