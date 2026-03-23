-- Migration: 0041_add_rag_system_agnostic.sql
-- Description: Add RAG (Retrieval-Augmented Generation) system with provider-agnostic embeddings
-- Created: 2026-01-31

-- ============================================
-- ENABLE PGVECTOR EXTENSION
-- ============================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- EMBEDDING PROVIDERS REGISTRY
-- ============================================

CREATE TABLE IF NOT EXISTS embedding_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Provider info
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('cloud', 'self-hosted', 'hybrid')),

  -- Model configuration
  default_model VARCHAR(100),
  supported_models JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Embedding dimensions
  dimensions INTEGER NOT NULL,
  max_batch_size INTEGER DEFAULT 1,

  -- API configuration (nullable for self-hosted)
  api_endpoint TEXT,
  requires_api_key BOOLEAN DEFAULT false,

  -- Performance & costs
  avg_latency_ms INTEGER,
  cost_per_1k_tokens REAL DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  health_check_url TEXT,
  last_health_check TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_embedding_providers_active ON embedding_providers(is_active);
CREATE INDEX idx_embedding_providers_default ON embedding_providers(is_default);

-- ============================================
-- USER/COMPANY EMBEDDING PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS embedding_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scope (either user_id OR company_id, not both)
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Provider selection
  primary_provider_id UUID NOT NULL REFERENCES embedding_providers(id),
  fallback_provider_ids UUID[] DEFAULT ARRAY[]::UUID[],

  -- Settings
  auto_fallback BOOLEAN DEFAULT true,
  cache_embeddings BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id),
  UNIQUE(company_id),
  CHECK (
    (user_id IS NOT NULL AND company_id IS NULL) OR
    (user_id IS NULL AND company_id IS NOT NULL)
  )
);

CREATE INDEX idx_embedding_preferences_user ON embedding_preferences(user_id);
CREATE INDEX idx_embedding_preferences_company ON embedding_preferences(company_id);

-- ============================================
-- VECTOR DOCUMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS vector_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- File metadata
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER,
  file_url TEXT,

  -- Content
  raw_content TEXT,
  processed_content TEXT,

  -- Embedding configuration (what was actually used)
  embedding_provider_id UUID REFERENCES embedding_providers(id),
  embedding_model VARCHAR(100),
  embedding_dimensions INTEGER,

  -- Chunking configuration
  chunk_strategy VARCHAR(50) DEFAULT 'recursive' CHECK (chunk_strategy IN ('recursive', 'semantic', 'fixed')),
  chunk_size INTEGER DEFAULT 1000,
  chunk_overlap INTEGER DEFAULT 200,
  total_chunks INTEGER DEFAULT 0,

  -- Processing status
  processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX idx_vector_documents_user ON vector_documents(user_id);
CREATE INDEX idx_vector_documents_company ON vector_documents(company_id);
CREATE INDEX idx_vector_documents_provider ON vector_documents(embedding_provider_id);
CREATE INDEX idx_vector_documents_status ON vector_documents(processing_status);

-- ============================================
-- VECTOR CHUNKS (DIMENSION-FLEXIBLE)
-- ============================================

CREATE TABLE IF NOT EXISTS vector_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES vector_documents(id) ON DELETE CASCADE,

  -- Chunk data
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,

  -- Vector embedding (dimension-flexible, supports 384-16000 dims)
  embedding vector,

  -- Metadata (JSON for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(document_id, chunk_index)
);

CREATE INDEX idx_vector_chunks_document ON vector_chunks(document_id);

-- Create dimension-specific indexes for common embedding sizes
-- These will be created dynamically as documents with different dimensions are added

-- Example for 384 dims (HuggingFace small models)
CREATE INDEX IF NOT EXISTS idx_vector_chunks_384_ivfflat ON vector_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100)
  WHERE embedding IS NOT NULL AND vector_dims(embedding) = 384;

-- Example for 768 dims (Ollama all-minilm, BERT)
CREATE INDEX IF NOT EXISTS idx_vector_chunks_768_ivfflat ON vector_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100)
  WHERE embedding IS NOT NULL AND vector_dims(embedding) = 768;

-- Example for 1024 dims (Ollama mxbai-embed-large, Cohere)
CREATE INDEX IF NOT EXISTS idx_vector_chunks_1024_ivfflat ON vector_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100)
  WHERE embedding IS NOT NULL AND vector_dims(embedding) = 1024;

-- Example for 1536 dims (OpenAI text-embedding-3-small, ada-002)
CREATE INDEX IF NOT EXISTS idx_vector_chunks_1536_ivfflat ON vector_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100)
  WHERE embedding IS NOT NULL AND vector_dims(embedding) = 1536;

