-- Migration: Enable Row Level Security (RLS) - BASED ON REAL SCHEMA
-- Generated: 2025-01-13
-- Purpose: Fix Supabase linter security warnings

-- ============================================
-- STEP 1: Enable RLS on all tables
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliberations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consensus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opinions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
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

-- USERS: Can view and update own data
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- PROFILES: User-owned
CREATE POLICY "Profiles viewable by owner" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Profiles updatable by owner" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Profiles insertable by owner" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CLIENTS: No user_id column - allow authenticated users (service manages access)
CREATE POLICY "Clients viewable by authenticated" ON public.clients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Clients manageable by authenticated" ON public.clients FOR ALL USING (auth.uid() IS NOT NULL);

-- CONVERSATIONS: Related to clients, authenticated access
CREATE POLICY "Conversations viewable by authenticated" ON public.conversations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Conversations manageable by authenticated" ON public.conversations FOR ALL USING (auth.uid() IS NOT NULL);

-- DEALS: User-owned
CREATE POLICY "Deals viewable by owner" ON public.deals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Deals manageable by owner" ON public.deals FOR ALL USING (auth.uid() = user_id);

-- SUBSCRIPTIONS: User-owned
CREATE POLICY "Subscriptions viewable by owner" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Subscriptions insertable by owner" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PLANS: Public read
CREATE POLICY "Plans viewable by everyone" ON public.plans FOR SELECT USING (true);

-- USAGE: User-owned
CREATE POLICY "Usage viewable by owner" ON public.usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usage insertable by owner" ON public.usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ADMIN_USERS: Admin only
CREATE POLICY "Admin users - admin only" ON public.admin_users FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- ADMIN_ROLES: Admin only
CREATE POLICY "Admin roles - admin only" ON public.admin_roles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- API_KEYS: User-owned
CREATE POLICY "API keys viewable by owner" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "API keys manageable by owner" ON public.api_keys FOR ALL USING (auth.uid() = user_id);

-- AUDIT_LOGS: User can view own logs
CREATE POLICY "Audit logs viewable by owner" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);

-- DELIBERATIONS: Created by user
CREATE POLICY "Deliberations viewable by creator" ON public.deliberations FOR SELECT USING (auth.uid() = created_by_id);
CREATE POLICY "Deliberations manageable by creator" ON public.deliberations FOR ALL USING (auth.uid() = created_by_id);

-- ROUNDS: Related to deliberations
CREATE POLICY "Rounds viewable by deliberation creator" ON public.rounds FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.deliberations WHERE id = rounds.deliberation_id AND created_by_id = auth.uid())
);

-- OPINIONS: Related to rounds -> deliberations
CREATE POLICY "Opinions viewable by deliberation creator" ON public.opinions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.deliberations d
    JOIN public.rounds r ON r.deliberation_id = d.id
    WHERE r.id = opinions.round_id AND d.created_by_id = auth.uid()
  )
);

-- VOTES: Related to rounds -> deliberations
CREATE POLICY "Votes viewable by deliberation creator" ON public.votes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.deliberations d
    JOIN public.rounds r ON r.deliberation_id = d.id
    WHERE r.id = votes.round_id AND d.created_by_id = auth.uid()
  )
);

-- CONSENSUS: Related to deliberations
CREATE POLICY "Consensus viewable by deliberation creator" ON public.consensus FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.deliberations WHERE id = consensus.deliberation_id AND created_by_id = auth.uid())
);

-- EXPERTS: Global table, authenticated users can view
CREATE POLICY "Experts viewable by authenticated" ON public.experts FOR SELECT USING (auth.uid() IS NOT NULL);

-- FORUM_DEBATES: User-owned
CREATE POLICY "Forum debates viewable by owner" ON public.quoorum_debates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Forum debates manageable by owner" ON public.quoorum_debates FOR ALL USING (auth.uid() = user_id);

-- FORUM_SESSIONS: User-owned
CREATE POLICY "Forum sessions viewable by owner" ON public.quoorum_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Forum sessions manageable by owner" ON public.quoorum_sessions FOR ALL USING (auth.uid() = user_id);

-- FORUM_MESSAGES: Related to sessions
CREATE POLICY "Forum messages viewable by session owner" ON public.quoorum_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.quoorum_sessions WHERE id = quoorum_messages.session_id AND user_id = auth.uid())
);
CREATE POLICY "Forum messages insertable by session owner" ON public.quoorum_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.quoorum_sessions WHERE id = quoorum_messages.session_id AND user_id = auth.uid())
);

-- FORUM_CONTEXT_SOURCES: Related to sessions
CREATE POLICY "Forum context sources viewable by session owner" ON public.quoorum_context_sources FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.quoorum_sessions WHERE id = quoorum_context_sources.session_id AND user_id = auth.uid())
);
CREATE POLICY "Forum context sources manageable by session owner" ON public.quoorum_context_sources FOR ALL USING (
  EXISTS (SELECT 1 FROM public.quoorum_sessions WHERE id = quoorum_context_sources.session_id AND user_id = auth.uid())
);

