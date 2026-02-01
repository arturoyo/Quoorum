CREATE TYPE "public"."company_size" AS ENUM('solo', 'small_2_10', 'medium_11_50', 'large_50_plus');--> statement-breakpoint
CREATE TYPE "public"."company_stage" AS ENUM('idea', 'mvp', 'early_revenue', 'growth', 'scale', 'mature');--> statement-breakpoint
CREATE TYPE "public"."decision_style" AS ENUM('fast_intuitive', 'balanced', 'thorough_analytical');--> statement-breakpoint
CREATE TYPE "public"."department_type" AS ENUM('finance', 'marketing', 'operations', 'hr', 'sales', 'product', 'engineering', 'customer_success', 'legal', 'custom');--> statement-breakpoint
CREATE TYPE "public"."industry_type" AS ENUM('saas', 'ecommerce', 'fintech', 'healthtech', 'edtech', 'marketplace', 'consumer', 'enterprise', 'hardware', 'services', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_role_type" AS ENUM('founder', 'ceo', 'cto', 'product_manager', 'investor', 'consultant', 'team_lead', 'individual_contributor', 'other');--> statement-breakpoint
CREATE TYPE "public"."team_member_role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."team_member_status" AS ENUM('pending', 'active', 'inactive', 'removed');--> statement-breakpoint
ALTER TYPE "public"."debate_status" ADD VALUE 'draft' BEFORE 'pending';--> statement-breakpoint
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
ALTER TABLE "api_keys" ALTER COLUMN "key_prefix" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "experts" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "experts" ADD COLUMN "library_expert_id" uuid;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD COLUMN "total_credits_used" integer;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD COLUMN "theme_id" varchar(50);--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD COLUMN "theme_confidence" real;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD COLUMN "costs_by_provider" jsonb;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD COLUMN "processing_status" jsonb;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "monthly_credits" integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage" ADD COLUMN "credits_deducted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage" ADD COLUMN "model_used" varchar(100);--> statement-breakpoint
ALTER TABLE "usage" ADD COLUMN "phase" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "credits" integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tier" "user_tier" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debate_frameworks" ADD CONSTRAINT "debate_frameworks_debate_id_quoorum_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."quoorum_debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debate_frameworks" ADD CONSTRAINT "debate_frameworks_framework_id_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_id_departments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_owner_id_profiles_id_fk" FOREIGN KEY ("team_owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_member_profile_id_profiles_id_fk" FOREIGN KEY ("member_profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_invited_by_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_backstory" ADD CONSTRAINT "user_backstory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_context_files" ADD CONSTRAINT "user_context_files_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_context_files_user" ON "user_context_files" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_context_files_active" ON "user_context_files" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_user_context_files_created" ON "user_context_files" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD CONSTRAINT "quoorum_debates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quoorum_debates" ADD CONSTRAINT "quoorum_debates_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN "permissions";--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN "expires_at";