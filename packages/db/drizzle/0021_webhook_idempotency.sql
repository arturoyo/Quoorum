-- Migration: Webhook Idempotency System
-- Date: 2026-01-17
-- Changes: Add webhook_events table for preventing replay attacks

-- ============================================================================
-- CREATE WEBHOOK_EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."webhook_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "stripe_event_id" varchar(255) NOT NULL UNIQUE,
  "event_type" varchar(100) NOT NULL,
  "processed" boolean NOT NULL DEFAULT false,
  "processing_started_at" timestamp with time zone,
  "processed_at" timestamp with time zone,
  "user_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "payload" jsonb,
  "error" varchar(1000),
  "retry_count" varchar(10) NOT NULL DEFAULT '0',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for idempotency lookup (most important - used on every webhook)
CREATE INDEX IF NOT EXISTS "idx_webhook_events_stripe_event_id"
  ON "public"."webhook_events"("stripe_event_id");

-- Index for querying processed events
CREATE INDEX IF NOT EXISTS "idx_webhook_events_processed"
  ON "public"."webhook_events"("processed");

-- Index for querying by event type
CREATE INDEX IF NOT EXISTS "idx_webhook_events_event_type"
  ON "public"."webhook_events"("event_type");

-- Index for querying by user
CREATE INDEX IF NOT EXISTS "idx_webhook_events_user_id"
  ON "public"."webhook_events"("user_id");

-- Composite index for retry monitoring
CREATE INDEX IF NOT EXISTS "idx_webhook_events_retry_monitoring"
  ON "public"."webhook_events"("processed", "retry_count", "created_at");

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "public"."webhook_events" IS 'Tracks processed Stripe webhook events for idempotency';
COMMENT ON COLUMN "public"."webhook_events"."stripe_event_id" IS 'Unique Stripe event ID (evt_xxx)';
COMMENT ON COLUMN "public"."webhook_events"."event_type" IS 'Stripe event type (e.g., checkout.session.completed)';
COMMENT ON COLUMN "public"."webhook_events"."processed" IS 'Whether event was successfully processed';
COMMENT ON COLUMN "public"."webhook_events"."processing_started_at" IS 'When processing started (for timeout detection)';
COMMENT ON COLUMN "public"."webhook_events"."processed_at" IS 'When processing completed successfully';
COMMENT ON COLUMN "public"."webhook_events"."payload" IS 'Full event payload (for debugging)';
COMMENT ON COLUMN "public"."webhook_events"."error" IS 'Error message if processing failed';
COMMENT ON COLUMN "public"."webhook_events"."retry_count" IS 'Number of retry attempts';
