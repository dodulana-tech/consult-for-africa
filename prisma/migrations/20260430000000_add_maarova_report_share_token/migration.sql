-- Add shareable credential support to MaarovaReport
-- shareToken: opaque base64url string (32 random bytes); null = not shared
-- shareEnabledAt: timestamp the user enabled sharing (null = never enabled, even if token exists historically)

ALTER TABLE "MaarovaReport"
  ADD COLUMN "shareToken" TEXT,
  ADD COLUMN "shareEnabledAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "MaarovaReport_shareToken_key" ON "MaarovaReport"("shareToken");
