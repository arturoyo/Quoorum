CREATE TYPE "public"."company_size" AS ENUM('solo', 'small_2_10', 'medium_11_50', 'large_50_plus');--> statement-breakpoint
CREATE TYPE "public"."company_stage" AS ENUM('idea', 'mvp', 'early_revenue', 'growth', 'scale', 'mature');--> statement-breakpoint
CREATE TYPE "public"."credit_transaction_source" AS ENUM('debate_creation', 'debate_execution', 'debate_failed', 'debate_cancelled', 'monthly_allocation', 'purchase', 'admin_adjustment', 'refund', 'daily_reset');--> statement-breakpoint
CREATE TYPE "public"."credit_transaction_type" AS ENUM('deduction', 'addition', 'refund');--> statement-breakpoint
CREATE TYPE "public"."decision_style" AS ENUM('fast_intuitive', 'balanced', 'thorough_analytical');--> statement-breakpoint
CREATE TYPE "public"."department_type" AS ENUM('finance', 'marketing', 'operations', 'hr', 'sales', 'product', 'engineering', 'customer_success', 'legal', 'custom');--> statement-breakpoint
CREATE TYPE "public"."industry_type" AS ENUM('saas', 'ecommerce', 'fintech', 'healthtech', 'edtech', 'marketplace', 'consumer', 'enterprise', 'hardware', 'services', 'other');--> statement-breakpoint
CREATE TYPE "public"."process_phase_status" AS ENUM('pending', 'in_progress', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."process_status" AS ENUM('in_progress', 'completed', 'paused', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."referral_reward_type" AS ENUM('free_month', 'unlock_agent', 'credits', 'feature_unlock', 'discount');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('pending', 'converted', 'rewarded', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."roadmap_category" AS ENUM('feature', 'bugfix', 'infra', 'docs');--> statement-breakpoint
CREATE TYPE "public"."roadmap_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."roadmap_status" AS ENUM('planned', 'in_progress', 'completed', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."user_role_type" AS ENUM('founder', 'ceo', 'cto', 'product_manager', 'investor', 'consultant', 'team_lead', 'individual_contributor', 'other');--> statement-breakpoint
CREATE TYPE "public"."scenario_segment" AS ENUM('entrepreneur', 'sme', 'corporate');--> statement-breakpoint
CREATE TYPE "public"."scenario_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."team_member_role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."team_member_status" AS ENUM('pending', 'active', 'inactive', 'removed');--> statement-breakpoint
CREATE TYPE "public"."user_tier" AS ENUM('free', 'starter', 'pro', 'business');--> statement-breakpoint
CREATE TYPE "public"."worker_role" AS ENUM('ceo', 'cto', 'cfo', 'cmo', 'coo', 'vp_sales', 'vp_product', 'vp_engineering', 'director', 'manager', 'senior', 'mid', 'junior', 'intern', 'consultant', 'advisor', 'custom');--> statement-breakpoint
CREATE TYPE "public"."worker_type" AS ENUM('internal', 'external_expert');--> statement-breakpoint
ALTER TYPE "public"."debate_status" ADD VALUE 'draft' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."quoorum_notification_type" ADD VALUE 'process_phase_completed';--> statement-breakpoint
ALTER TYPE "public"."quoorum_notification_type" ADD VALUE 'process_completed';--> statement-breakpoint
CREATE TABLE "ai_cost_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"debate_id" uuid,
	"operation_type" varchar(100) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"model_id" varchar(100) NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd_prompt" numeric(12, 8) DEFAULT '0' NOT NULL,
	"cost_usd_completion" numeric(12, 8) DEFAULT '0' NOT NULL,
	"cost_usd_total" numeric(12, 8) DEFAULT '0' NOT NULL,
	"is_free_tier" boolean DEFAULT false NOT NULL,
	"latency_ms" integer,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"input_summary" varchar(500),
	"output_summary" varchar(500),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"context" text NOT NULL,
	"industry" varchar(100),
	"size" varchar(50),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"debate_id" uuid,
	"type" "credit_transaction_type" NOT NULL,
	"source" "credit_transaction_source" NOT NULL,
	"amount" integer NOT NULL,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debate_frameworks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_id" uuid NOT NULL,
	"framework_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" varchar(100) NOT NULL,
	"type" "department_type" DEFAULT 'custom' NOT NULL,
	"department_context" text NOT NULL,
	"base_prompt" text NOT NULL,
	"custom_prompt" text,
	"agent_role" varchar(50) DEFAULT 'analyst',
	"temperature" varchar(10) DEFAULT '0.7',
	"description" text,
	"icon" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_predefined" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "frameworks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"meta_title" varchar(255),
	"meta_description" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "frameworks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"debate_updates" boolean DEFAULT true NOT NULL,
	"weekly_digest" boolean DEFAULT true NOT NULL,
	"push_notifications" boolean DEFAULT false NOT NULL,
	"security_alerts" boolean DEFAULT true NOT NULL,
	"marketing_emails" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "pricing_change_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"change_type" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"impact_analysis" jsonb,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"change_reason" varchar(500),
	"can_rollback" boolean DEFAULT true NOT NULL,
	"rolled_back_at" timestamp with time zone,
	"rolled_back_by" uuid
);
--> statement-breakpoint
CREATE TABLE "pricing_global_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credit_multiplier" numeric(10, 2) DEFAULT '1.75' NOT NULL,
	"usd_per_credit" numeric(10, 4) DEFAULT '0.01' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_until" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"change_reason" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "process_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"process_type" varchar(100) NOT NULL,
	"process_id" uuid,
	"process_name" text NOT NULL,
	"current_phase" integer DEFAULT 1 NOT NULL,
	"total_phases" integer DEFAULT 5 NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"status" "process_status" DEFAULT 'in_progress' NOT NULL,
	"phases" jsonb NOT NULL,
	"metadata" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"max_uses" integer DEFAULT 100,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_codes_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" uuid NOT NULL,
	"referral_code_id" uuid,
	"referred_email" varchar(255),
	"referred_user_id" uuid,
	"status" "referral_status" DEFAULT 'pending' NOT NULL,
	"converted_at" timestamp with time zone,
	"rewarded_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"reward_type" "referral_reward_type",
	"reward_value" integer,
	"reward_claimed" boolean DEFAULT false NOT NULL,
	"invitation_method" varchar(50),
	"invitation_sent_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roadmap_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "roadmap_status" DEFAULT 'planned' NOT NULL,
	"priority" "roadmap_priority" DEFAULT 'medium' NOT NULL,
	"category" "roadmap_category" DEFAULT 'feature' NOT NULL,
	"due_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scenario_id" uuid NOT NULL,
	"debate_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"variables_used" jsonb DEFAULT '{}'::jsonb,
	"success_metrics_extracted" jsonb DEFAULT '{}'::jsonb,
	"quality_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"short_description" varchar(500),
	"segment" "scenario_segment" NOT NULL,
	"status" "scenario_status" DEFAULT 'active' NOT NULL,
	"expert_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requires_departments" boolean DEFAULT false NOT NULL,
	"department_ids" jsonb DEFAULT '[]'::jsonb,
	"framework_id" varchar(100),
	"master_prompt_template" text NOT NULL,
	"prompt_variables" jsonb DEFAULT '{}'::jsonb,
	"success_metrics" jsonb DEFAULT '[]'::jsonb,
	"agent_behavior_overrides" jsonb DEFAULT '{}'::jsonb,
	"token_optimization" jsonb DEFAULT '{"enabled":true,"maxTokensPerMessage":50}'::jsonb,
	"generate_certificate" boolean DEFAULT true NOT NULL,
	"certificate_template" text,
	"min_tier" varchar(50) DEFAULT 'free',
	"is_public" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"avg_quality_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" varchar(500) NOT NULL,
	"device" varchar(200) NOT NULL,
	"browser" varchar(100),
	"os" varchar(100),
	"ip_address" varchar(45),
	"location" varchar(200),
	"country" varchar(100),
	"city" varchar(100),
	"user_agent" text,
	"last_active" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_owner_id" uuid NOT NULL,
	"member_profile_id" uuid,
	"invitation_email" varchar(255),
	"invitation_token" varchar(255),
	"invitation_expires_at" timestamp with time zone,
	"role" "team_member_role" DEFAULT 'member' NOT NULL,
	"status" "team_member_status" DEFAULT 'pending' NOT NULL,
	"permissions" varchar(500),
	"invited_by" uuid,
	"joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tier_pricing_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier" varchar(50) NOT NULL,
	"tier_name" varchar(100) NOT NULL,
	"tier_description" varchar(500),
	"monthly_price_usd" integer DEFAULT 0 NOT NULL,
	"yearly_price_usd" integer DEFAULT 0 NOT NULL,
	"monthly_credits" integer DEFAULT 1000 NOT NULL,
	"yearly_credits" integer DEFAULT 12000 NOT NULL,
	"debates_per_month" integer DEFAULT 5 NOT NULL,
	"max_experts" integer DEFAULT 4 NOT NULL,
	"max_rounds_per_debate" integer DEFAULT 3 NOT NULL,
	"max_team_members" integer DEFAULT 1 NOT NULL,
	"features" jsonb,
	"stripe_price_id_monthly" varchar(255),
	"stripe_price_id_yearly" varchar(255),
	"stripe_product_id" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_publicly_visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_until" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"change_reason" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "user_backstory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" varchar(255),
	"role" "user_role_type",
	"industry" "industry_type",
	"company_size" "company_size",
	"company_stage" "company_stage",
	"decision_style" "decision_style",
	"additional_context" text,
	"preferences" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_backstory_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_context_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"content" text NOT NULL,
	"file_size" integer,
	"content_type" varchar(100) DEFAULT 'text/plain',
	"is_active" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0,
	"tags" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_event_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"processing_started_at" timestamp with time zone,
	"processed_at" timestamp with time zone,
	"user_id" uuid,
	"payload" jsonb,
	"error" varchar(1000),
	"retry_count" varchar(10) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
CREATE TABLE "worker_departments" (
	"worker_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "worker_departments_worker_id_department_id_pk" PRIMARY KEY("worker_id","department_id")
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"department_id" uuid,
	"name" varchar(255) NOT NULL,
	"role" "worker_role" DEFAULT 'custom' NOT NULL,
	"type" "worker_type" DEFAULT 'internal' NOT NULL,
	"expertise" text NOT NULL,
	"description" text,
	"responsibilities" text,
	"system_prompt" text NOT NULL,
	"ai_config" jsonb NOT NULL,
	"avatar" varchar(500),
	"email" varchar(255),
	"phone" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_predefined" boolean DEFAULT false NOT NULL,
	"library_worker_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "key_prefix" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "experts" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "experts" ADD COLUMN "library_expert_id" uuid;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD COLUMN "total_credits_used" integer;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD COLUMN "theme_id" varchar(50);--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD COLUMN "theme_confidence" real;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD COLUMN "costs_by_provider" jsonb;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD COLUMN "costs_by_phase" jsonb;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD COLUMN "processing_status" jsonb;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "monthly_credits" integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage" ADD COLUMN "credits_deducted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage" ADD COLUMN "model_used" varchar(100);--> statement-breakpoint
ALTER TABLE "usage" ADD COLUMN "phase" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "credits" integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tier" "user_tier" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_daily_credit_refresh" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ai_cost_tracking" ADD CONSTRAINT "ai_cost_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_cost_tracking" ADD CONSTRAINT "ai_cost_tracking_debate_id_quoorum_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."quoorum_debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_debate_id_quoorum_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."quoorum_debates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debate_frameworks" ADD CONSTRAINT "debate_frameworks_debate_id_quoorum_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."quoorum_debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debate_frameworks" ADD CONSTRAINT "debate_frameworks_framework_id_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_change_history" ADD CONSTRAINT "pricing_change_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_change_history" ADD CONSTRAINT "pricing_change_history_rolled_back_by_users_id_fk" FOREIGN KEY ("rolled_back_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_global_config" ADD CONSTRAINT "pricing_global_config_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_timeline" ADD CONSTRAINT "process_timeline_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_profiles_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referral_code_id_referral_codes_id_fk" FOREIGN KEY ("referral_code_id") REFERENCES "public"."referral_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_profiles_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_usage" ADD CONSTRAINT "scenario_usage_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_usage" ADD CONSTRAINT "scenario_usage_debate_id_quoorum_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."quoorum_debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_usage" ADD CONSTRAINT "scenario_usage_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_owner_id_profiles_id_fk" FOREIGN KEY ("team_owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_member_profile_id_profiles_id_fk" FOREIGN KEY ("member_profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_invited_by_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tier_pricing_config" ADD CONSTRAINT "tier_pricing_config_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_backstory" ADD CONSTRAINT "user_backstory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_context_files" ADD CONSTRAINT "user_context_files_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_departments" ADD CONSTRAINT "worker_departments_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_departments" ADD CONSTRAINT "worker_departments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_cost_tracking_user_id" ON "ai_cost_tracking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ai_cost_tracking_debate_id" ON "ai_cost_tracking" USING btree ("debate_id");--> statement-breakpoint
CREATE INDEX "idx_ai_cost_tracking_operation_type" ON "ai_cost_tracking" USING btree ("operation_type");--> statement-breakpoint
CREATE INDEX "idx_ai_cost_tracking_provider" ON "ai_cost_tracking" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_ai_cost_tracking_created_at" ON "ai_cost_tracking" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_cost_tracking_is_free_tier" ON "ai_cost_tracking" USING btree ("is_free_tier");--> statement-breakpoint
CREATE INDEX "idx_ai_cost_tracking_analysis" ON "ai_cost_tracking" USING btree ("user_id","created_at","operation_type");--> statement-breakpoint
CREATE INDEX "idx_companies_user" ON "companies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_companies_is_active" ON "companies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "credit_transactions_user_id_idx" ON "credit_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_debate_id_idx" ON "credit_transactions" USING btree ("debate_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_type_idx" ON "credit_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "credit_transactions_source_idx" ON "credit_transactions" USING btree ("source");--> statement-breakpoint
CREATE INDEX "credit_transactions_created_at_idx" ON "credit_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "credit_transactions_user_created_idx" ON "credit_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_departments_company" ON "departments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_departments_parent" ON "departments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_departments_type" ON "departments" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_departments_is_active" ON "departments" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_process_timeline_user" ON "process_timeline" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_process_timeline_type" ON "process_timeline" USING btree ("process_type");--> statement-breakpoint
CREATE INDEX "idx_process_timeline_status" ON "process_timeline" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_process_timeline_started" ON "process_timeline" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_scenario_usage_scenario" ON "scenario_usage" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "idx_scenario_usage_debate" ON "scenario_usage" USING btree ("debate_id");--> statement-breakpoint
CREATE INDEX "idx_scenario_usage_user" ON "scenario_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_scenarios_segment" ON "scenarios" USING btree ("segment");--> statement-breakpoint
CREATE INDEX "idx_scenarios_status" ON "scenarios" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_scenarios_created_by" ON "scenarios" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_scenarios_min_tier" ON "scenarios" USING btree ("min_tier");--> statement-breakpoint
CREATE INDEX "idx_user_context_files_user" ON "user_context_files" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_context_files_active" ON "user_context_files" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_user_context_files_created" ON "user_context_files" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_worker_departments_worker" ON "worker_departments" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "idx_worker_departments_department" ON "worker_departments" USING btree ("department_id");--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD CONSTRAINT "quoorum_debates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD CONSTRAINT "quoorum_debates_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_quoorum_custom_experts_user" ON "quoorum_custom_experts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_custom_experts_active" ON "quoorum_custom_experts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_quoorum_custom_experts_user_active" ON "quoorum_custom_experts" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_comments_debate" ON "quoorum_debate_comments" USING btree ("debate_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_comments_user" ON "quoorum_debate_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_comments_parent" ON "quoorum_debate_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_likes_debate" ON "quoorum_debate_likes" USING btree ("debate_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_likes_user" ON "quoorum_debate_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_likes_user_debate" ON "quoorum_debate_likes" USING btree ("user_id","debate_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_templates_created_by" ON "quoorum_debate_templates" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_templates_industry" ON "quoorum_debate_templates" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_templates_category" ON "quoorum_debate_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_templates_public" ON "quoorum_debate_templates" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_user" ON "quoorum_debates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_status" ON "quoorum_debates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_visibility" ON "quoorum_debates" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_company" ON "quoorum_debates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_department" ON "quoorum_debates" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_created" ON "quoorum_debates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_user_status" ON "quoorum_debates" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_user_created" ON "quoorum_debates" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_user_deleted" ON "quoorum_debates" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_quoorum_expert_performance_expert" ON "quoorum_expert_performance" USING btree ("expert_id");--> statement-breakpoint
CREATE INDEX "idx_profiles_user_id" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_profiles_email" ON "profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_profiles_is_active" ON "profiles" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN "permissions";--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN "expires_at";