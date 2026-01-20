-- Create user_context_files table
-- Run this with: docker exec -i quoorum-postgres psql -U postgres -d quoorum < scripts/create-user-context-files.sql

CREATE TABLE IF NOT EXISTS user_context_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  file_size INTEGER,
  content_type VARCHAR(100) DEFAULT 'text/plain',
  is_active BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER DEFAULT 0,
  tags TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_context_files_user ON user_context_files(user_id);
CREATE INDEX IF NOT EXISTS idx_user_context_files_active ON user_context_files(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_context_files_created ON user_context_files(created_at);

-- Verify table was created
SELECT 'Table user_context_files created successfully!' AS result;
