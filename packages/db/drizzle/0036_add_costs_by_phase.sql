-- Migration: Add costs_by_phase to quoorum_debates
-- Created: 2026-01-27
-- Description: Adds cost breakdown by debate phase (context, experts, strategy, debate, synthesis)

ALTER TABLE "quoorum_debates" ADD COLUMN "costs_by_phase" jsonb;

COMMENT ON COLUMN "quoorum_debates"."costs_by_phase" IS 'Cost breakdown by debate phase: context, experts, strategy, revision, debate, synthesis';
