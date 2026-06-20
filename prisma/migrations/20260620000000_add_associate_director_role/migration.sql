-- Add ASSOCIATE_DIRECTOR to the UserRole enum. This grade sits between
-- ENGAGEMENT_MANAGER and DIRECTOR and carries Director-equivalent permissions.
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block, so this
-- migration contains a single statement.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ASSOCIATE_DIRECTOR' BEFORE 'DIRECTOR';