-- FORUM_CONSULTATIONS: User-owned
CREATE POLICY "Forum consultations viewable by owner" ON public.quoorum_consultations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Forum consultations manageable by owner" ON public.quoorum_consultations FOR ALL USING (auth.uid() = user_id);

-- FORUM_CUSTOM_EXPERTS: User-owned
CREATE POLICY "Custom experts viewable by owner" ON public.quoorum_custom_experts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Custom experts manageable by owner" ON public.quoorum_custom_experts FOR ALL USING (auth.uid() = user_id);

-- FORUM_DEAL_LINKS: User-owned
CREATE POLICY "Deal links viewable by owner" ON public.quoorum_deal_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Deal links manageable by owner" ON public.quoorum_deal_links FOR ALL USING (auth.uid() = user_id);

-- FORUM_DEAL_RECOMMENDATIONS: User-owned
CREATE POLICY "Deal recommendations viewable by owner" ON public.quoorum_deal_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Deal recommendations manageable by owner" ON public.quoorum_deal_recommendations FOR ALL USING (auth.uid() = user_id);

-- FORUM_DEBATE_COMMENTS: Public read, owner write
CREATE POLICY "Debate comments viewable by authenticated" ON public.quoorum_debate_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Debate comments insertable by owner" ON public.quoorum_debate_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Debate comments deletable by owner" ON public.quoorum_debate_comments FOR DELETE USING (auth.uid() = user_id);

-- FORUM_DEBATE_LIKES: Public read, owner manage
CREATE POLICY "Debate likes viewable by authenticated" ON public.quoorum_debate_likes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Debate likes manageable by owner" ON public.quoorum_debate_likes FOR ALL USING (auth.uid() = user_id);

-- FORUM_DEBATE_TEMPLATES: Public read
CREATE POLICY "Debate templates viewable by all" ON public.quoorum_debate_templates FOR SELECT USING (true);

-- FORUM_EXPERT_FEEDBACK: User-owned
CREATE POLICY "Expert feedback viewable by owner" ON public.quoorum_expert_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Expert feedback insertable by owner" ON public.quoorum_expert_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- FORUM_EXPERT_PERFORMANCE: Public stats
CREATE POLICY "Expert performance viewable by authenticated" ON public.quoorum_expert_performance FOR SELECT USING (auth.uid() IS NOT NULL);

-- FORUM_EXPERT_RATINGS: Public stats
CREATE POLICY "Expert ratings viewable by authenticated" ON public.quoorum_expert_ratings FOR SELECT USING (auth.uid() IS NOT NULL);

-- FORUM_NOTIFICATION_PREFERENCES: User-owned
CREATE POLICY "Notification preferences viewable by owner" ON public.quoorum_notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Notification preferences manageable by owner" ON public.quoorum_notification_preferences FOR ALL USING (auth.uid() = user_id);

-- FORUM_NOTIFICATIONS: User-owned
CREATE POLICY "Notifications viewable by recipient" ON public.quoorum_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Notifications updatable by recipient" ON public.quoorum_notifications FOR UPDATE USING (auth.uid() = user_id);

-- FORUM_REPORTS: User-owned
CREATE POLICY "Reports viewable by owner" ON public.quoorum_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Reports manageable by owner" ON public.quoorum_reports FOR ALL USING (auth.uid() = user_id);

-- FORUM_SCHEDULED_REPORTS: User-owned
CREATE POLICY "Scheduled reports viewable by owner" ON public.quoorum_scheduled_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Scheduled reports manageable by owner" ON public.quoorum_scheduled_reports FOR ALL USING (auth.uid() = user_id);

-- FORUM_TRANSLATIONS: Related to messages, authenticated access
CREATE POLICY "Translations viewable by authenticated" ON public.quoorum_translations FOR SELECT USING (auth.uid() IS NOT NULL);

-- FORUM_WEBHOOKS: User-owned
CREATE POLICY "Webhooks viewable by owner" ON public.quoorum_webhooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Webhooks manageable by owner" ON public.quoorum_webhooks FOR ALL USING (auth.uid() = user_id);

-- FORUM_WEBHOOK_LOGS: Related to webhooks
CREATE POLICY "Webhook logs viewable by webhook owner" ON public.quoorum_webhook_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.quoorum_webhooks WHERE id = quoorum_webhook_logs.webhook_id AND user_id = auth.uid())
);

-- FORUM_API_KEYS: User-owned
CREATE POLICY "Forum API keys viewable by owner" ON public.quoorum_api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Forum API keys manageable by owner" ON public.quoorum_api_keys FOR ALL USING (auth.uid() = user_id);

-- Migration completed successfully
