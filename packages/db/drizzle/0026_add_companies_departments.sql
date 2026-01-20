-- Migration: Add companies and departments tables for corporate context
-- Created: 2025-01-20

-- Create companies table
CREATE TABLE IF NOT EXISTS "companies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(200) NOT NULL,
  "context" text NOT NULL,
  "industry" varchar(100),
  "size" varchar(50),
  "description" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create department_type enum
DO $$ BEGIN
  CREATE TYPE "department_type" AS ENUM ('marketing', 'sales', 'product', 'engineering', 'hr', 'finance', 'customer_success', 'operations', 'legal', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create departments table
CREATE TABLE IF NOT EXISTS "departments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "type" "department_type" NOT NULL,
  "department_context" text NOT NULL,
  "base_prompt" text NOT NULL,
  "custom_prompt" text,
  "agent_role" text,
  "temperature" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "companies_user_id_idx" ON "companies"("user_id");
CREATE INDEX IF NOT EXISTS "departments_company_id_idx" ON "departments"("company_id");
