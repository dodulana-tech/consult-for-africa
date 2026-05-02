-- Add password reset fields to CadreEmployerAccount
ALTER TABLE "CadreEmployerAccount"
  ADD COLUMN "passwordResetToken" TEXT,
  ADD COLUMN "passwordResetExpiry" TIMESTAMP(3);
