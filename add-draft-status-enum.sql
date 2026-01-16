-- Migration: Add 'draft' status to debate_status enum
-- Date: 2026-01-15
-- Description: Adds 'draft' as a new status value for debates to support draft creation

-- Add 'draft' value to the enum (PostgreSQL 9.1+)
-- Note: ALTER TYPE ADD VALUE cannot run inside a transaction block
ALTER TYPE debate_status ADD VALUE IF NOT EXISTS 'draft';

-- Verify the enum values
SELECT unnest(enum_range(NULL::debate_status)) AS debate_status_values;
