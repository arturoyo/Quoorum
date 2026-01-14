-- Migration: Enable Row Level Security (RLS) on all public tables
-- Generated: 2025-01-13
-- Purpose: Fix Supabase linter security warnings

-- ============================================
-- STEP 1: Enable RLS on all tables
-- ============================================

-- Core tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

-- Admin tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Debate/Forum core tables
ALTER TABLE public.deliberations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consensus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opinions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Forum tables
ALTER TABLE public.quoorum_debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_context_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_custom_experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_deal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_deal_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_debate_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_debate_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_debate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_expert_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_expert_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_expert_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_api_keys ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Create RLS Policies
-- ============================================

-- ============================================
-- USERS TABLE
-- ============================================
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE POLICY "Profiles are viewable by owner"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Profiles are updatable by owner"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Profiles can be created by owner"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE POLICY "Clients are viewable by owner"
  ON public.clients
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clients are manageable by owner"
  ON public.clients
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE POLICY "Conversations are viewable by owner"
  ON public.conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Conversations are manageable by owner"
  ON public.conversations
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- DEALS TABLE
-- ============================================
CREATE POLICY "Deals are viewable by owner"
  ON public.deals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Deals are manageable by owner"
  ON public.deals
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE POLICY "Subscriptions are viewable by owner"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Subscriptions can be inserted by owner"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PLANS TABLE (Public read, admin write)
-- ============================================
CREATE POLICY "Plans are viewable by everyone"
  ON public.plans
  FOR SELECT
  USING (true);

-- ============================================
-- USAGE TABLE
-- ============================================
CREATE POLICY "Usage is viewable by owner"
  ON public.usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usage can be inserted by owner"
  ON public.usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ADMIN TABLES (Restricted to admin role)
-- ============================================
CREATE POLICY "Admin users table - admin only"
  ON public.admin_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admin roles table - admin only"
  ON public.admin_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "API keys - owner access"
  ON public.api_keys
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Audit logs - owner read"
  ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- FORUM DEBATES & RELATED TABLES
-- ============================================
CREATE POLICY "Debates are viewable by owner"
  ON public.quoorum_debates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Debates are manageable by owner"
  ON public.quoorum_debates
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Deliberations viewable by debate owner"
  ON public.deliberations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quoorum_debates
      WHERE id = deliberations.debate_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Consensus viewable by debate owner"
  ON public.consensus
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quoorum_debates
      WHERE id = consensus.debate_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Rounds viewable by debate owner"
  ON public.rounds
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quoorum_debates
      WHERE id = rounds.debate_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Opinions viewable by debate owner"
  ON public.opinions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quoorum_debates d
      JOIN public.rounds r ON r.debate_id = d.id
      WHERE r.id = opinions.round_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Experts viewable by debate owner"
  ON public.experts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quoorum_debates
      WHERE id = experts.debate_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Votes viewable by debate owner"
  ON public.votes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quoorum_debates d
      JOIN public.rounds r ON r.debate_id = d.id
      WHERE r.id = votes.round_id AND d.user_id = auth.uid()
    )
  );

-- ============================================
-- FORUM MESSAGES & SESSIONS
-- ============================================
CREATE POLICY "Forum messages viewable by session owner"
  ON public.quoorum_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quoorum_sessions
      WHERE id = quoorum_messages.session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Forum messages insertable by session owner"
  ON public.quoorum_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quoorum_sessions
      WHERE id = quoorum_messages.session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Forum sessions viewable by owner"
  ON public.quoorum_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Forum sessions manageable by owner"
  ON public.quoorum_sessions
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Forum context sources viewable by session owner"
  ON public.quoorum_context_sources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quoorum_sessions
      WHERE id = quoorum_context_sources.session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Forum context sources manageable by session owner"
  ON public.quoorum_context_sources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quoorum_sessions
      WHERE id = quoorum_context_sources.session_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- FORUM CONSULTATIONS
-- ============================================
CREATE POLICY "Forum consultations viewable by owner"
  ON public.quoorum_consultations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Forum consultations manageable by owner"
  ON public.quoorum_consultations
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- FORUM CUSTOM EXPERTS
-- ============================================
CREATE POLICY "Custom experts viewable by owner"
  ON public.quoorum_custom_experts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Custom experts manageable by owner"
  ON public.quoorum_custom_experts
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- FORUM DEAL LINKS & RECOMMENDATIONS
-- ============================================
CREATE POLICY "Deal links viewable by debate owner"
  ON public.quoorum_deal_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quoorum_debates
      WHERE id = quoorum_deal_links.debate_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Deal links manageable by debate owner"
  ON public.quoorum_deal_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quoorum_debates
      WHERE id = quoorum_deal_links.debate_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Deal recommendations viewable by deal owner"
  ON public.quoorum_deal_recommendations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deals
      WHERE id = quoorum_deal_recommendations.deal_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- FORUM DEBATE INTERACTIONS
-- ============================================
CREATE POLICY "Debate comments viewable by all authenticated users"
  ON public.quoorum_debate_comments
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Debate comments insertable by owner"
  ON public.quoorum_debate_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Debate comments deletable by owner"
  ON public.quoorum_debate_comments
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Debate likes viewable by all authenticated users"
  ON public.quoorum_debate_likes
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Debate likes manageable by owner"
  ON public.quoorum_debate_likes
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- FORUM TEMPLATES (Public read)
-- ============================================
CREATE POLICY "Debate templates viewable by all"
  ON public.quoorum_debate_templates
  FOR SELECT
  USING (true);

-- ============================================
-- FORUM EXPERT FEEDBACK & PERFORMANCE
-- ============================================
CREATE POLICY "Expert feedback viewable by owner"
  ON public.quoorum_expert_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Expert feedback insertable by owner"
  ON public.quoorum_expert_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Expert performance viewable by all authenticated"
  ON public.quoorum_expert_performance
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Expert ratings viewable by all authenticated"
  ON public.quoorum_expert_ratings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- FORUM NOTIFICATIONS
-- ============================================
CREATE POLICY "Notification preferences viewable by owner"
  ON public.quoorum_notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Notification preferences manageable by owner"
  ON public.quoorum_notification_preferences
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Notifications viewable by recipient"
  ON public.quoorum_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Notifications updatable by recipient"
  ON public.quoorum_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- FORUM REPORTS & SCHEDULED REPORTS
-- ============================================
CREATE POLICY "Reports viewable by owner"
  ON public.quoorum_reports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Reports manageable by owner"
  ON public.quoorum_reports
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Scheduled reports viewable by owner"
  ON public.quoorum_scheduled_reports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Scheduled reports manageable by owner"
  ON public.quoorum_scheduled_reports
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- FORUM TRANSLATIONS (Public read)
-- ============================================
CREATE POLICY "Translations viewable by all"
  ON public.quoorum_translations
  FOR SELECT
  USING (true);

-- ============================================
-- FORUM WEBHOOKS & LOGS
-- ============================================
CREATE POLICY "Webhooks viewable by owner"
  ON public.quoorum_webhooks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Webhooks manageable by owner"
  ON public.quoorum_webhooks
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Webhook logs viewable by webhook owner"
  ON public.quoorum_webhook_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quoorum_webhooks
      WHERE id = quoorum_webhook_logs.webhook_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- FORUM API KEYS
-- ============================================
CREATE POLICY "Forum API keys viewable by owner"
  ON public.quoorum_api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Forum API keys manageable by owner"
  ON public.quoorum_api_keys
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
-- Migration completed successfully
-- All tables now have RLS enabled with appropriate policies
