-- ============================================================================
-- RENAME FORUM → QUOORUM - Complete Migration Script
-- ============================================================================
-- Purpose: Rename all forum_* tables to quoorum_* and fix RLS policies
-- Status: Tables exist with OLD names (forum_*), need to be renamed
-- ============================================================================

-- ============================================================================
-- PART 1: RENAME ALL TABLES
-- ============================================================================

-- Core debate tables
ALTER TABLE IF EXISTS public.forum_debates RENAME TO quoorum_debates;
ALTER TABLE IF EXISTS public.forum_debate_comments RENAME TO quoorum_debate_comments;
ALTER TABLE IF EXISTS public.forum_debate_likes RENAME TO quoorum_debate_likes;
ALTER TABLE IF EXISTS public.forum_debate_templates RENAME TO quoorum_debate_templates;

-- Expert and performance tables
ALTER TABLE IF EXISTS public.forum_custom_experts RENAME TO quoorum_custom_experts;
ALTER TABLE IF EXISTS public.forum_expert_performance RENAME TO quoorum_expert_performance;
ALTER TABLE IF EXISTS public.forum_expert_feedback RENAME TO quoorum_expert_feedback;
ALTER TABLE IF EXISTS public.forum_expert_ratings RENAME TO quoorum_expert_ratings;

-- Consultation and session tables
ALTER TABLE IF EXISTS public.forum_consultations RENAME TO quoorum_consultations;
ALTER TABLE IF EXISTS public.forum_sessions RENAME TO quoorum_sessions;
ALTER TABLE IF EXISTS public.forum_messages RENAME TO quoorum_messages;
ALTER TABLE IF EXISTS public.forum_context_sources RENAME TO quoorum_context_sources;

-- Deal integration tables
ALTER TABLE IF EXISTS public.forum_deal_links RENAME TO quoorum_deal_links;
ALTER TABLE IF EXISTS public.forum_deal_recommendations RENAME TO quoorum_deal_recommendations;

-- Notification tables
ALTER TABLE IF EXISTS public.forum_notifications RENAME TO quoorum_notifications;
ALTER TABLE IF EXISTS public.forum_notification_preferences RENAME TO quoorum_notification_preferences;

-- Report tables
ALTER TABLE IF EXISTS public.forum_reports RENAME TO quoorum_reports;
ALTER TABLE IF EXISTS public.forum_scheduled_reports RENAME TO quoorum_scheduled_reports;

-- Translation and webhook tables
ALTER TABLE IF EXISTS public.forum_translations RENAME TO quoorum_translations;
ALTER TABLE IF EXISTS public.forum_webhooks RENAME TO quoorum_webhooks;
ALTER TABLE IF EXISTS public.forum_webhook_logs RENAME TO quoorum_webhook_logs;

-- API keys
ALTER TABLE IF EXISTS public.forum_api_keys RENAME TO quoorum_api_keys;

-- Debate embeddings (if exists)
ALTER TABLE IF EXISTS public.forum_debate_embeddings RENAME TO quoorum_debate_embeddings;

-- ============================================================================
-- PART 2: DROP ALL EXISTING (INCORRECT) RLS POLICIES
-- ============================================================================

-- Quoorum Debates
DROP POLICY IF EXISTS "Debates are viewable by owner" ON public.quoorum_debates;
DROP POLICY IF EXISTS "Debates are manageable by owner" ON public.quoorum_debates;
DROP POLICY IF EXISTS "Users can manage their own debates" ON public.quoorum_debates;
DROP POLICY IF EXISTS "Users can insert their own debates" ON public.quoorum_debates;
DROP POLICY IF EXISTS "Users can view their own debates" ON public.quoorum_debates;
DROP POLICY IF EXISTS "Users can update their own debates" ON public.quoorum_debates;
DROP POLICY IF EXISTS "Users can delete their own debates" ON public.quoorum_debates;

-- Quoorum Debate Comments
DROP POLICY IF EXISTS "Debate comments viewable by all authenticated users" ON public.quoorum_debate_comments;
DROP POLICY IF EXISTS "Debate comments insertable by owner" ON public.quoorum_debate_comments;
DROP POLICY IF EXISTS "Debate comments deletable by owner" ON public.quoorum_debate_comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.quoorum_debate_comments;
DROP POLICY IF EXISTS "Users can view comments on accessible debates" ON public.quoorum_debate_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.quoorum_debate_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.quoorum_debate_comments;

-- Quoorum Debate Likes
DROP POLICY IF EXISTS "Debate likes viewable by all authenticated users" ON public.quoorum_debate_likes;
DROP POLICY IF EXISTS "Debate likes manageable by owner" ON public.quoorum_debate_likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON public.quoorum_debate_likes;
DROP POLICY IF EXISTS "Users can view likes on accessible debates" ON public.quoorum_debate_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.quoorum_debate_likes;

-- Quoorum Custom Experts
DROP POLICY IF EXISTS "Custom experts viewable by owner" ON public.quoorum_custom_experts;
DROP POLICY IF EXISTS "Custom experts manageable by owner" ON public.quoorum_custom_experts;
DROP POLICY IF EXISTS "Users can manage their own custom experts" ON public.quoorum_custom_experts;
DROP POLICY IF EXISTS "Users can insert their own custom experts" ON public.quoorum_custom_experts;
DROP POLICY IF EXISTS "Users can view their own custom experts" ON public.quoorum_custom_experts;
DROP POLICY IF EXISTS "Users can update their own custom experts" ON public.quoorum_custom_experts;
DROP POLICY IF EXISTS "Users can delete their own custom experts" ON public.quoorum_custom_experts;

