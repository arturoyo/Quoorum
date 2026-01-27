-- Scenarios (Decision Playbooks) Migration
-- Generated for Escenarios de Oro feature

-- Create enums
DO $$ BEGIN
    CREATE TYPE scenario_segment AS ENUM('entrepreneur', 'sme', 'corporate');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE scenario_status AS ENUM('draft', 'active', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	name varchar(255) NOT NULL,
	description text NOT NULL,
	short_description varchar(500),
	segment scenario_segment NOT NULL,
	status scenario_status DEFAULT 'active' NOT NULL,
	expert_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
	requires_departments boolean DEFAULT false NOT NULL,
	department_ids jsonb DEFAULT '[]'::jsonb,
	framework_id varchar(100),
	master_prompt_template text NOT NULL,
	prompt_variables jsonb DEFAULT '{}'::jsonb,
	success_metrics jsonb DEFAULT '[]'::jsonb,
	agent_behavior_overrides jsonb DEFAULT '{}'::jsonb,
	token_optimization jsonb DEFAULT '{"enabled": true}'::jsonb,
	generate_certificate boolean DEFAULT true NOT NULL,
	certificate_template text,
	min_tier varchar(50) DEFAULT 'free',
	is_public boolean DEFAULT true NOT NULL,
	created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
	usage_count integer DEFAULT 0 NOT NULL,
	avg_quality_score integer,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create scenario_usage table
CREATE TABLE IF NOT EXISTS scenario_usage (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
	debate_id uuid NOT NULL REFERENCES quoorum_debates(id) ON DELETE CASCADE,
	user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
	variables_used jsonb DEFAULT '{}'::jsonb,
	success_metrics_extracted jsonb DEFAULT '{}'::jsonb,
	quality_score integer,
	created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scenarios_segment ON scenarios (segment);
CREATE INDEX IF NOT EXISTS idx_scenarios_status ON scenarios (status);
CREATE INDEX IF NOT EXISTS idx_scenarios_created_by ON scenarios (created_by);
CREATE INDEX IF NOT EXISTS idx_scenarios_min_tier ON scenarios (min_tier);
CREATE INDEX IF NOT EXISTS idx_scenario_usage_scenario ON scenario_usage (scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_usage_debate ON scenario_usage (debate_id);
CREATE INDEX IF NOT EXISTS idx_scenario_usage_user ON scenario_usage (user_id);
