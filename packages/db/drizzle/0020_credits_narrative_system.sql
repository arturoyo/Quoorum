-- Migration: Credits and Narrative System
-- Date: 2026-01-17
-- Changes: Add credits system, narrative identities, and tier-based orchestration

-- ============================================================================
-- 1. ADD USER TIER ENUM
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "public"."user_tier" AS ENUM('free', 'starter', 'pro', 'business');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. MODIFY USERS TABLE - Add credits and tier
-- ============================================================================

ALTER TABLE "public"."users"
  ADD COLUMN IF NOT EXISTS "credits" integer NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS "tier" "public"."user_tier" NOT NULL DEFAULT 'free';

COMMENT ON COLUMN "public"."users"."credits" IS 'User credit balance (1 credit = $0.005 USD)';
COMMENT ON COLUMN "public"."users"."tier" IS 'User subscription tier for AI orchestration';

-- ============================================================================
-- 3. MODIFY SUBSCRIPTIONS TABLE - Add monthly credits
-- ============================================================================

ALTER TABLE "public"."subscriptions"
  ADD COLUMN IF NOT EXISTS "monthly_credits" integer NOT NULL DEFAULT 1000;

COMMENT ON COLUMN "public"."subscriptions"."monthly_credits" IS 'Credits allocated per month based on plan';

-- ============================================================================
-- 4. MODIFY USAGE TABLE - Add credits tracking fields
-- ============================================================================

ALTER TABLE "public"."usage"
  ADD COLUMN IF NOT EXISTS "credits_deducted" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "model_used" varchar(100),
  ADD COLUMN IF NOT EXISTS "phase" varchar(50);

COMMENT ON COLUMN "public"."usage"."credits_deducted" IS 'Credits consumed in period';
COMMENT ON COLUMN "public"."usage"."model_used" IS 'Last AI model used (for audit logs)';
COMMENT ON COLUMN "public"."usage"."phase" IS 'Last debate phase (initial/debate/synthesis)';

-- ============================================================================
-- 5. MODIFY QUOORUM_DEBATES TABLE - Add credits and theme tracking
-- ============================================================================

ALTER TABLE "public"."quoorum_debates"
  ADD COLUMN IF NOT EXISTS "total_credits_used" integer,
  ADD COLUMN IF NOT EXISTS "theme_id" varchar(50);

COMMENT ON COLUMN "public"."quoorum_debates"."total_credits_used" IS 'Total credits consumed (formula: costUsd * 1.75 / 0.005)';
COMMENT ON COLUMN "public"."quoorum_debates"."theme_id" IS 'Narrative theme applied (e.g., greek-mythology)';

-- ============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for querying users by tier (for AI orchestration)
CREATE INDEX IF NOT EXISTS "idx_users_tier" ON "public"."users"("tier");

-- Index for querying debates by theme
CREATE INDEX IF NOT EXISTS "idx_quoorum_debates_theme_id" ON "public"."quoorum_debates"("theme_id");

-- ============================================================================
-- 7. UPDATE EXISTING DATA (OPTIONAL - MIGRATION ONLY)
-- ============================================================================

-- Calculate credits_used for existing debates based on totalCostUsd
-- Formula: credits = CEIL(costUsd * 1.75 / 0.005) = CEIL(costUsd * 350)
UPDATE "public"."quoorum_debates"
SET "total_credits_used" = CEIL(COALESCE("total_cost_usd", 0) * 350)
WHERE "total_credits_used" IS NULL
  AND "total_cost_usd" IS NOT NULL;

-- Set default theme for existing debates
UPDATE "public"."quoorum_debates"
SET "theme_id" = 'greek-mythology'
WHERE "theme_id" IS NULL
  AND "status" = 'completed';
