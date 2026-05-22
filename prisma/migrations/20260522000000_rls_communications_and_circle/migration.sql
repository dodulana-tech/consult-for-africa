-- Enable Row Level Security on tables created after the original RLS
-- lockdown (20260325000000_enable_rls_all_tables). Prisma continues to
-- bypass RLS because it connects as the postgres role - this is
-- defence-in-depth against accidental anon-role exposure (Supabase REST,
-- Realtime, or any misconfigured connection string).
--
-- The MaarovaCircleApplication table holds CVs, AI scores, and PII for
-- every Founding Circle applicant. The Communication* tables hold the
-- entire CRM outbound history including opens, clicks, suppression list.
-- All deserve RLS.

ALTER TABLE public."MaarovaCircleApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Communication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CommunicationParticipant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BulkCommunication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CommunicationEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CommunicationTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CommunicationSuppression" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminNotification" ENABLE ROW LEVEL SECURITY;
