/**
 * Vector Search Engine
 *
 * Dimension-agnostic semantic search using pgvector.
 * Supports hybrid search (vector + keyword), re-ranking, and performance tracking.
 */

import { db } from '@quoorum/db'
import { sql } from 'drizzle-orm'
import { generateEmbedding } from '@quoorum/ai/embeddings'
import type { EmbeddingOptions } from '@quoorum/ai/embeddings'
import { logger } from '../logger'

export interface SearchOptions {
  /** User ID for context isolation */
  userId: string

  /** Company ID for company-level search (optional) */
  companyId?: string

  /** Debate ID for debate-specific search (optional) */
  debateId?: string

  /** Number of results to return */
  limit?: number

  /** Minimum similarity threshold (0-1) */
  minSimilarity?: number

  /** Enable hybrid search (vector + keyword) */
  hybridMode?: boolean

  /** Re-rank results (slower but more accurate) */
  rerank?: boolean

  /** Embedding provider to use */
  provider?: string

  /** Embedding model to use */
  model?: string

  /** Filter by document IDs */
  documentIds?: string[]

  /** Filter by metadata */
  metadata?: Record<string, unknown>
}

export interface SearchResult {
  /** Chunk ID */
  chunkId: string

  /** Document ID */
  documentId: string

  /** Chunk content */
  content: string

  /** Similarity score (0-1, higher is better) */
  similarity: number

  /** Chunk metadata */
  metadata: {
    startPos: number
    endPos: number
    tokenCount: number
    chunkIndex: number
    pageNumber?: number
    sectionTitle?: string
    [key: string]: unknown
  }

  /** Document metadata */
  document: {
    fileName: string
    fileType: string
    uploadedAt: Date
    tags?: string[]
  }

  /** Re-ranking score (if rerank=true) */
  rerankScore?: number
}

export interface SearchMetrics {
  /** Total search duration (ms) */
  duration: number

  /** Embedding generation time (ms) */
  embeddingTime: number

  /** Vector search time (ms) */
  searchTime: number

  /** Number of results found */
  resultsCount: number

  /** Embedding provider used */
  provider: string

  /** Embedding dimensions */
  dimensions: number

  /** Estimated cost (credits) */
  cost: number
}

/**
 * Semantic Search
 *
 * Searches documents using vector similarity (cosine distance).
 * Works with any embedding dimension.
 */
