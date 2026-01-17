-- Migration: Add Theme Confidence Score
-- Description: Add confidence score for theme selection (3-tier system)
-- Date: 2026-01-17

-- Add themeConfidence column to quoorum_debates table
ALTER TABLE "public"."quoorum_debates"
  ADD COLUMN IF NOT EXISTS "theme_confidence" real;

-- Add comment explaining the field
COMMENT ON COLUMN "public"."quoorum_debates"."theme_confidence" IS
'Confidence score of theme selection (0-1). Used by 3-tier system: >0.4 = themed, 0.2-0.4 = domain-specific, <0.2 = generic.';
