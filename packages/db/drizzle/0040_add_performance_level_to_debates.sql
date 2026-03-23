-- Migration: Add performance_level to quoorum_debates for Just-in-Time cost selection
-- This allows each debate to have its own performance level instead of relying on global user setting

-- Add performance_level column to quoorum_debates
ALTER TABLE quoorum_debates
ADD COLUMN IF NOT EXISTS performance_level VARCHAR(50) DEFAULT 'balanced';

-- Add comment explaining the column
COMMENT ON COLUMN quoorum_debates.performance_level IS
  'Performance tier selected for this specific debate (economic/balanced/performance). Overrides user global setting.';

-- Create index for performance level queries
CREATE INDEX IF NOT EXISTS idx_quoorum_debates_performance_level
ON quoorum_debates(performance_level);

-- Update existing debates to use 'balanced' if null
UPDATE quoorum_debates
SET performance_level = 'balanced'
WHERE performance_level IS NULL;