export async function semanticSearch(
  query: string,
  options: SearchOptions
): Promise<{ results: SearchResult[]; metrics: SearchMetrics }> {
  const startTime = Date.now()
  const limit = options.limit || 10
  const minSimilarity = options.minSimilarity || 0.5

  try {
    // 1. Generate query embedding
    const embeddingStart = Date.now()
    const embeddingOptions: EmbeddingOptions = {
      userId: options.userId,
      provider: options.provider,
      model: options.model,
    }

    const { embedding, provider, dimensions, cost } = await generateEmbedding(
      query,
      embeddingOptions
    )

    const embeddingTime = Date.now() - embeddingStart

    logger.info('[semanticSearch] Query embedding generated', {
      query: query.substring(0, 100),
      provider: provider.name,
      dimensions,
      embeddingTime,
    })

    // 2. Build WHERE clause for filtering
    const filters: string[] = ['vc.user_id = $1']
    const params: unknown[] = [options.userId]
    let paramIndex = 2

    if (options.companyId) {
      filters.push(`vc.company_id = $${paramIndex}`)
      params.push(options.companyId)
      paramIndex++
    }

    if (options.debateId) {
      filters.push(`vc.debate_id = $${paramIndex}`)
      params.push(options.debateId)
      paramIndex++
    }

    if (options.documentIds && options.documentIds.length > 0) {
      filters.push(`vc.document_id = ANY($${paramIndex})`)
      params.push(options.documentIds)
      paramIndex++
    }

    // Filter by dimensions (only search chunks with matching dimensions)
    filters.push(`vc.dimensions = $${paramIndex}`)
    params.push(dimensions)
    paramIndex++

    const whereClause = filters.join(' AND ')

    // 3. Perform vector search using pgvector
    // Note: pgvector uses <=> for cosine distance (0 = identical, 2 = opposite)
    // We convert to similarity: 1 - (distance / 2)
    const searchStart = Date.now()

    const rawResults = await db.execute(sql`
      SELECT
        vc.id as chunk_id,
        vc.document_id,
        vc.content,
        vc.metadata as chunk_metadata,
        vd.file_name,
        vd.file_type,
        vd.uploaded_at,
        vd.metadata as document_metadata,
        1 - (vc.embedding <=> ${JSON.stringify(embedding)}::vector) / 2 as similarity
      FROM vector_chunks vc
      JOIN vector_documents vd ON vc.document_id = vd.id
      WHERE ${sql.raw(whereClause)}
        AND 1 - (vc.embedding <=> ${JSON.stringify(embedding)}::vector) / 2 >= ${minSimilarity}
      ORDER BY vc.embedding <=> ${JSON.stringify(embedding)}::vector
      LIMIT ${limit}
    `)

    const searchTime = Date.now() - searchStart

    // 4. Format results
    const results: SearchResult[] = (rawResults as any[]).map((row) => ({
      chunkId: row.chunk_id,
      documentId: row.document_id,
      content: row.content,
      similarity: parseFloat(row.similarity),
      metadata: row.chunk_metadata,
      document: {
        fileName: row.file_name,
        fileType: row.file_type,
        uploadedAt: new Date(row.uploaded_at),
        tags: row.document_metadata?.tags || [],
      },
    }))

    const totalDuration = Date.now() - startTime

    const metrics: SearchMetrics = {
      duration: totalDuration,
      embeddingTime,
      searchTime,
      resultsCount: results.length,
      provider: provider.name,
      dimensions,
      cost,
    }

    logger.info('[semanticSearch] Search completed', {
      resultsCount: results.length,
      ...metrics,
    })

    // 5. Re-rank if requested (for better accuracy)
    if (options.rerank && results.length > 0) {
      return rerankResults(query, results, metrics)
    }

    return { results, metrics }
  } catch (error) {
    logger.error('[semanticSearch] Search failed', {
      error,
      query: query.substring(0, 100),
      options,
    })

    throw new Error('Semantic search failed')
  }
}

/**
 * Hybrid Search
 *
 * Combines vector similarity with keyword matching for better recall.
 * Uses RRF (Reciprocal Rank Fusion) to merge results.
 */
export async function hybridSearch(
  query: string,
  options: SearchOptions
): Promise<{ results: SearchResult[]; metrics: SearchMetrics }> {
  const startTime = Date.now()

  try {
    // 1. Perform vector search
    const { results: vectorResults, metrics: vectorMetrics } =
      await semanticSearch(query, { ...options, hybridMode: false })

    // 2. Perform keyword search (PostgreSQL full-text search)
    const keywordStart = Date.now()
    const keywordResults = await keywordSearch(query, options)
    const keywordTime = Date.now() - keywordStart

    logger.info('[hybridSearch] Keyword search completed', {
      resultsCount: keywordResults.length,
      keywordTime,
    })

    // 3. Merge using Reciprocal Rank Fusion (RRF)
    const merged = mergeResultsRRF(vectorResults, keywordResults)

    const totalDuration = Date.now() - startTime

    const metrics: SearchMetrics = {
      duration: totalDuration,
      embeddingTime: vectorMetrics.embeddingTime,
      searchTime: vectorMetrics.searchTime + keywordTime,
      resultsCount: merged.length,
      provider: vectorMetrics.provider,
      dimensions: vectorMetrics.dimensions,
      cost: vectorMetrics.cost,
    }

    logger.info('[hybridSearch] Hybrid search completed', {
      vectorCount: vectorResults.length,
      keywordCount: keywordResults.length,
      mergedCount: merged.length,
      ...metrics,
    })

    return { results: merged, metrics }
  } catch (error) {
    logger.error('[hybridSearch] Hybrid search failed', {
      error,
      query: query.substring(0, 100),
      options,
    })

    throw new Error('Hybrid search failed')
  }
}

/**
 * Keyword Search
 *
 * Uses PostgreSQL full-text search for keyword matching.
 * Fallback when vector search is unavailable or for exact matches.
 */
