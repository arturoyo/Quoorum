-- Add processing_status column to quoorum_debates table
-- For real-time UI cascade of debate execution events

ALTER TABLE quoorum_debates
ADD COLUMN IF NOT EXISTS processing_status JSONB;

-- Add comment for documentation
COMMENT ON COLUMN quoorum_debates.processing_status IS
'Real-time processing status for UI cascade. Contains: phase, message, progress (0-100), currentRound, totalRounds, timestamp';

-- Create index for faster queries on processing status
CREATE INDEX IF NOT EXISTS idx_quoorum_debates_processing_status
ON quoorum_debates USING gin (processing_status);
