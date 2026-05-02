-- Enable Row Level Security on the new CadreSubscription and CadreCoachingSession tables.
-- These were added in 20260421000000_add_cadre_subscriptions_coaching but missed the
-- RLS lockdown from 20260325000000_enable_rls_all_tables, which only ran once.
-- Prisma continues working as it connects as the postgres role (bypasses RLS).

ALTER TABLE public."CadreSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CadreCoachingSession" ENABLE ROW LEVEL SECURITY;
