/**
 * RAG (Retrieval-Augmented Generation) System
 *
 * Provider-agnostic RAG implementation with intelligent chunking,
 * vector search, and semantic retrieval.
 */

export {
  chunkDocument,
  filterChunks,
  mergeSmallChunks,
  type Chunk,
  type ChunkOptions,
  type ChunkMetadata,
} from './chunking'

export {
  processDocument,
  extractFileTypeMetadata,
  cleanTextForEmbedding,
  detectLanguage,
  splitIntoSections,
  type ProcessedDocument,
  type DocumentMetadata,
} from './document-processor'

export {
  semanticSearch,
  hybridSearch,
  getRelevantContext,
  type SearchOptions,
  type SearchResult,
  type SearchMetrics,
} from './search'
