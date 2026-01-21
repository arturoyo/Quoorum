-- Migration: Add user_backstory table for onboarding context
-- Created: 2026-01-21

-- Create enums
DO $$ BEGIN
 CREATE TYPE "public"."user_role_type" AS ENUM('founder', 'ceo', 'cto', 'product_manager', 'investor', 'consultant', 'team_lead', 'individual_contributor', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."industry_type" AS ENUM('saas', 'ecommerce', 'fintech', 'healthtech', 'edtech', 'marketplace', 'consumer', 'enterprise', 'hardware', 'services', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."company_size" AS ENUM('solo', 'small_2_10', 'medium_11_50', 'large_50_plus');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."company_stage" AS ENUM('idea', 'mvp', 'early_revenue', 'growth', 'scale', 'mature');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."decision_style" AS ENUM('fast_intuitive', 'balanced', 'thorough_analytical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create user_backstory table
CREATE TABLE IF NOT EXISTS "user_backstory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL UNIQUE,
	"company_name" varchar(255),
	"role" "user_role_type",
	"industry" "industry_type",
	"company_size" "company_size",
	"company_stage" "company_stage",
	"decision_style" "decision_style",
	"additional_context" text,
	"preferences" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "user_backstory" ADD CONSTRAINT "user_backstory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS "user_backstory_user_id_idx" ON "user_backstory" ("user_id");
