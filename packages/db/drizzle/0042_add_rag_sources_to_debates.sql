-- Migration: Add RAG sources tracking to debates
-- This allows tracking which documents were used in each debate

ALTER TABLE quoorum_debates
ADD COLUMN IF NOT EXISTS rag_sources JSONB DEFAULT NULL;

-- Add index for querying debates that used RAG
CREATE INDEX IF NOT EXISTS idx_quoorum_debates_rag_sources
ON quoorum_debates USING gin (rag_sources)
WHERE rag_sources IS NOT NULL;

-- Comment
COMMENT ON COLUMN quoorum_debates.rag_sources IS 'RAG sources used in this debate: [{ documentName, similarity, chunkId }]';
