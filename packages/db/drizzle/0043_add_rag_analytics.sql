-- Migration: Add RAG Analytics & Quality Scoring System
-- Purpose: Track RAG usage, measure impact, and calculate ROI

-- ============================================================================
-- RAG USAGE ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS rag_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Event tracking
  event_type VARCHAR(50) NOT NULL, -- 'document_upload', 'search', 'debate_injection', 'manual_search'

  -- Context
  debate_id UUID REFERENCES quoorum_debates(id) ON DELETE CASCADE,
  document_id UUID REFERENCES vector_documents(id) ON DELETE SET NULL,

  -- Performance metrics
  query_text TEXT,
  results_count INTEGER,
  avg_similarity REAL,
  search_duration_ms INTEGER,

  -- Cost tracking
  tokens_used INTEGER DEFAULT 0,
  estimated_cost REAL DEFAULT 0,

  -- Quality metrics
  user_clicked_result BOOLEAN DEFAULT false,
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rag_analytics_user ON rag_usage_analytics(user_id);
CREATE INDEX idx_rag_analytics_company ON rag_usage_analytics(company_id);
CREATE INDEX idx_rag_analytics_debate ON rag_usage_analytics(debate_id);
CREATE INDEX idx_rag_analytics_event ON rag_usage_analytics(event_type);
CREATE INDEX idx_rag_analytics_created ON rag_usage_analytics(created_at);

-- ============================================================================
-- RAG QUALITY SCORES
-- ============================================================================

CREATE TABLE IF NOT EXISTS rag_quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id UUID NOT NULL REFERENCES quoorum_debates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Quality metrics (calculated post-debate)
  relevance_score REAL CHECK (relevance_score BETWEEN 0 AND 1), -- How relevant was RAG context
  usage_score REAL CHECK (usage_score BETWEEN 0 AND 1),        -- How much was RAG context used
  impact_score REAL CHECK (impact_score BETWEEN 0 AND 1),      -- Did RAG improve outcome
  overall_score REAL CHECK (overall_score BETWEEN 0 AND 1),    -- Weighted average

  -- Evidence
  sources_used INTEGER DEFAULT 0,
  sources_cited INTEGER DEFAULT 0,
  debate_quality_delta REAL, -- Difference in debate quality with/without RAG

  -- User feedback
  user_satisfaction INTEGER CHECK (user_satisfaction BETWEEN 1 AND 5),
  user_found_helpful BOOLEAN,
  user_comments TEXT,

  -- Metadata
  calculation_method VARCHAR(50) DEFAULT 'auto', -- 'auto', 'manual', 'ml_model'
  calculated_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rag_quality_debate ON rag_quality_scores(debate_id);
CREATE INDEX idx_rag_quality_user ON rag_quality_scores(user_id);
CREATE INDEX idx_rag_quality_overall ON rag_quality_scores(overall_score);

-- ============================================================================
-- RAG DOCUMENT PERFORMANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rag_document_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES vector_documents(id) ON DELETE CASCADE,

  -- Usage statistics
  total_searches INTEGER DEFAULT 0,
  total_retrievals INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_citations INTEGER DEFAULT 0,

  -- Performance metrics
  avg_similarity REAL,
  avg_rank REAL,
  click_through_rate REAL,

  -- Time-based metrics
  last_used_at TIMESTAMP,
  usage_trend VARCHAR(20), -- 'increasing', 'stable', 'decreasing'

  -- Quality indicators
  avg_user_rating REAL,
  total_ratings INTEGER DEFAULT 0,

  -- Computed fields
  relevance_score REAL, -- Composite score
  popularity_score REAL, -- How often it's retrieved

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rag_doc_perf_document ON rag_document_performance(document_id);
CREATE INDEX idx_rag_doc_perf_relevance ON rag_document_performance(relevance_score);
CREATE INDEX idx_rag_doc_perf_last_used ON rag_document_performance(last_used_at);

-- ============================================================================
-- RAG TEAM SHARING
-- ============================================================================

CREATE TABLE IF NOT EXISTS rag_document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES vector_documents(id) ON DELETE CASCADE,

  -- Sharing context
  shared_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shared_with_user UUID REFERENCES profiles(id) ON DELETE CASCADE,
  shared_with_company UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Permissions
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  can_reshare BOOLEAN DEFAULT false,

  -- Tracking
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP,

  -- Metadata
  share_note TEXT,
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rag_shares_document ON rag_document_shares(document_id);
CREATE INDEX idx_rag_shares_user ON rag_document_shares(shared_with_user);
CREATE INDEX idx_rag_shares_company ON rag_document_shares(shared_with_company);

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- Daily RAG usage stats
CREATE OR REPLACE VIEW rag_daily_stats AS
SELECT
  DATE(created_at) as date,
  user_id,
  company_id,
  event_type,
  COUNT(*) as event_count,
  AVG(avg_similarity) as avg_similarity,
  AVG(search_duration_ms) as avg_duration_ms,
  SUM(tokens_used) as total_tokens,
  SUM(estimated_cost) as total_cost
FROM rag_usage_analytics
GROUP BY DATE(created_at), user_id, company_id, event_type;

-- Document performance summary
CREATE OR REPLACE VIEW rag_top_documents AS
SELECT
  vd.id,
  vd.file_name,
  vd.file_type,
  vd.user_id,
  rdp.total_retrievals,
  rdp.avg_similarity,
  rdp.relevance_score,
  rdp.last_used_at
FROM vector_documents vd
LEFT JOIN rag_document_performance rdp ON rdp.document_id = vd.id
ORDER BY rdp.relevance_score DESC NULLS LAST;

-- User RAG ROI summary
CREATE OR REPLACE VIEW rag_user_roi AS
SELECT
  u.id as user_id,
  u.email,
  COUNT(DISTINCT vd.id) as documents_uploaded,
  COUNT(DISTINCT rua.debate_id) as debates_enhanced,
  AVG(rqs.overall_score) as avg_quality_score,
  AVG(rqs.user_satisfaction) as avg_satisfaction,
  SUM(rua.tokens_used) as total_tokens_used,
  SUM(rua.estimated_cost) as total_cost
FROM profiles u
LEFT JOIN vector_documents vd ON vd.user_id = u.id
LEFT JOIN rag_usage_analytics rua ON rua.user_id = u.id
LEFT JOIN rag_quality_scores rqs ON rqs.user_id = u.id
GROUP BY u.id, u.email;

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATES
-- ============================================================================

-- Update document performance on usage
CREATE OR REPLACE FUNCTION update_rag_document_performance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO rag_document_performance (document_id, total_searches, last_used_at)
  VALUES (NEW.document_id, 1, NOW())
  ON CONFLICT (document_id) DO UPDATE SET
    total_searches = rag_document_performance.total_searches + 1,
    last_used_at = NOW(),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_doc_performance
AFTER INSERT ON rag_usage_analytics
FOR EACH ROW
WHEN (NEW.event_type = 'search' AND NEW.document_id IS NOT NULL)
EXECUTE FUNCTION update_rag_document_performance();