async function keywordSearch(
  query: string,
  options: SearchOptions
): Promise<SearchResult[]> {
  const limit = options.limit || 10

  // Build WHERE clause
  const filters: string[] = ['vc.user_id = $1']
  const params: unknown[] = [options.userId]
  let paramIndex = 2

  if (options.companyId) {
    filters.push(`vc.company_id = $${paramIndex}`)
    params.push(options.companyId)
    paramIndex++
  }

  if (options.debateId) {
    filters.push(`vc.debate_id = $${paramIndex}`)
    params.push(options.debateId)
    paramIndex++
  }

  if (options.documentIds && options.documentIds.length > 0) {
    filters.push(`vc.document_id = ANY($${paramIndex})`)
    params.push(options.documentIds)
    paramIndex++
  }

  const whereClause = filters.join(' AND ')

  // Use PostgreSQL full-text search with ts_rank for ranking
  const rawResults = await db.execute(sql`
    SELECT
      vc.id as chunk_id,
      vc.document_id,
      vc.content,
      vc.metadata as chunk_metadata,
      vd.file_name,
      vd.file_type,
      vd.uploaded_at,
      vd.metadata as document_metadata,
      ts_rank(to_tsvector('spanish', vc.content), plainto_tsquery('spanish', ${query})) as rank
    FROM vector_chunks vc
    JOIN vector_documents vd ON vc.document_id = vd.id
    WHERE ${sql.raw(whereClause)}
      AND to_tsvector('spanish', vc.content) @@ plainto_tsquery('spanish', ${query})
    ORDER BY rank DESC
    LIMIT ${limit}
  `)

  return (rawResults as any[]).map((row) => ({
    chunkId: row.chunk_id,
    documentId: row.document_id,
    content: row.content,
    similarity: parseFloat(row.rank), // Use rank as similarity score
    metadata: row.chunk_metadata,
    document: {
      fileName: row.file_name,
      fileType: row.file_type,
      uploadedAt: new Date(row.uploaded_at),
      tags: row.document_metadata?.tags || [],
    },
  }))
}

/**
 * Reciprocal Rank Fusion (RRF)
 *
 * Merges two result sets by combining their ranks.
 * Formula: RRF(d) = Σ 1 / (k + rank(d))
 * where k is a constant (default: 60)
 */
function mergeResultsRRF(
  vectorResults: SearchResult[],
  keywordResults: SearchResult[]
): SearchResult[] {
  const k = 60 // RRF constant
  const scores = new Map<string, { result: SearchResult; score: number }>()

  // Add vector results
  vectorResults.forEach((result, index) => {
    const rank = index + 1
    const score = 1 / (k + rank)

    scores.set(result.chunkId, {
      result,
      score,
    })
  })

  // Add keyword results
  keywordResults.forEach((result, index) => {
    const rank = index + 1
    const score = 1 / (k + rank)

    const existing = scores.get(result.chunkId)
    if (existing) {
      // Combine scores
      existing.score += score
    } else {
      scores.set(result.chunkId, {
        result,
        score,
      })
    }
  })

  // Sort by RRF score and return
  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .map((item) => ({
      ...item.result,
      similarity: item.score, // Use RRF score as similarity
    }))
}

/**
 * Re-rank Results
 *
 * Uses cross-encoder model for better accuracy.
 * Slower but produces higher quality results.
 *
 * NOTE: This is a placeholder for future implementation.
 * For now, just returns original results.
 */
async function rerankResults(
  query: string,
  results: SearchResult[],
  metrics: SearchMetrics
): Promise<{ results: SearchResult[]; metrics: SearchMetrics }> {
  // TODO: Implement cross-encoder re-ranking
  // For now, just return original results

  logger.info('[rerankResults] Re-ranking not yet implemented, returning original results')

  return { results, metrics }
}

/**
 * Get Relevant Context
 *
 * Convenience function that searches and formats results as context string.
 * Useful for injecting into AI prompts.
 */
export async function getRelevantContext(
  query: string,
  options: SearchOptions
): Promise<string> {
  const { results } = options.hybridMode
    ? await hybridSearch(query, options)
    : await semanticSearch(query, options)

  if (results.length === 0) {
    return 'No relevant context found.'
  }

  // Format as context string
  const context = results
    .map((result, index) => {
      const header = `[${index + 1}] ${result.document.fileName} (similarity: ${(result.similarity * 100).toFixed(1)}%)`
      const content = result.content.trim()

      return `${header}\n${content}`
    })
    .join('\n\n---\n\n')

  return context
}
