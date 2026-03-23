/**
 * RAG Analytics Helper
 *
 * Helper functions for tracking RAG usage without tRPC
 * (for use in non-API contexts like lib/ functions)
 */

import { db } from '@quoorum/db'
import { ragUsageAnalytics } from '@quoorum/db/schema'
import { logger } from '../logger'

export interface TrackRAGUsageOptions {
  userId: string
  companyId?: string
  eventType: 'document_upload' | 'search' | 'debate_injection' | 'manual_search'
  debateId?: string
  documentId?: string
  queryText?: string
  resultsCount?: number
  avgSimilarity?: number
  searchDurationMs?: number
  tokensUsed?: number
  estimatedCost?: number
  metadata?: Record<string, unknown>
}

/**
 * Track RAG usage event directly to database
 *
 * Used by lib/ functions that can't call tRPC procedures
 */
export async function trackRAGUsage(
  options: TrackRAGUsageOptions
): Promise<void> {
  try {
    await db.insert(ragUsageAnalytics).values({
      userId: options.userId,
      companyId: options.companyId || null,
      eventType: options.eventType,
      debateId: options.debateId || null,
      documentId: options.documentId || null,
      queryText: options.queryText || null,
      resultsCount: options.resultsCount || null,
      avgSimilarity: options.avgSimilarity || null,
      searchDurationMs: options.searchDurationMs || null,
      tokensUsed: options.tokensUsed || 0,
      estimatedCost: options.estimatedCost || 0,
      metadata: options.metadata || {},
    })

    logger.debug('[trackRAGUsage] Usage tracked', {
      eventType: options.eventType,
      userId: options.userId,
      debateId: options.debateId,
    })
  } catch (error) {
    // Don't throw - analytics failures shouldn't break main flow
    logger.error('[trackRAGUsage] Failed to track usage', {
      error: error instanceof Error ? error.message : String(error),
      eventType: options.eventType,
    })
  }
}

/**
 * Track multiple RAG usage events in batch
 */
export async function trackRAGUsageBatch(
  events: TrackRAGUsageOptions[]
): Promise<void> {
  try {
    if (events.length === 0) return

    await db.insert(ragUsageAnalytics).values(
      events.map((event) => ({
        userId: event.userId,
        companyId: event.companyId || null,
        eventType: event.eventType,
        debateId: event.debateId || null,
        documentId: event.documentId || null,
        queryText: event.queryText || null,
        resultsCount: event.resultsCount || null,
        avgSimilarity: event.avgSimilarity || null,
        searchDurationMs: event.searchDurationMs || null,
        tokensUsed: event.tokensUsed || 0,
        estimatedCost: event.estimatedCost || 0,
        metadata: event.metadata || {},
      }))
    )

    logger.debug('[trackRAGUsageBatch] Batch tracked', {
      count: events.length,
    })
  } catch (error) {
    logger.error('[trackRAGUsageBatch] Failed to track batch', {
      error: error instanceof Error ? error.message : String(error),
      count: events.length,
    })
  }
}
