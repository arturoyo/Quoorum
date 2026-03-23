-- Migration: Deprecate notification_settings table
-- Date: 2026-01-22
-- Reason: Unified notification system - using quoorum_notification_preferences instead
--
-- This migration adds a comment to the table marking it as deprecated.
-- We don't drop it immediately to allow for a grace period.
--
-- Related changes:
-- - Removed packages/api/src/routers/notifications.ts (orphaned router)
-- - Removed notification_settings from appRouter
-- - All notifications now use quoorumNotifications router
-- - Helper functions migrated to packages/api/src/routers/quoorum-notifications.ts
--
-- TODO: After verifying no data is needed, run cleanup migration to drop table

-- Add comment to table marking as deprecated
COMMENT ON TABLE notification_settings IS 'DEPRECATED: Use quoorum_notification_preferences instead. Will be dropped in future migration.';

-- Add comment to each column for reference
COMMENT ON COLUMN notification_settings.email_notifications IS 'DEPRECATED: Migrated to quoorum_notification_preferences.email_enabled';
COMMENT ON COLUMN notification_settings.debate_updates IS 'DEPRECATED: Migrated to quoorum_notification_preferences.debate_completed';
COMMENT ON COLUMN notification_settings.weekly_digest IS 'DEPRECATED: Migrated to quoorum_notification_preferences.weekly_digest';
COMMENT ON COLUMN notification_settings.push_notifications IS 'DEPRECATED: Migrated to quoorum_notification_preferences.push_enabled';