-- Example for 3072 dims (OpenAI text-embedding-3-large)
CREATE INDEX IF NOT EXISTS idx_vector_chunks_3072_ivfflat ON vector_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100)
  WHERE embedding IS NOT NULL AND vector_dims(embedding) = 3072;

-- ============================================
-- RAG QUERIES TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS rag_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User & context
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  debate_id UUID REFERENCES quoorum_debates(id) ON DELETE SET NULL,

  -- Query
  query TEXT NOT NULL,
  query_embedding vector,

  -- Provider used
  embedding_provider_id UUID REFERENCES embedding_providers(id),

  -- Results
  retrieved_chunks UUID[] DEFAULT ARRAY[]::UUID[],
  top_k INTEGER DEFAULT 5,
  similarity_threshold REAL DEFAULT 0.7,

  -- Performance metrics
  embedding_duration_ms INTEGER,
  search_duration_ms INTEGER,
  total_duration_ms INTEGER,

  -- Fallback tracking
  primary_provider_used BOOLEAN DEFAULT true,
  fallback_provider_used UUID REFERENCES embedding_providers(id),

  -- User feedback (for improving the system)
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  was_helpful BOOLEAN,

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rag_queries_user ON rag_queries(user_id);
CREATE INDEX idx_rag_queries_debate ON rag_queries(debate_id);
CREATE INDEX idx_rag_queries_created ON rag_queries(created_at DESC);

-- ============================================
-- SEED DEFAULT PROVIDERS
-- ============================================

INSERT INTO embedding_providers (name, display_name, provider_type, default_model, supported_models, dimensions, cost_per_1k_tokens, is_default, is_active)
VALUES
  -- OpenAI (Cloud)
  (
    'openai',
    'OpenAI Embeddings',
    'cloud',
    'text-embedding-3-small',
    '["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"]'::jsonb,
    1536,
    0.00002,
    true,
    true
  ),

  -- Ollama (Self-Hosted)
  (
    'local-ollama',
    'Ollama (Local)',
    'self-hosted',
    'all-minilm',
    '["all-minilm", "nomic-embed-text", "mxbai-embed-large"]'::jsonb,
    768,
    0,
    false,
    false  -- Disabled by default, enable via env var
  ),

  -- Custom (Self-Hosted, for AI pods)
  (
    'custom',
    'Custom Provider',
    'self-hosted',
    'default',
    '["default"]'::jsonb,
    768,
    0,
    false,
    false  -- Disabled by default, enable via env var
  )
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get dimension-specific index name
CREATE OR REPLACE FUNCTION get_vector_index_name(dims INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN 'idx_vector_chunks_' || dims::TEXT || '_ivfflat';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create index for a specific dimension if it doesn't exist
CREATE OR REPLACE FUNCTION ensure_vector_index(dims INTEGER)
RETURNS VOID AS $$
DECLARE
  index_name TEXT;
  index_exists BOOLEAN;
BEGIN
  index_name := get_vector_index_name(dims);

  -- Check if index exists
  SELECT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE tablename = 'vector_chunks'
    AND indexname = index_name
  ) INTO index_exists;

  -- Create index if it doesn't exist
  IF NOT index_exists THEN
    EXECUTE format(
      'CREATE INDEX %I ON vector_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100) WHERE embedding IS NOT NULL AND vector_dims(embedding) = %s',
      index_name,
      dims
    );
    RAISE NOTICE 'Created vector index for % dimensions', dims;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_embedding_providers_updated_at
  BEFORE UPDATE ON embedding_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_embedding_preferences_updated_at
  BEFORE UPDATE ON embedding_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vector_documents_updated_at
  BEFORE UPDATE ON vector_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE embedding_providers IS 'Registry of available embedding providers (OpenAI, Ollama, custom pods)';
COMMENT ON TABLE embedding_preferences IS 'User/company preferences for embedding provider selection';
COMMENT ON TABLE vector_documents IS 'Documents uploaded by users for RAG (PDF, DOCX, TXT, etc.)';
COMMENT ON TABLE vector_chunks IS 'Document chunks with vector embeddings (dimension-flexible)';
COMMENT ON TABLE rag_queries IS 'Tracking of RAG queries for analytics and improvement';

COMMENT ON COLUMN vector_chunks.embedding IS 'Vector embedding (dimension-flexible, supports 384-16000 dims)';
COMMENT ON FUNCTION ensure_vector_index IS 'Automatically create pgvector index for a specific dimension if needed';
