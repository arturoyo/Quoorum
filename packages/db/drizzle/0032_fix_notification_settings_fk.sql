-- Migration: Fix notification_settings foreign key
-- Date: 2026-01-22
-- Reason: user_id was referencing users.id but should reference profiles.id
--         The tRPC context uses profiles.id as ctx.user.id, not users.id

-- Drop the old foreign key constraint (if exists)
ALTER TABLE notification_settings
DROP CONSTRAINT IF EXISTS notification_settings_user_id_fkey;

ALTER TABLE notification_settings
DROP CONSTRAINT IF EXISTS notification_settings_user_id_users_id_fk;

-- Add new foreign key constraint referencing profiles.id
ALTER TABLE notification_settings
ADD CONSTRAINT notification_settings_user_id_profiles_id_fk
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
