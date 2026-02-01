-- Migration: Unified Strategic Intelligence Profiles
-- Purpose: Single source of truth for all profiles (Experts, Professionals, Roles, ICP, Buyer Personas)
-- Architecture: Hybrid model with type-safe core + flexible JSONB for type-specific attributes

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE profile_type AS ENUM (
  'expert',           -- AI Expert (debate participant)
  'professional',     -- AI Professional/Worker (specialized agent)
  'role',             -- Strategic Role (decision-maker archetype)
  'icp',              -- Ideal Customer Profile (company profile)
  'buyer_persona'     -- Buyer Persona (individual decision-maker)
);

CREATE TYPE tone_style AS ENUM (
  'analytical',       -- Data-driven, logical
  'skeptical',        -- Questioning, critical
  'optimistic',       -- Positive, opportunity-focused
  'pragmatic',        -- Practical, realistic
  'visionary',        -- Future-focused, strategic
  'direct',           -- Straightforward, clear
  'empathetic',       -- Understanding, people-focused
  'assertive'         -- Confident, decisive
);

CREATE TYPE maturity_level AS ENUM (
  'startup',          -- Early stage, high uncertainty
  'growth',           -- Scaling, structured processes
  'enterprise',       -- Mature, complex governance
  'legacy'            -- Established, transformation-focused
);

-- ============================================================================
-- STRATEGIC PROFILES (Core Unified Table)
-- ============================================================================

CREATE TABLE strategic_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ====================
  -- UNIVERSAL IDENTITY
  -- ====================
  type profile_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(500),                    -- Full professional title
  description TEXT,
  category VARCHAR(100),                 -- Main category/domain
  specialization VARCHAR(255),           -- Specific expertise area

  -- ====================
  -- BEHAVIORAL ATTRIBUTES
  -- ====================
  objective TEXT,                        -- Primary mission/goal
  tone_styles tone_style[] DEFAULT '{}', -- Communication styles
  autonomy_level INTEGER CHECK (autonomy_level BETWEEN 1 AND 10) DEFAULT 5,
  behavior_rules TEXT,                   -- Do's and Don'ts

  -- ====================
  -- KNOWLEDGE & EXPERTISE
  -- ====================
  expertise_areas TEXT[],                -- Areas of deep knowledge
  industries TEXT[],                     -- Industry focus
  maturity_level maturity_level,

  -- Cognitive Biases to Mitigate
  biases_to_mitigate TEXT[],            -- [Confirmation bias, Sunk cost fallacy, etc]

  -- Decision Style
  decision_style VARCHAR(50),            -- analytical, intuitive, collaborative, etc.

  -- Success Metrics
  success_metrics TEXT[],                -- How this profile measures success

  -- ====================
  -- TYPE-SPECIFIC ATTRIBUTES (JSONB for flexibility)
  -- ====================

  -- For AI Agents (experts, professionals, roles)
  ai_config JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "systemPrompt": "You are...",
  --   "model": "gpt-4-turbo",
  --   "temperature": 0.7,
  --   "maxTokens": 2000,
  --   "responseFormat": "structured"
  -- }

  -- For ICP (Ideal Customer Profile)
  firmographics JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "employeeCount": "500+",
  --   "revenue": "50M+",
  --   "techStack": ["Salesforce", "Slack"],
  --   "triggerEvents": ["Funding round", "M&A"],
  --   "governance": {"gdpr": true, "iso42001": true}
  -- }

  -- For Buyer Personas
  psychographics JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "jobsToBeDone": "Validate decisions without consultants",
  --   "motivations": ["Board recognition", "Risk mitigation"],
  --   "barriers": ["Data privacy", "Learning curve"],
  --   "channels": ["LinkedIn", "Gartner Reports"],
  --   "professionalProfile": {
  --     "role": "CSO",
  --     "yearsExperience": 15,
  --     "responsibilities": ["Strategic planning", "M&A"]
  --   }
  -- }

  -- ====================
  -- RELATIONSHIPS & CONTEXT
  -- ====================

  -- Parent-child relationships (e.g., ICP -> Buyer Personas)
  parent_profile_id UUID REFERENCES strategic_profiles(id) ON DELETE SET NULL,

  -- Related profiles (e.g., Role -> Compatible Experts)
  related_profile_ids UUID[],

  -- ====================
  -- MULTI-TENANT & OWNERSHIP
  -- ====================
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  is_global BOOLEAN DEFAULT false,       -- Available to all users
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- ====================
  -- USAGE & ANALYTICS
  -- ====================
  usage_count INTEGER DEFAULT 0,
  avg_rating REAL,
  last_used_at TIMESTAMP,

  -- ====================
  -- METADATA
  -- ====================
  tags TEXT[],
  version INTEGER DEFAULT 1,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_strategic_profiles_type ON strategic_profiles(type);
