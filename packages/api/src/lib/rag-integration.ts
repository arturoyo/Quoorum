/**
 * RAG Integration for Debates
 *
 * Integrates RAG system with debate orchestration.
 * Searches for relevant documents and injects context before debate execution.
 */

import { getRelevantContext } from './rag/search'
import type { SearchOptions } from './rag/search'
import { logger } from './logger'

export interface RAGIntegrationOptions {
  /** User ID for document search */
  userId: string

  /** Company ID for company-wide documents */
  companyId?: string

  /** Debate ID for tracking */
  debateId?: string

  /** Number of top results to include */
  limit?: number

  /** Minimum similarity threshold */
  minSimilarity?: number

  /** Use hybrid search (vector + keyword) */
  hybridSearch?: boolean

  /** Embedding provider override */
  provider?: string

  /** Enable RAG injection (can be disabled per debate) */
  enabled?: boolean
}

export interface RAGInjectionResult {
  /** Original question */
  question: string

  /** Question + RAG context combined */
  enrichedContext: string

  /** RAG context alone (for display) */
  ragContext: string

  /** Whether RAG was used */
  ragUsed: boolean

  /** Number of sources found */
  sourcesCount: number

  /** Search metrics */
  searchMetrics?: {
    duration: number
    resultsCount: number
    provider: string
  }
}

/**
 * Inject RAG Context into Debate
 *
 * Searches for relevant documents and enriches the debate context.
 * Returns enriched context string ready for AI consumption.
 */
export async function injectRAGContext(
  question: string,
  existingContext: string | undefined,
  options: RAGIntegrationOptions
): Promise<RAGInjectionResult> {
  const startTime = Date.now()

  // If RAG is disabled, return original context
  if (options.enabled === false) {
    logger.info('[injectRAGContext] RAG disabled for this debate', {
      debateId: options.debateId,
    })

    return {
      question,
      enrichedContext: existingContext || '',
      ragContext: '',
      ragUsed: false,
      sourcesCount: 0,
    }
  }

  try {
    logger.info('[injectRAGContext] Searching for relevant documents', {
      question: question.substring(0, 100),
      userId: options.userId,
      companyId: options.companyId,
      debateId: options.debateId,
      hybridSearch: options.hybridSearch,
    })

    // Search for relevant documents
    const ragContext = await getRelevantContext(question, {
      userId: options.userId,
      companyId: options.companyId,
      debateId: options.debateId,
      limit: options.limit || 5,
      minSimilarity: options.minSimilarity || 0.5,
      hybridMode: options.hybridSearch !== undefined ? options.hybridSearch : true, // Default to hybrid
      provider: options.provider,
    })

    const duration = Date.now() - startTime

    // Check if any context was found
    const sourcesCount = ragContext.includes('[1]') ? ragContext.split(/\[\d+\]/).length - 1 : 0

    if (sourcesCount === 0 || ragContext === 'No relevant context found.') {
      logger.info('[injectRAGContext] No relevant documents found', {
        question: question.substring(0, 100),
        duration,
      })

      return {
        question,
        enrichedContext: existingContext || '',
        ragContext: '',
        ragUsed: false,
        sourcesCount: 0,
        searchMetrics: {
          duration,
          resultsCount: 0,
          provider: options.provider || 'default',
        },
      }
    }

    // Combine RAG context with existing context
    const combinedContext = combineContexts(existingContext, ragContext)

    logger.info('[injectRAGContext] RAG context injected successfully', {
      question: question.substring(0, 100),
      sourcesCount,
      duration,
      contextLength: combinedContext.length,
    })

    return {
      question,
      enrichedContext: combinedContext,
      ragContext,
      ragUsed: true,
      sourcesCount,
      searchMetrics: {
        duration,
        resultsCount: sourcesCount,
        provider: options.provider || 'default',
      },
    }
  } catch (error) {
    logger.error('[injectRAGContext] RAG search failed, continuing without RAG', {
      error,
      question: question.substring(0, 100),
      userId: options.userId,
    })

    // Fail gracefully - continue without RAG
    return {
      question,
      enrichedContext: existingContext || '',
      ragContext: '',
      ragUsed: false,
      sourcesCount: 0,
    }
  }
}

/**
 * Combine existing context with RAG context
 *
 * Merges user-provided context with RAG-retrieved context in a structured way.
 */
function combineContexts(
  existingContext: string | undefined,
  ragContext: string
): string {
  if (!existingContext || existingContext.trim().length === 0) {
    // Only RAG context
    return formatRAGContext(ragContext)
  }

  // Both contexts - combine them
  const parts: string[] = []

  // User context first
  parts.push('## Contexto del Usuario\n\n' + existingContext.trim())

  // RAG context second
  parts.push('\n\n## Documentos Relevantes\n\n' + ragContext.trim())

  return parts.join('\n')
}

/**
 * Format RAG context for AI consumption
 */
function formatRAGContext(ragContext: string): string {
  return `## Documentos Relevantes\n\n${ragContext.trim()}\n\n---\n\nUtiliza la información anterior de los documentos del usuario para informar tu análisis.`
}

/**
 * Extract source metadata from RAG context
 *
 * Parses the RAG context string to extract document metadata for tracking.
 * Used to populate rag_sources field in debates table.
 */
export function extractSourceMetadata(
  ragContext: string
): Array<{ documentName: string; similarity: number }> {
  if (!ragContext || ragContext === 'No relevant context found.') {
    return []
  }

  const sources: Array<{ documentName: string; similarity: number }> = []

  // Parse format: "[1] document-name.pdf (similarity: 85.3%)"
  const regex = /\[(\d+)\]\s+([^\(]+)\s+\(similarity:\s+([\d.]+)%\)/g
  let match

  while ((match = regex.exec(ragContext)) !== null) {
    sources.push({
      documentName: match[2]!.trim(),
      similarity: parseFloat(match[3]!),
    })
  }

  return sources
}

/**
 * Calculate RAG quality score
 *
 * Evaluates the quality of RAG context based on:
 * - Number of sources found
 * - Average similarity
 * - Context length
 */
export function calculateRAGQualityScore(
  result: RAGInjectionResult
): number {
  if (!result.ragUsed || result.sourcesCount === 0) {
    return 0
  }

  const sources = extractSourceMetadata(result.ragContext)

  if (sources.length === 0) {
    return 0
  }

  // Calculate average similarity
  const avgSimilarity = sources.reduce((sum, s) => sum + s.similarity, 0) / sources.length

  // Calculate score (0-100)
  // - 50% weight on average similarity
  // - 30% weight on source count (more sources = better, up to 5)
  // - 20% weight on context length (longer = better, up to 2000 chars)

  const similarityScore = avgSimilarity // Already 0-100
  const sourceScore = Math.min(result.sourcesCount / 5, 1) * 100
  const contextScore = Math.min(result.ragContext.length / 2000, 1) * 100

  const finalScore =
    similarityScore * 0.5 + sourceScore * 0.3 + contextScore * 0.2

  return Math.round(finalScore)
}
