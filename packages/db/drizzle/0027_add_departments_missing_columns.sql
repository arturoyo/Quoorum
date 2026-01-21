-- Migration: Add missing columns to departments table
-- Created: 2025-01-21
-- Adds: description, icon, is_predefined columns

-- Add description column
ALTER TABLE "departments"
ADD COLUMN IF NOT EXISTS "description" text;

-- Add icon column
ALTER TABLE "departments"
ADD COLUMN IF NOT EXISTS "icon" varchar(50);

-- Add is_predefined column
ALTER TABLE "departments"
ADD COLUMN IF NOT EXISTS "is_predefined" boolean DEFAULT false NOT NULL;

-- Update existing departments to have is_predefined = false by default
UPDATE "departments" SET "is_predefined" = false WHERE "is_predefined" IS NULL;
