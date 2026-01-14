-- Quoorum Debates System Migration
-- Generated manually for quoorum dynamic system

-- Create enums
CREATE TYPE "debate_mode" AS ENUM('static', 'dynamic');
CREATE TYPE "debate_status" AS ENUM('pending', 'in_progress', 'completed', 'failed', 'cancelled');
CREATE TYPE "debate_visibility" AS ENUM('private', 'team', 'public');

-- Create quoorum_debates table
CREATE TABLE IF NOT EXISTS "quoorum_debates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"question" text NOT NULL,
	"mode" "debate_mode" DEFAULT 'dynamic' NOT NULL,
	"status" "debate_status" DEFAULT 'pending' NOT NULL,
	"visibility" "debate_visibility" DEFAULT 'private' NOT NULL,
	"context" jsonb,
	"consensus_score" real,
	"total_rounds" integer,
	"total_cost_usd" real,
	"final_ranking" jsonb,
	"rounds" jsonb,
	"experts" jsonb,
	"quality_metrics" jsonb,
	"interventions" jsonb,
	"share_token" varchar(64),
	"tags" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "quoorum_debates_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "quoorum_debates_user_id_idx" ON "quoorum_debates" ("user_id");
CREATE INDEX IF NOT EXISTS "quoorum_debates_status_idx" ON "quoorum_debates" ("status");
CREATE INDEX IF NOT EXISTS "quoorum_debates_created_at_idx" ON "quoorum_debates" ("created_at");
CREATE INDEX IF NOT EXISTS "quoorum_debates_share_token_idx" ON "quoorum_debates" ("share_token");

-- Create quoorum_debate_comments table
CREATE TABLE IF NOT EXISTS "quoorum_debate_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"mentions" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quoorum_debate_comments_debate_id_quoorum_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "quoorum_debates"("id") ON DELETE cascade,
	CONSTRAINT "quoorum_debate_comments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade
);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS "quoorum_debate_comments_debate_id_idx" ON "quoorum_debate_comments" ("debate_id");
CREATE INDEX IF NOT EXISTS "quoorum_debate_comments_user_id_idx" ON "quoorum_debate_comments" ("user_id");
CREATE INDEX IF NOT EXISTS "quoorum_debate_comments_created_at_idx" ON "quoorum_debate_comments" ("created_at");

-- Create quoorum_debate_reactions table
CREATE TABLE IF NOT EXISTS "quoorum_debate_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reaction" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quoorum_debate_reactions_debate_id_quoorum_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "quoorum_debates"("id") ON DELETE cascade,
	CONSTRAINT "quoorum_debate_reactions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade,
	CONSTRAINT "quoorum_debate_reactions_unique" UNIQUE("debate_id", "user_id", "reaction")
);

-- Create indexes for reactions
CREATE INDEX IF NOT EXISTS "quoorum_debate_reactions_debate_id_idx" ON "quoorum_debate_reactions" ("debate_id");
CREATE INDEX IF NOT EXISTS "quoorum_debate_reactions_user_id_idx" ON "quoorum_debate_reactions" ("user_id");

-- Create quoorum_custom_experts table
CREATE TABLE IF NOT EXISTS "quoorum_custom_experts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"expertise" text[] NOT NULL,
	"topics" text[] NOT NULL,
	"perspective" text NOT NULL,
	"system_prompt" text NOT NULL,
	"temperature" real DEFAULT 0.7 NOT NULL,
	"provider" varchar(32) DEFAULT 'openai' NOT NULL,
	"model_id" varchar(64) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quoorum_custom_experts_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade
);

-- Create indexes for custom experts
CREATE INDEX IF NOT EXISTS "quoorum_custom_experts_user_id_idx" ON "quoorum_custom_experts" ("user_id");
CREATE INDEX IF NOT EXISTS "quoorum_custom_experts_is_active_idx" ON "quoorum_custom_experts" ("is_active");

-- Create quoorum_expert_performance table
CREATE TABLE IF NOT EXISTS "quoorum_expert_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expert_id" varchar(255) NOT NULL,
	"total_debates" integer DEFAULT 0 NOT NULL,
	"avg_quality_score" real DEFAULT 0 NOT NULL,
	"avg_consensus_score" real DEFAULT 0 NOT NULL,
	"avg_depth_contribution" real DEFAULT 0 NOT NULL,
	"win_rate" real DEFAULT 0 NOT NULL,
	"chemistry_scores" jsonb,
	"specializations" text[],
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quoorum_expert_performance_expert_id_unique" UNIQUE("expert_id")
);

-- Create indexes for expert performance
CREATE INDEX IF NOT EXISTS "quoorum_expert_performance_expert_id_idx" ON "quoorum_expert_performance" ("expert_id");
CREATE INDEX IF NOT EXISTS "quoorum_expert_performance_win_rate_idx" ON "quoorum_expert_performance" ("win_rate");

-- Create quoorum_debate_embeddings table (for similarity search)
CREATE TABLE IF NOT EXISTS "quoorum_debate_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_id" uuid NOT NULL,
	"question" text NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quoorum_debate_embeddings_debate_id_quoorum_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "quoorum_debates"("id") ON DELETE cascade,
	CONSTRAINT "quoorum_debate_embeddings_debate_id_unique" UNIQUE("debate_id")
);

-- Create indexes for embeddings (requires pgvector extension)
-- Note: This will fail if pgvector is not installed. Install with: CREATE EXTENSION IF NOT EXISTS vector;
-- CREATE INDEX IF NOT EXISTS "quoorum_debate_embeddings_embedding_idx" ON "quoorum_debate_embeddings" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS "quoorum_debate_embeddings_debate_id_idx" ON "quoorum_debate_embeddings" ("debate_id");

-- Add comments for documentation
COMMENT ON TABLE "quoorum_debates" IS 'Stores debates from the dynamic expert system with full history and analytics';
COMMENT ON TABLE "quoorum_debate_comments" IS 'Team collaboration comments on debates with mentions support';
COMMENT ON TABLE "quoorum_debate_reactions" IS 'User reactions to debates (like, bookmark, etc)';
COMMENT ON TABLE "quoorum_custom_experts" IS 'User-created custom experts for debates';
COMMENT ON TABLE "quoorum_expert_performance" IS 'Performance tracking and learning system for experts';
COMMENT ON TABLE "quoorum_debate_embeddings" IS 'Question embeddings for similarity search (requires pgvector)';
