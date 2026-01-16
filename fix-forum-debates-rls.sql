-- ============================================
-- FIX: Disable RLS for Local Development
-- ============================================
-- Issue: PostgreSQL local doesn't have Supabase auth schema
-- Solution: Disable RLS on all tables for local development
-- Note: RLS should be ENABLED in production (Supabase)

-- Disable RLS on Quoorum Forum tables
ALTER TABLE public.quoorum_debates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_consultations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_custom_experts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_debate_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_debate_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_expert_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_webhooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_api_keys DISABLE ROW LEVEL SECURITY;

-- Disable RLS on core tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('quoorum_debates', 'profiles', 'users')
ORDER BY tablename;
