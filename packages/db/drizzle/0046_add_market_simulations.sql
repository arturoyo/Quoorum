-- Migration: Add Market Simulations (Focus Group de IA)
-- Created: 2026-02-01

-- Table for storing market simulation results
CREATE TABLE IF NOT EXISTS market_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Input data
  variants TEXT[] NOT NULL,
  buyer_persona_ids UUID[] NOT NULL,
  context TEXT,

  -- Results
  winning_variant_index INTEGER NOT NULL,
  winning_variant_text TEXT NOT NULL,
  consensus_score DECIMAL(4, 2),
  avg_friction DECIMAL(4, 2),
  friction_map JSONB NOT NULL,
  synthesis TEXT NOT NULL,

  -- Cost tracking
  evaluation_cost_usd DECIMAL(10, 6),
  synthesis_cost_usd DECIMAL(10, 6),
  total_cost_usd DECIMAL(10, 6),
  tokens_used INTEGER,
  execution_time_ms INTEGER,

  -- Ownership & Multi-tenancy
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_market_simulations_user ON market_simulations(user_id);
CREATE INDEX idx_market_simulations_company ON market_simulations(company_id);
CREATE INDEX idx_market_simulations_created ON market_simulations(created_at DESC);

-- Composite index for user + date queries
CREATE INDEX idx_market_simulations_user_created ON market_simulations(user_id, created_at DESC);

-- Comments for documentation
COMMENT ON TABLE market_simulations IS 'Stores results from Market Simulator (AI Focus Group) evaluations';
COMMENT ON COLUMN market_simulations.variants IS 'Array of message/copy variants that were tested';
COMMENT ON COLUMN market_simulations.buyer_persona_ids IS 'IDs of buyer personas (from strategic_profiles) used as evaluators';
COMMENT ON COLUMN market_simulations.friction_map IS 'Detailed friction scores and critiques from each buyer persona for each variant';
COMMENT ON COLUMN market_simulations.consensus_score IS 'Score 1-10 indicating level of collective acceptance (10 - avg_friction)';
COMMENT ON COLUMN market_simulations.avg_friction IS 'Average friction score across all buyer personas for winning variant';
COMMENT ON COLUMN market_simulations.synthesis IS 'AI-generated analysis explaining why the winning variant resonates better';
