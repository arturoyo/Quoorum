-- Migration: Add comprehensive AI cost tracking
-- Created: 2026-01-28
-- Purpose: Track ALL AI costs including context assessment, auto-research, and hidden operations

-- ============================================================================
-- AI COST TRACKING TABLE
-- ============================================================================
-- Tracks every single AI API call with detailed cost breakdown
CREATE TABLE IF NOT EXISTS ai_cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  user_id UUID NOT NULL, -- Who triggered this AI call
  debate_id UUID, -- If part of a debate (nullable for non-debate operations)
  operation_type VARCHAR(100) NOT NULL, -- 'context_assessment', 'auto_research_analysis', 'auto_research_queries', 'memorable_summary', 'debate_phase_estrategia', etc.

  -- AI Provider Details
  provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'google', 'groq', 'deepseek'
  model_id VARCHAR(100) NOT NULL, -- 'gpt-4o-mini', 'gemini-2.0-flash-exp', etc.

  -- Token Usage
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,

  -- Cost Breakdown
  cost_usd_prompt DECIMAL(12, 8) NOT NULL DEFAULT 0, -- Cost of prompt tokens
  cost_usd_completion DECIMAL(12, 8) NOT NULL DEFAULT 0, -- Cost of completion tokens
  cost_usd_total DECIMAL(12, 8) NOT NULL DEFAULT 0, -- Total cost
  is_free_tier BOOLEAN NOT NULL DEFAULT FALSE, -- If using free tier (Gemini free, etc.)

  -- Performance Metrics
  latency_ms INTEGER, -- Response time in milliseconds
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT, -- If failed

  -- Context
  input_summary VARCHAR(500), -- Brief description of input (first 500 chars)
  output_summary VARCHAR(500), -- Brief description of output
  metadata JSONB, -- Additional context (phase, round, etc.)

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Indexes for fast queries
  CONSTRAINT ai_cost_tracking_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT ai_cost_tracking_debate_id_fk FOREIGN KEY (debate_id) REFERENCES debates(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX idx_ai_cost_tracking_user_id ON ai_cost_tracking(user_id);
CREATE INDEX idx_ai_cost_tracking_debate_id ON ai_cost_tracking(debate_id) WHERE debate_id IS NOT NULL;
CREATE INDEX idx_ai_cost_tracking_operation_type ON ai_cost_tracking(operation_type);
CREATE INDEX idx_ai_cost_tracking_provider ON ai_cost_tracking(provider);
CREATE INDEX idx_ai_cost_tracking_created_at ON ai_cost_tracking(created_at DESC);
CREATE INDEX idx_ai_cost_tracking_is_free_tier ON ai_cost_tracking(is_free_tier);

-- Composite index for cost analysis
CREATE INDEX idx_ai_cost_tracking_analysis ON ai_cost_tracking(user_id, created_at DESC, operation_type);

-- ============================================================================
-- AI COST SUMMARY MATERIALIZED VIEW
-- ============================================================================
-- Aggregated view for fast dashboard queries
CREATE MATERIALIZED VIEW ai_cost_summary AS
SELECT
  user_id,
  operation_type,
  provider,
  model_id,
  DATE_TRUNC('day', created_at) AS date,
  COUNT(*) AS request_count,
  SUM(prompt_tokens) AS total_prompt_tokens,
  SUM(completion_tokens) AS total_completion_tokens,
  SUM(total_tokens) AS total_tokens,
  SUM(cost_usd_total) AS total_cost_usd,
  SUM(CASE WHEN is_free_tier THEN 1 ELSE 0 END) AS free_tier_count,
  SUM(CASE WHEN NOT is_free_tier THEN 1 ELSE 0 END) AS paid_tier_count,
  AVG(latency_ms) AS avg_latency_ms,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) AS success_count,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) AS error_count
FROM ai_cost_tracking
GROUP BY user_id, operation_type, provider, model_id, DATE_TRUNC('day', created_at);

-- Index on materialized view for fast lookups
CREATE INDEX idx_ai_cost_summary_user_date ON ai_cost_summary(user_id, date DESC);
CREATE INDEX idx_ai_cost_summary_operation ON ai_cost_summary(operation_type, date DESC);

-- Refresh function (call periodically)
CREATE OR REPLACE FUNCTION refresh_ai_cost_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY ai_cost_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE ai_cost_tracking IS 'Comprehensive tracking of ALL AI API calls including free tier usage';
COMMENT ON COLUMN ai_cost_tracking.operation_type IS 'Type of operation: context_assessment, auto_research_analysis, auto_research_queries, memorable_summary, debate_phase_estrategia, debate_phase_expertos, debate_phase_revision, debate_phase_sintesis';
COMMENT ON COLUMN ai_cost_tracking.is_free_tier IS 'TRUE if using free tier (Gemini free, etc.) - important for quota tracking';
COMMENT ON COLUMN ai_cost_tracking.cost_usd_total IS 'Total cost in USD - 0 for free tier but tokens are still tracked';
COMMENT ON MATERIALIZED VIEW ai_cost_summary IS 'Aggregated AI cost metrics for fast dashboard queries - refresh periodically';
