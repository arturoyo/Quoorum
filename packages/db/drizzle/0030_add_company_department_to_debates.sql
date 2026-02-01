-- Migration: Add company_id and department_id to quoorum_debates
-- Created: 2025-01-22
-- Purpose: Add corporate context columns to debates table

-- Add company_id column
ALTER TABLE "quoorum_debates"
ADD COLUMN IF NOT EXISTS "company_id" uuid REFERENCES "companies"("id") ON DELETE SET NULL;

-- Add department_id column
ALTER TABLE "quoorum_debates"
ADD COLUMN IF NOT EXISTS "department_id" uuid REFERENCES "departments"("id") ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "quoorum_debates_company_id_idx" ON "quoorum_debates"("company_id");
CREATE INDEX IF NOT EXISTS "quoorum_debates_department_id_idx" ON "quoorum_debates"("department_id");
