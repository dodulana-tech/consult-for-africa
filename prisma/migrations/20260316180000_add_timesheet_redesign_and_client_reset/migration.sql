-- AlterEnum: Add DAILY to RateType
ALTER TYPE "RateType" ADD VALUE IF NOT EXISTS 'DAILY';

-- AlterTable: Add fields to Assignment
ALTER TABLE "Assignment" ADD COLUMN IF NOT EXISTS "estimatedDays" INTEGER;

-- AlterTable: Add fields to TimeEntry
ALTER TABLE "TimeEntry" ADD COLUMN IF NOT EXISTS "hoursWorked" DECIMAL(5,2);
ALTER TABLE "TimeEntry" ADD COLUMN IF NOT EXISTS "periodMonth" INTEGER;
ALTER TABLE "TimeEntry" ADD COLUMN IF NOT EXISTS "periodYear" INTEGER;
ALTER TABLE "TimeEntry" ADD COLUMN IF NOT EXISTS "isForBilling" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "TimeEntry" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- AlterTable: Add reset fields to ClientContact
ALTER TABLE "ClientContact" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "ClientContact" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);

-- AlterTable: Add reset fields to User (platform password reset)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);

-- AlterTable: Add reset fields to MaarovaUser (Maarova password reset)
ALTER TABLE "MaarovaUser" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "MaarovaUser" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);
