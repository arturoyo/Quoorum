/**
 * RAG Analytics Schema
 *
 * Tracks RAG usage, quality scores, and document performance
 * for measuring ROI and impact
 */

import { pgTable, uuid, varchar, text, integer, real, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { profiles } from './auth'
import { companies } from './companies'
import { quoorumDebates } from './quoorum-debates'
import { vectorDocuments } from './vector-documents'

// ============================================================================
// RAG USAGE ANALYTICS
// ============================================================================

export const ragUsageAnalytics = pgTable(
  'rag_usage_analytics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id').references(() => companies.id, {
      onDelete: 'cascade',
    }),

    // Event tracking
    eventType: varchar('event_type', { length: 50 }).notNull(), // 'document_upload', 'search', 'debate_injection', 'manual_search'

    // Context
    debateId: uuid('debate_id').references(() => quoorumDebates.id, {
      onDelete: 'cascade',
    }),
    documentId: uuid('document_id').references(() => vectorDocuments.id, {
      onDelete: 'set null',
    }),

    // Performance metrics
    queryText: text('query_text'),
    resultsCount: integer('results_count'),
    avgSimilarity: real('avg_similarity'),
    searchDurationMs: integer('search_duration_ms'),

    // Cost tracking
    tokensUsed: integer('tokens_used').default(0),
    estimatedCost: real('estimated_cost').default(0),

    // Quality metrics
    userClickedResult: boolean('user_clicked_result').default(false),
    userRating: integer('user_rating'), // 1-5

    // Metadata
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),

    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_rag_analytics_user').on(table.userId),
    companyIdx: index('idx_rag_analytics_company').on(table.companyId),
    debateIdx: index('idx_rag_analytics_debate').on(table.debateId),
    eventIdx: index('idx_rag_analytics_event').on(table.eventType),
    createdIdx: index('idx_rag_analytics_created').on(table.createdAt),
  })
)

export type RAGUsageAnalytic = typeof ragUsageAnalytics.$inferSelect
export type NewRAGUsageAnalytic = typeof ragUsageAnalytics.$inferInsert

// ============================================================================
// RAG QUALITY SCORES
// ============================================================================

export const ragQualityScores = pgTable(
  'rag_quality_scores',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    debateId: uuid('debate_id')
      .notNull()
      .references(() => quoorumDebates.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    // Quality metrics (0-1)
    relevanceScore: real('relevance_score'), // How relevant was RAG context
    usageScore: real('usage_score'), // How much was RAG context used
    impactScore: real('impact_score'), // Did RAG improve outcome
    overallScore: real('overall_score'), // Weighted average

    // Evidence
    sourcesUsed: integer('sources_used').default(0),
    sourcesCited: integer('sources_cited').default(0),
    debateQualityDelta: real('debate_quality_delta'),

    // User feedback
    userSatisfaction: integer('user_satisfaction'), // 1-5
    userFoundHelpful: boolean('user_found_helpful'),
    userComments: text('user_comments'),

    // Metadata
    calculationMethod: varchar('calculation_method', { length: 50 }).default(
      'auto'
    ), // 'auto', 'manual', 'ml_model'
    calculatedAt: timestamp('calculated_at').defaultNow(),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    debateIdx: index('idx_rag_quality_debate').on(table.debateId),
    userIdx: index('idx_rag_quality_user').on(table.userId),
    overallIdx: index('idx_rag_quality_overall').on(table.overallScore),
  })
)

export type RAGQualityScore = typeof ragQualityScores.$inferSelect
export type NewRAGQualityScore = typeof ragQualityScores.$inferInsert

// ============================================================================
// RAG DOCUMENT PERFORMANCE
// ============================================================================

export const ragDocumentPerformance = pgTable(
  'rag_document_performance',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => vectorDocuments.id, { onDelete: 'cascade' }),

    // Usage statistics
    totalSearches: integer('total_searches').default(0),
    totalRetrievals: integer('total_retrievals').default(0),
    totalClicks: integer('total_clicks').default(0),
    totalCitations: integer('total_citations').default(0),

    // Performance metrics
    avgSimilarity: real('avg_similarity'),
    avgRank: real('avg_rank'),
    clickThroughRate: real('click_through_rate'),

    // Time-based metrics
    lastUsedAt: timestamp('last_used_at'),
    usageTrend: varchar('usage_trend', { length: 20 }), // 'increasing', 'stable', 'decreasing'

    // Quality indicators
    avgUserRating: real('avg_user_rating'),
    totalRatings: integer('total_ratings').default(0),

    // Computed fields
    relevanceScore: real('relevance_score'), // Composite score
    popularityScore: real('popularity_score'), // How often retrieved

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    documentIdx: index('idx_rag_doc_perf_document').on(table.documentId),
    relevanceIdx: index('idx_rag_doc_perf_relevance').on(table.relevanceScore),
    lastUsedIdx: index('idx_rag_doc_perf_last_used').on(table.lastUsedAt),
  })
)

export type RAGDocumentPerformance = typeof ragDocumentPerformance.$inferSelect
export type NewRAGDocumentPerformance = typeof ragDocumentPerformance.$inferInsert

// ============================================================================
// RAG DOCUMENT SHARES
// ============================================================================

export const ragDocumentShares = pgTable(
  'rag_document_shares',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => vectorDocuments.id, { onDelete: 'cascade' }),

    // Sharing context
    sharedBy: uuid('shared_by')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    sharedWithUser: uuid('shared_with_user').references(() => profiles.id, {
      onDelete: 'cascade',
    }),
    sharedWithCompany: uuid('shared_with_company').references(
      () => companies.id,
      { onDelete: 'cascade' }
    ),

    // Permissions
    canView: boolean('can_view').default(true),
    canEdit: boolean('can_edit').default(false),
    canReshare: boolean('can_reshare').default(false),

    // Tracking
    accessCount: integer('access_count').default(0),
    lastAccessedAt: timestamp('last_accessed_at'),

    // Metadata
    shareNote: text('share_note'),
    expiresAt: timestamp('expires_at'),

    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    documentIdx: index('idx_rag_shares_document').on(table.documentId),
    userIdx: index('idx_rag_shares_user').on(table.sharedWithUser),
    companyIdx: index('idx_rag_shares_company').on(table.sharedWithCompany),
  })
)

export type RAGDocumentShare = typeof ragDocumentShares.$inferSelect
export type NewRAGDocumentShare = typeof ragDocumentShares.$inferInsert