CREATE INDEX idx_strategic_profiles_slug ON strategic_profiles(slug);
CREATE INDEX idx_strategic_profiles_category ON strategic_profiles(category);
CREATE INDEX idx_strategic_profiles_user ON strategic_profiles(user_id);
CREATE INDEX idx_strategic_profiles_company ON strategic_profiles(company_id);
CREATE INDEX idx_strategic_profiles_global ON strategic_profiles(is_global) WHERE is_global = true;
CREATE INDEX idx_strategic_profiles_parent ON strategic_profiles(parent_profile_id);
CREATE INDEX idx_strategic_profiles_tags ON strategic_profiles USING GIN(tags);
CREATE INDEX idx_strategic_profiles_industries ON strategic_profiles USING GIN(industries);
CREATE INDEX idx_strategic_profiles_expertise ON strategic_profiles USING GIN(expertise_areas);

-- Full-text search
CREATE INDEX idx_strategic_profiles_search ON strategic_profiles
  USING GIN(to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(category, '')
  ));

-- ============================================================================
-- PROFILE <-> RAG DOCUMENTS (Rich Context)
-- ============================================================================

CREATE TYPE context_relevance AS ENUM (
  'core',             -- Essential knowledge base
  'supplementary',    -- Additional context
  'case_study',       -- Real-world examples
  'industry_data',    -- Market/industry information
  'compliance'        -- Legal/regulatory docs
);

CREATE TABLE profile_rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  profile_id UUID NOT NULL REFERENCES strategic_profiles(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES vector_documents(id) ON DELETE CASCADE,

  -- Context metadata
  relevance context_relevance NOT NULL DEFAULT 'supplementary',
  importance_score REAL CHECK (importance_score BETWEEN 0 AND 1) DEFAULT 0.5,

  -- Usage tracking
  times_retrieved INTEGER DEFAULT 0,
  last_retrieved_at TIMESTAMP,
  avg_similarity REAL,

  -- Metadata
  notes TEXT,
  added_by UUID REFERENCES profiles(id),
  added_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(profile_id, document_id)
);

CREATE INDEX idx_profile_rag_profile ON profile_rag_documents(profile_id);
CREATE INDEX idx_profile_rag_document ON profile_rag_documents(document_id);
CREATE INDEX idx_profile_rag_relevance ON profile_rag_documents(relevance);

-- ============================================================================
-- PROFILE VERSIONS (Audit Trail)
-- ============================================================================

CREATE TABLE strategic_profile_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES strategic_profiles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,

  -- Snapshot of profile at this version
  profile_data JSONB NOT NULL,

  -- Change tracking
  changed_by UUID REFERENCES profiles(id),
  change_reason TEXT,
  changed_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(profile_id, version)
);

CREATE INDEX idx_profile_versions_profile ON strategic_profile_versions(profile_id);
CREATE INDEX idx_profile_versions_changed_at ON strategic_profile_versions(changed_at);

-- ============================================================================
-- PROFILE RELATIONSHIPS (Advanced Connections)
-- ============================================================================

CREATE TYPE relationship_type AS ENUM (
  'compatible',       -- Works well together
  'complementary',    -- Fills gaps
  'prerequisite',     -- Must come before
  'alternative',      -- Can replace
  'context_for'       -- Provides context for
);

