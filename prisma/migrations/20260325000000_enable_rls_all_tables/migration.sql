-- Enable Row Level Security on all public tables
-- This blocks unauthorized access via Supabase PostgREST/API (anon key)
-- Prisma continues working normally as it connects directly as postgres role (bypasses RLS)

DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE '_prisma%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
  END LOOP;
END $$;
