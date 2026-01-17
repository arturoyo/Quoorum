-- Migration: Multi-Provider Denormalization
-- Description: Add cost tracking by AI provider for analytics
-- Date: 2026-01-17

-- Add costs_by_provider column to quoorum_debates table
-- This denormalizes cost data for faster analytics queries
ALTER TABLE "public"."quoorum_debates"
  ADD COLUMN IF NOT EXISTS "costs_by_provider" jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN "public"."quoorum_debates"."costs_by_provider" IS
'Cost breakdown by AI provider. Structure: { "openai": { "costUsd": 0.5, "creditsUsed": 175, "tokensUsed": 10000, "messagesCount": 5 }, ... }';

-- Note: The rounds JSONB structure already supports provider/model tracking in the TypeScript types
-- No database-level changes needed for rounds as JSONB is schema-less