CREATE TABLE profile_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  from_profile_id UUID NOT NULL REFERENCES strategic_profiles(id) ON DELETE CASCADE,
  to_profile_id UUID NOT NULL REFERENCES strategic_profiles(id) ON DELETE CASCADE,

  relationship_type relationship_type NOT NULL,
  strength REAL CHECK (strength BETWEEN 0 AND 1) DEFAULT 0.5,

  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),

  UNIQUE(from_profile_id, to_profile_id, relationship_type)
);

CREATE INDEX idx_profile_rel_from ON profile_relationships(from_profile_id);
CREATE INDEX idx_profile_rel_to ON profile_relationships(to_profile_id);
CREATE INDEX idx_profile_rel_type ON profile_relationships(relationship_type);

-- ============================================================================
-- MATERIALIZED VIEWS (Performance)
-- ============================================================================

-- Active profiles by type
CREATE MATERIALIZED VIEW mv_active_profiles_by_type AS
SELECT
  type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_global = true) as global_count,
  COUNT(*) FILTER (WHERE is_featured = true) as featured_count,
  AVG(usage_count) as avg_usage,
  AVG(avg_rating) as avg_rating
FROM strategic_profiles
WHERE is_active = true
GROUP BY type;

CREATE INDEX idx_mv_profiles_type ON mv_active_profiles_by_type(type);

-- Popular profiles
CREATE MATERIALIZED VIEW mv_popular_profiles AS
SELECT
  id,
  type,
  name,
  category,
  usage_count,
  avg_rating,
  last_used_at
FROM strategic_profiles
WHERE is_active = true
ORDER BY usage_count DESC, avg_rating DESC NULLS LAST
LIMIT 100;

CREATE INDEX idx_mv_popular_id ON mv_popular_profiles(id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_strategic_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_strategic_profiles_updated
BEFORE UPDATE ON strategic_profiles
FOR EACH ROW
EXECUTE FUNCTION update_strategic_profile_timestamp();

-- Auto-create version on update
CREATE OR REPLACE FUNCTION create_strategic_profile_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if substantial change (not just usage_count)
  IF (OLD.name != NEW.name OR
      OLD.description != NEW.description OR
      OLD.ai_config != NEW.ai_config OR
      OLD.firmographics != NEW.firmographics OR
      OLD.psychographics != NEW.psychographics) THEN

    INSERT INTO strategic_profile_versions (
      profile_id,
      version,
      profile_data,
      changed_by
    ) VALUES (
      OLD.id,
      OLD.version,
      row_to_json(OLD),
      NEW.updated_by
    );

    NEW.version = OLD.version + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_strategic_profiles_version
BEFORE UPDATE ON strategic_profiles
FOR EACH ROW
EXECUTE FUNCTION create_strategic_profile_version();

-- Refresh materialized views on change
CREATE OR REPLACE FUNCTION refresh_profile_views()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_active_profiles_by_type;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_popular_profiles;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_profile_views
AFTER INSERT OR UPDATE OR DELETE ON strategic_profiles
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_profile_views();

-- ============================================================================
-- COMMENTS (Documentation in DB)
-- ============================================================================

COMMENT ON TABLE strategic_profiles IS 'Unified profiles for all strategic intelligence entities: experts, professionals, roles, ICPs, and buyer personas';
COMMENT ON COLUMN strategic_profiles.type IS 'Profile type: expert (AI debate participant), professional (specialized agent), role (archetype), icp (company profile), buyer_persona (individual)';
COMMENT ON COLUMN strategic_profiles.ai_config IS 'AI-specific config (prompt, model, temperature) - only for expert/professional/role types';
COMMENT ON COLUMN strategic_profiles.firmographics IS 'Company attributes (size, revenue, tech stack) - only for ICP type';
COMMENT ON COLUMN strategic_profiles.psychographics IS 'Individual attributes (motivations, JTBD, barriers) - only for buyer_persona type';
COMMENT ON COLUMN strategic_profiles.parent_profile_id IS 'Parent relationship (e.g., ICP -> Buyer Personas within that ICP)';
COMMENT ON TABLE profile_rag_documents IS 'Links profiles to RAG documents with rich context metadata';
COMMENT ON TABLE strategic_profile_versions IS 'Audit trail of all profile changes with full snapshots';
COMMENT ON TABLE profile_relationships IS 'Advanced relationships between profiles (compatible, complementary, etc.)';
