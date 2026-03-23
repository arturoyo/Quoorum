-- Migration: Extend system_prompts table for AI Prompt Management System
-- This extends the existing system_prompts table with columns needed for debate flow management

-- Add new columns to existing system_prompts table
ALTER TABLE system_prompts
ADD COLUMN IF NOT EXISTS phase INTEGER CHECK (phase BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS system_prompt TEXT,
ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS recommended_model VARCHAR(50),
ADD COLUMN IF NOT EXISTS economic_model VARCHAR(50),
ADD COLUMN IF NOT EXISTS balanced_model VARCHAR(50),
ADD COLUMN IF NOT EXISTS performance_model VARCHAR(50),
ADD COLUMN IF NOT EXISTS temperature REAL DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 2000,
ADD COLUMN IF NOT EXISTS order_in_phase INTEGER DEFAULT 0;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_system_prompts_phase ON system_prompts(phase);
CREATE INDEX IF NOT EXISTS idx_system_prompts_category_phase ON system_prompts(category, phase);

-- Create system_prompt_versions table for detailed version history
CREATE TABLE IF NOT EXISTS system_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL,
  version INTEGER NOT NULL,

  -- Snapshot of prompt at this version
  prompt TEXT NOT NULL,
  system_prompt TEXT,
  recommended_model VARCHAR(50),
  economic_model VARCHAR(50),
  balanced_model VARCHAR(50),
  performance_model VARCHAR(50),
  temperature REAL,
  max_tokens INTEGER,

  -- Audit trail
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(prompt_id, version)
);

-- Add foreign key constraint for prompt_id (note: can't use ON DELETE CASCADE with RLS, so using RESTRICT)
-- We'll handle cascading deletes in application code if needed
CREATE INDEX IF NOT EXISTS idx_system_prompt_versions_prompt_id ON system_prompt_versions(prompt_id);

-- Enable RLS on versions table
ALTER TABLE system_prompt_versions ENABLE ROW LEVEL SECURITY;

-- Allow only admins to view versions
CREATE POLICY system_prompt_versions_admin_select ON system_prompt_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.is_admin = true
    )
  );

-- Allow only admins to insert versions (automatic on update)
CREATE POLICY system_prompt_versions_admin_insert ON system_prompt_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.is_admin = true
    )
  );

-- Create performance_profiles table
CREATE TABLE IF NOT EXISTS performance_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Configuration
  cost_multiplier REAL DEFAULT 1.0,
  model_rules JSONB,

  -- Display
  badge_color VARCHAR(20),
  icon VARCHAR(50),

  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for slug
CREATE INDEX IF NOT EXISTS idx_performance_profiles_slug ON performance_profiles(slug);

-- Enable RLS on performance_profiles
ALTER TABLE performance_profiles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read performance profiles
CREATE POLICY performance_profiles_read ON performance_profiles
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Allow only admins to manage performance profiles
CREATE POLICY performance_profiles_admin_all ON performance_profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.is_admin = true
    )
  );

-- Seed performance profiles with 3 default tiers
INSERT INTO performance_profiles (slug, name, description, cost_multiplier, badge_color, icon, is_active, is_default, model_rules) VALUES
(
  'economic',
  'Económico',
  'Modelos más baratos en todas las operaciones. Ideal para pruebas o presupuestos limitados.',
  0.3,
  'green',
  'TrendingDown',
  true,
  false,
  '{"generation": "gpt-3.5-turbo", "validation": "gpt-4o-mini", "suggestion": "gemini-2.0-flash", "analysis": "gpt-3.5-turbo", "execution": "gemini-2.0-flash", "synthesis": "gpt-4o-mini", "intervention": "gpt-4o-mini", "framework": "gemini-2.0-flash"}'::jsonb
),
(
  'balanced',
  'Equilibrado',
  '80% operaciones con modelos económicos, 20% operaciones críticas con modelos premium. Mejor balance calidad/precio.',
  1.0,
  'blue',
  'Scale',
  true,
  true,
  '{"generation": "gpt-4-turbo", "validation": "gpt-4o-mini", "suggestion": "gemini-2.0-flash", "analysis": "gpt-4o-mini", "execution": "claude-3-5-sonnet-20241022", "synthesis": "gpt-4-turbo", "intervention": "gpt-4o-mini", "framework": "gpt-4-turbo"}'::jsonb
),
(
  'performance',
  'Alto Rendimiento',
  'Modelos premium en todas las operaciones. Máxima calidad y precisión.',
  3.0,
  'purple',
  'Zap',
  true,
  false,
  '{"generation": "gpt-4", "validation": "gpt-4-turbo", "suggestion": "gpt-4-turbo", "analysis": "gpt-4-turbo", "execution": "claude-opus-4-20250514", "synthesis": "claude-opus-4-20250514", "intervention": "gpt-4-turbo", "framework": "claude-opus-4-20250514"}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Add performance_level column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS performance_level VARCHAR(50) DEFAULT 'balanced';

-- Add foreign key constraint (but allow null for backwards compatibility)
-- Note: We can't add REFERENCES in Supabase's auth schema, so we'll validate in application code

-- Create index for performance_level
CREATE INDEX IF NOT EXISTS idx_profiles_performance_level ON profiles(performance_level);
