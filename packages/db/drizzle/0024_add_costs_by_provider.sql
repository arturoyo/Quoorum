-- Migration: Add costs_by_provider column
-- Date: 2026-01-18
-- Changes: Add costs_by_provider JSONB column to quoorum_debates for provider cost breakdown

-- ============================================================================
-- ADD COSTS_BY_PROVIDER COLUMN TO QUOORUM_DEBATES
-- ============================================================================

ALTER TABLE "public"."quoorum_debates"
  ADD COLUMN IF NOT EXISTS "costs_by_provider" jsonb;

COMMENT ON COLUMN "public"."quoorum_debates"."costs_by_provider" IS
'Cost breakdown by AI provider (denormalized for analytics). Structure: { provider: { costUsd, creditsUsed, tokensUsed, messagesCount } }';

-- ============================================================================
-- CREATE INDEX FOR PERFORMANCE (JSON queries)
-- ============================================================================

-- Index for querying debates by provider cost (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS "idx_quoorum_debates_costs_by_provider"
  ON "public"."quoorum_debates" USING GIN ("costs_by_provider");
