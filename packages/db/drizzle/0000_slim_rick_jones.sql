CREATE TYPE "public"."admin_role" AS ENUM('super_admin', 'admin', 'moderator', 'support');--> statement-breakpoint
CREATE TYPE "public"."consultation_trigger" AS ENUM('price_negotiation', 'competitor_mention', 'objection_complex', 'high_value_client', 'escalation_risk', 'contract_terms', 'strategic_decision', 'churn_signal');--> statement-breakpoint
CREATE TYPE "public"."consultation_urgency" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."deal_stage" AS ENUM('lead', 'qualified', 'proposal', 'negotiation', 'commitment', 'closed_won', 'closed_lost');--> statement-breakpoint
CREATE TYPE "public"."debate_deal_context" AS ENUM('pricing_strategy', 'negotiation_tactics', 'objection_handling', 'proposal_review', 'competitor_analysis', 'closing_strategy', 'risk_assessment', 'value_proposition', 'general');--> statement-breakpoint
CREATE TYPE "public"."debate_influence" AS ENUM('decisive', 'significant', 'moderate', 'minimal', 'none', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."debate_mode" AS ENUM('static', 'dynamic');--> statement-breakpoint
CREATE TYPE "public"."debate_status" AS ENUM('pending', 'in_progress', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."debate_visibility" AS ENUM('private', 'team', 'public');--> statement-breakpoint
CREATE TYPE "public"."feedback_sentiment" AS ENUM('helpful', 'neutral', 'unhelpful');--> statement-breakpoint
CREATE TYPE "public"."quoorum_notification_channel" AS ENUM('in_app', 'email', 'push', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."quoorum_notification_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."quoorum_notification_type" AS ENUM('debate_completed', 'debate_failed', 'new_comment', 'comment_reply', 'debate_shared', 'consensus_reached', 'expert_recommendation', 'weekly_digest', 'debate_reminder', 'team_action');--> statement-breakpoint
CREATE TYPE "public"."quoorum_report_format" AS ENUM('pdf', 'html', 'markdown');--> statement-breakpoint
CREATE TYPE "public"."quoorum_report_status" AS ENUM('pending', 'generating', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."quoorum_report_type" AS ENUM('single_debate', 'weekly_summary', 'monthly_summary', 'deal_analysis', 'expert_performance', 'custom');--> statement-breakpoint
CREATE TYPE "public"."plan_tier" AS ENUM('free', 'starter', 'pro', 'business', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."response_approach" AS ENUM('empathetic', 'assertive', 'consultative', 'direct');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing', 'paused', 'unpaid');--> statement-breakpoint
CREATE TABLE "admin_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_roles_name_unique" UNIQUE("name"),
	CONSTRAINT "admin_roles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"role_id" uuid,
	"role" "admin_role" DEFAULT 'support' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"key_prefix" varchar(10) NOT NULL,
	"permissions" jsonb DEFAULT '{"read":true,"write":false,"delete":false}'::jsonb,
	"last_used_at" timestamp with time zone,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" varchar(100) NOT NULL,
	"user_id" uuid,
	"deliberation_id" uuid,
	"entity_type" varchar(100),
	"entity_id" uuid,
	"details" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"company" varchar(255),
	"notes" text,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consensus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deliberation_id" uuid NOT NULL,
	"round_id" uuid,
	"achieved" boolean DEFAULT false NOT NULL,
	"score" real NOT NULL,
	"summary" text NOT NULL,
	"recommendation" text,
	"dissenting" jsonb DEFAULT '[]'::jsonb,
	"quality_assessment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"channel" varchar(50) DEFAULT 'web' NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"title" varchar(255),
	"summary" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"client_id" uuid,
	"owner_id" uuid,
	"stage" "deal_stage" DEFAULT 'lead' NOT NULL,
	"value" real,
	"currency" varchar(10) DEFAULT 'USD',
	"probability" real,
	"expected_close_date" timestamp with time zone,
	"description" text,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deliberations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"topic" text NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"created_by_id" uuid NOT NULL,
	"objectives" jsonb DEFAULT '[]'::jsonb,
	"constraints" jsonb DEFAULT '[]'::jsonb,
	"max_rounds" integer DEFAULT 5 NOT NULL,
	"current_round" integer DEFAULT 0 NOT NULL,
	"consensus_threshold" integer DEFAULT 70 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "experts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"expertise" varchar(500) NOT NULL,
	"description" text,
	"system_prompt" text NOT NULL,
	"ai_config" jsonb NOT NULL,
	"category" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quoorum_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"key_prefix" varchar(20) NOT NULL,
	"scopes" jsonb DEFAULT '["debates:read","debates:write"]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"request_count" integer DEFAULT 0 NOT NULL,
	"last_ip" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quoorum_consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" uuid,
	"conversation_id" uuid,
	"original_message" text NOT NULL,
	"triggers" jsonb NOT NULL,
	"urgency" "consultation_urgency" DEFAULT 'low' NOT NULL,
	"complexity_confidence" real,
	"strategy" text,
	"response_approach" "response_approach",
	"talking_points" jsonb,
	"avoid_saying" jsonb,
	"risks_to_address" jsonb,
	"opportunities_to_leverage" jsonb,
	"negotiation_guidance" jsonb,
	"recommend_human_escalation" boolean DEFAULT false,
	"escalation_reason" text,
	"advice_confidence" real,
	"was_advice_used" boolean DEFAULT true,
	"processing_time_ms" integer,
	"user_rating" integer,
	"user_feedback" text,
	"client_context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quoorum_context_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"source_type" varchar(20) NOT NULL,
	"source_data" jsonb,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quoorum_custom_experts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"expertise" jsonb NOT NULL,
	"philosophy" text NOT NULL,
	"approach" text NOT NULL,
	"style" text NOT NULL,
	"training_docs" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quoorum_deal_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"debate_id" uuid NOT NULL,
	"deal_id" uuid NOT NULL,
	"context" "debate_deal_context" DEFAULT 'general' NOT NULL,
	"notes" text,
	"influence" "debate_influence" DEFAULT 'unknown',
	"influence_notes" text,
	"recommendation_followed" boolean,
	"outcome_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quoorum_deal_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"deal_id" uuid NOT NULL,
	"recommendation" text NOT NULL,
	"confidence" text,
	"based_on_debates" jsonb,
	"suggested_actions" jsonb,
	"risk_factors" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"dismissed_at" timestamp with time zone,
	"dismiss_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quoorum_debate_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quoorum_debate_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quoorum_debate_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"industry" varchar(50),
	"category" varchar(50),
	"question_template" text NOT NULL,
	"suggested_experts" jsonb,
	"default_context" jsonb,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quoorum_debates" (
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
	"shared_with" jsonb,
	"view_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quoorum_expert_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"debate_id" uuid NOT NULL,
	"expert_id" text NOT NULL,
	"rating" integer NOT NULL,
	"sentiment" "feedback_sentiment" DEFAULT 'neutral' NOT NULL,
	"comment" text,
	"insightfulness" integer,
	"relevance" integer,
	"clarity" integer,
	"actionability" integer,
	"was_followed" boolean,
	"was_successful" boolean,
	"outcome_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quoorum_expert_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expert_id" varchar(100) NOT NULL,
	"total_debates" integer DEFAULT 0 NOT NULL,
	"total_wins" integer DEFAULT 0 NOT NULL,
	"avg_quality_score" real,
	"avg_consensus_score" real,
	"chemistry_scores" jsonb,
	"topic_performance" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quoorum_expert_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expert_id" text NOT NULL,
	"total_ratings" integer DEFAULT 0 NOT NULL,
	"avg_rating" integer,
	"avg_insightfulness" integer,
	"avg_relevance" integer,
	"avg_clarity" integer,
	"avg_actionability" integer,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"neutral_count" integer DEFAULT 0 NOT NULL,
	"unhelpful_count" integer DEFAULT 0 NOT NULL,
	"followed_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quoorum_expert_ratings_expert_id_unique" UNIQUE("expert_id")
);
--> statement-breakpoint
CREATE TABLE "quoorum_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"round" integer NOT NULL,
	"agent_key" varchar(50) NOT NULL,
	"agent_name" varchar(100),
	"content" text NOT NULL,
	"is_compressed" boolean DEFAULT true,
	"tokens_used" integer,
	"cost_usd" numeric(10, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quoorum_notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"debate_completed" jsonb DEFAULT '{"enabled":true,"channels":["in_app","email"]}'::jsonb,
	"new_comment" jsonb DEFAULT '{"enabled":true,"channels":["in_app"]}'::jsonb,
	"debate_shared" jsonb DEFAULT '{"enabled":true,"channels":["in_app","email"]}'::jsonb,
	"weekly_digest" jsonb DEFAULT '{"enabled":true,"dayOfWeek":1,"hour":9}'::jsonb,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"quiet_hours_start" text,
	"quiet_hours_end" text,
	"timezone" text DEFAULT 'Europe/Madrid',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quoorum_notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "quoorum_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "quoorum_notification_type" NOT NULL,
	"priority" "quoorum_notification_priority" DEFAULT 'normal' NOT NULL,
	"debate_id" uuid,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"action_url" text,
	"action_label" text,
	"metadata" jsonb,
	"channels" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quoorum_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "quoorum_report_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"format" "quoorum_report_format" DEFAULT 'pdf' NOT NULL,
	"status" "quoorum_report_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"file_url" text,
	"file_size" integer,
	"file_name" text,
	"parameters" jsonb,
	"summary" jsonb,
	"share_token" text,
	"expires_at" timestamp with time zone,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quoorum_scheduled_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "quoorum_report_type" NOT NULL,
	"format" "quoorum_report_format" DEFAULT 'pdf' NOT NULL,
	"schedule" jsonb NOT NULL,
	"delivery_method" jsonb NOT NULL,
	"parameters" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_report_id" uuid,
	"next_run_at" timestamp with time zone,
	"run_count" integer DEFAULT 0 NOT NULL,
	"fail_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quoorum_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"question" text NOT NULL,
	"manual_context" text,
	"use_internet" boolean DEFAULT false,
	"use_repo" boolean DEFAULT false,
	"repo_path" text,
	"status" varchar(20) DEFAULT 'running' NOT NULL,
	"total_rounds" integer DEFAULT 0,
	"consensus_score" numeric(4, 2),
	"final_ranking" jsonb,
	"total_cost_usd" numeric(10, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quoorum_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"translation" text NOT NULL,
	"tokens_used" integer,
	"cost_usd" numeric(10, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quoorum_webhook_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_id" uuid NOT NULL,
	"event" varchar(50) NOT NULL,
	"payload" jsonb,
	"success" boolean NOT NULL,
	"status_code" integer,
	"response_body" text,
	"error_message" text,
	"delivery_duration_ms" integer,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quoorum_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) DEFAULT 'Webhook' NOT NULL,
	"url" text NOT NULL,
	"secret" varchar(64),
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_triggered_at" timestamp with time zone,
	"last_success_at" timestamp with time zone,
	"last_failure_at" timestamp with time zone,
	"last_error_message" text,
	"success_count" integer DEFAULT 0 NOT NULL,
	"fail_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opinions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"expert_id" uuid NOT NULL,
	"content" text NOT NULL,
	"reasoning" text NOT NULL,
	"confidence" real NOT NULL,
	"quality_score" real,
	"position" integer,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"tier" "plan_tier" DEFAULT 'free' NOT NULL,
	"description" text,
	"monthly_price_usd" integer DEFAULT 0 NOT NULL,
	"yearly_price_usd" integer DEFAULT 0 NOT NULL,
	"stripe_price_id_monthly" varchar(255),
	"stripe_price_id_yearly" varchar(255),
	"stripe_product_id" varchar(255),
	"debates_per_month" integer DEFAULT 5 NOT NULL,
	"max_experts" integer DEFAULT 4 NOT NULL,
	"max_rounds_per_debate" integer DEFAULT 3 NOT NULL,
	"max_team_members" integer DEFAULT 1 NOT NULL,
	"features" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" varchar(255),
	"name" varchar(255),
	"full_name" varchar(255),
	"avatar_url" text,
	"role" varchar(100) DEFAULT 'user',
	"settings" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deliberation_id" uuid NOT NULL,
	"round_number" integer NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"summary" text,
	"moderator_notes" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"trial_start" timestamp with time zone,
	"trial_end" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"debates_used" integer DEFAULT 0 NOT NULL,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"api_calls_used" integer DEFAULT 0 NOT NULL,
	"total_cost_usd" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"avatar_url" text,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"expert_id" uuid NOT NULL,
	"opinion_id" uuid NOT NULL,
	"weight" real DEFAULT 1 NOT NULL,
	"score" integer NOT NULL,
	"justification" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_role_id_admin_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."admin_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_deliberation_id_deliberations_id_fk" FOREIGN KEY ("deliberation_id") REFERENCES "public"."deliberations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consensus" ADD CONSTRAINT "consensus_deliberation_id_deliberations_id_fk" FOREIGN KEY ("deliberation_id") REFERENCES "public"."deliberations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consensus" ADD CONSTRAINT "consensus_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliberations" ADD CONSTRAINT "deliberations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_api_keys" ADD CONSTRAINT "quoorum_api_keys_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_consultations" ADD CONSTRAINT "quoorum_consultations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_consultations" ADD CONSTRAINT "quoorum_consultations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_consultations" ADD CONSTRAINT "quoorum_consultations_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_context_sources" ADD CONSTRAINT "quoorum_context_sources_session_id_quoorum_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quoorum_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_custom_experts" ADD CONSTRAINT "quoorum_custom_experts_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_deal_links" ADD CONSTRAINT "quoorum_deal_links_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_deal_links" ADD CONSTRAINT "quoorum_deal_links_debate_id_quoorum_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."quoorum_debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_deal_links" ADD CONSTRAINT "quoorum_deal_links_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_deal_recommendations" ADD CONSTRAINT "quoorum_deal_recommendations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_deal_recommendations" ADD CONSTRAINT "quoorum_deal_recommendations_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_debate_comments" ADD CONSTRAINT "quoorum_debate_comments_debate_id_quoorum_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."quoorum_debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_debate_comments" ADD CONSTRAINT "quoorum_debate_comments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_debate_comments" ADD CONSTRAINT "quoorum_debate_comments_parent_id_quoorum_debate_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."quoorum_debate_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_debate_likes" ADD CONSTRAINT "quoorum_debate_likes_debate_id_quoorum_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."quoorum_debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_debate_likes" ADD CONSTRAINT "quoorum_debate_likes_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_debate_templates" ADD CONSTRAINT "quoorum_debate_templates_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD CONSTRAINT "quoorum_debates_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_expert_feedback" ADD CONSTRAINT "quoorum_expert_feedback_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_expert_feedback" ADD CONSTRAINT "quoorum_expert_feedback_debate_id_quoorum_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."quoorum_debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_messages" ADD CONSTRAINT "quoorum_messages_session_id_quoorum_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quoorum_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_notification_preferences" ADD CONSTRAINT "quoorum_notification_preferences_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_notifications" ADD CONSTRAINT "quoorum_notifications_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_notifications" ADD CONSTRAINT "quoorum_notifications_debate_id_quoorum_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."quoorum_debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_reports" ADD CONSTRAINT "quoorum_reports_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_scheduled_reports" ADD CONSTRAINT "quoorum_scheduled_reports_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_translations" ADD CONSTRAINT "quoorum_translations_message_id_quoorum_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."quoorum_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_webhook_logs" ADD CONSTRAINT "quoorum_webhook_logs_webhook_id_quoorum_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."quoorum_webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_webhooks" ADD CONSTRAINT "quoorum_webhooks_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opinions" ADD CONSTRAINT "opinions_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opinions" ADD CONSTRAINT "opinions_expert_id_experts_id_fk" FOREIGN KEY ("expert_id") REFERENCES "public"."experts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_deliberation_id_deliberations_id_fk" FOREIGN KEY ("deliberation_id") REFERENCES "public"."deliberations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage" ADD CONSTRAINT "usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_expert_id_experts_id_fk" FOREIGN KEY ("expert_id") REFERENCES "public"."experts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_opinion_id_opinions_id_fk" FOREIGN KEY ("opinion_id") REFERENCES "public"."opinions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_quoorum_consultations_user" ON "quoorum_consultations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_consultations_client" ON "quoorum_consultations" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_consultations_conversation" ON "quoorum_consultations" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_consultations_created" ON "quoorum_consultations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_quoorum_consultations_urgency" ON "quoorum_consultations" USING btree ("urgency");--> statement-breakpoint
CREATE INDEX "idx_quoorum_context_session" ON "quoorum_context_sources" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_deal_links_user" ON "quoorum_deal_links" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_deal_links_debate" ON "quoorum_deal_links" USING btree ("debate_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_deal_links_deal" ON "quoorum_deal_links" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_deal_links_context" ON "quoorum_deal_links" USING btree ("context");--> statement-breakpoint
CREATE INDEX "idx_quoorum_deal_recs_user" ON "quoorum_deal_recommendations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_deal_recs_deal" ON "quoorum_deal_recommendations" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_deal_recs_active" ON "quoorum_deal_recommendations" USING btree ("deal_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_quoorum_expert_feedback_user" ON "quoorum_expert_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_expert_feedback_debate" ON "quoorum_expert_feedback" USING btree ("debate_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_expert_feedback_expert" ON "quoorum_expert_feedback" USING btree ("expert_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_expert_feedback_rating" ON "quoorum_expert_feedback" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_quoorum_expert_ratings_avg" ON "quoorum_expert_ratings" USING btree ("avg_rating");--> statement-breakpoint
CREATE INDEX "idx_quoorum_messages_session" ON "quoorum_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_messages_round" ON "quoorum_messages" USING btree ("session_id","round");--> statement-breakpoint
CREATE INDEX "idx_quoorum_notifications_user" ON "quoorum_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_notifications_type" ON "quoorum_notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_quoorum_notifications_debate" ON "quoorum_notifications" USING btree ("debate_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_notifications_unread" ON "quoorum_notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_quoorum_notifications_created" ON "quoorum_notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_quoorum_reports_user" ON "quoorum_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_reports_type" ON "quoorum_reports" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_quoorum_reports_status" ON "quoorum_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_quoorum_reports_created" ON "quoorum_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_quoorum_scheduled_reports_user" ON "quoorum_scheduled_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_scheduled_reports_active" ON "quoorum_scheduled_reports" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_quoorum_scheduled_reports_next" ON "quoorum_scheduled_reports" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "idx_quoorum_sessions_user" ON "quoorum_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_sessions_status" ON "quoorum_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_quoorum_sessions_created" ON "quoorum_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_quoorum_translations_message" ON "quoorum_translations" USING btree ("message_id");