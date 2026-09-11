-- Office of the Founding Partner staff roles. Neither is added to
-- ALL_STAFF_ROLES in lib/constants.ts: access is granted surface by surface so
-- nothing is inherited by accident.
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block on older
-- Postgres, so each statement stands alone in its own migration.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'EXECUTIVE_ASSISTANT';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ADMINISTRATIVE_ASSISTANT';
