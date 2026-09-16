-- A lead can hang off more than one service line. Additive: serviceLineHook
-- stays and keeps holding the first selection, so code running the previous
-- build continues to read it correctly.
ALTER TABLE "Lead" ADD COLUMN "serviceLineHooks" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Carry the existing single value across so nothing looks empty in the new UI.
UPDATE "Lead" SET "serviceLineHooks" = ARRAY["serviceLineHook"]
WHERE "serviceLineHook" IS NOT NULL AND "serviceLineHook" <> '';