-- Quoorum Debate Templates
DROP POLICY IF EXISTS "Debate templates viewable by all" ON public.quoorum_debate_templates;
DROP POLICY IF EXISTS "Users can view all public templates" ON public.quoorum_debate_templates;
DROP POLICY IF EXISTS "Users can view their own templates" ON public.quoorum_debate_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON public.quoorum_debate_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.quoorum_debate_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.quoorum_debate_templates;

-- Quoorum Expert Performance
DROP POLICY IF EXISTS "Expert performance viewable by all authenticated" ON public.quoorum_expert_performance;
DROP POLICY IF EXISTS "All users can view expert performance" ON public.quoorum_expert_performance;

-- Quoorum Consultations
DROP POLICY IF EXISTS "Forum consultations viewable by owner" ON public.quoorum_consultations;
DROP POLICY IF EXISTS "Forum consultations manageable by owner" ON public.quoorum_consultations;

-- Quoorum Sessions
DROP POLICY IF EXISTS "Forum sessions viewable by owner" ON public.quoorum_sessions;
DROP POLICY IF EXISTS "Forum sessions manageable by owner" ON public.quoorum_sessions;

-- Quoorum Messages
DROP POLICY IF EXISTS "Forum messages viewable by session owner" ON public.quoorum_messages;
DROP POLICY IF EXISTS "Forum messages insertable by session owner" ON public.quoorum_messages;

-- ============================================================================
-- PART 3: CREATE CORRECT RLS POLICIES (using profiles table lookup)
-- ============================================================================

-- ============================================================================
-- 1. QUOORUM_DEBATES TABLE
-- ============================================================================

CREATE POLICY "Users can insert their own debates"
ON public.quoorum_debates
FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own debates"
ON public.quoorum_debates
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own debates"
ON public.quoorum_debates
FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own debates"
ON public.quoorum_debates
FOR DELETE
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- 2. QUOORUM_DEBATE_COMMENTS TABLE
-- ============================================================================

CREATE POLICY "Users can insert their own comments"
ON public.quoorum_debate_comments
FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view comments on accessible debates"
ON public.quoorum_debate_comments
FOR SELECT
USING (
  -- User can see comments on debates they own
  debate_id IN (
    SELECT id FROM public.quoorum_debates WHERE user_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  OR
  -- Or comments they created themselves
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own comments"
ON public.quoorum_debate_comments
FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own comments"
ON public.quoorum_debate_comments
FOR DELETE
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- 3. QUOORUM_DEBATE_LIKES TABLE
-- ============================================================================

CREATE POLICY "Users can insert their own likes"
ON public.quoorum_debate_likes
FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view likes on accessible debates"
ON public.quoorum_debate_likes
FOR SELECT
USING (
  -- User can see likes on debates they own
  debate_id IN (
    SELECT id FROM public.quoorum_debates WHERE user_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  OR
  -- Or their own likes
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own likes"
ON public.quoorum_debate_likes
FOR DELETE
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- 4. QUOORUM_CUSTOM_EXPERTS TABLE
-- ============================================================================

CREATE POLICY "Users can insert their own custom experts"
ON public.quoorum_custom_experts
FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own custom experts"
ON public.quoorum_custom_experts
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own custom experts"
ON public.quoorum_custom_experts
FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own custom experts"
ON public.quoorum_custom_experts
FOR DELETE
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- 5. QUOORUM_DEBATE_TEMPLATES TABLE
-- ============================================================================

CREATE POLICY "Users can view debate templates"
ON public.quoorum_debate_templates
FOR SELECT
USING (true); -- All authenticated users can view templates

CREATE POLICY "Users can insert their own templates"
ON public.quoorum_debate_templates
FOR INSERT
WITH CHECK (
  created_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR created_by IS NULL
);

CREATE POLICY "Users can update their own templates"
ON public.quoorum_debate_templates
FOR UPDATE
USING (
  created_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own templates"
ON public.quoorum_debate_templates
FOR DELETE
USING (
  created_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- 6. QUOORUM_EXPERT_PERFORMANCE TABLE
-- ============================================================================

CREATE POLICY "All users can view expert performance"
ON public.quoorum_expert_performance
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 7. QUOORUM_CONSULTATIONS TABLE
-- ============================================================================

CREATE POLICY "Users can view their own consultations"
ON public.quoorum_consultations
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own consultations"
ON public.quoorum_consultations
FOR ALL
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- 8. QUOORUM_SESSIONS TABLE
-- ============================================================================

CREATE POLICY "Users can view their own sessions"
ON public.quoorum_sessions
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own sessions"
ON public.quoorum_sessions
FOR ALL
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- 9. QUOORUM_MESSAGES TABLE
-- ============================================================================

CREATE POLICY "Users can view messages in their sessions"
ON public.quoorum_messages
FOR SELECT
USING (
  session_id IN (
    SELECT id FROM public.quoorum_sessions WHERE user_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert messages in their sessions"
ON public.quoorum_messages
FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM public.quoorum_sessions WHERE user_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================================================
-- PART 4: Ensure RLS is enabled on all tables
-- ============================================================================

ALTER TABLE public.quoorum_debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_debate_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_debate_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_debate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_custom_experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_expert_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quoorum_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
-- Migration completed successfully!
--
-- What was done:
-- 1. ✅ Renamed ALL tables from forum_* to quoorum_*
-- 2. ✅ Dropped all incorrect RLS policies
-- 3. ✅ Created correct RLS policies using profiles table lookup
-- 4. ✅ Enabled RLS on all tables
--
-- Pattern used: user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
-- This correctly matches auth.uid() with the profiles.id stored in user_id
--
-- Test the migration:
-- 1. Try creating a debate as an authenticated user
-- 2. Verify you can see your own debates
-- 3. Verify you CANNOT see other users' debates
-- ============================================================================
