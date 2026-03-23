/**
 * RAG Queries Schema
 *
 * Tracking of RAG queries for analytics and improvement.
 */

import { pgTable, uuid, text, integer, real, boolean, timestamp, index, customType } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { profiles } from './index'
import { quoorumDebates } from './quoorum-debates'
import { embeddingProviders } from './embedding-providers'

// Custom type for pgvector
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector'
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value)
  },
  fromDriver(value: string): number[] {
    if (typeof value === 'string') {
      return JSON.parse(value) as number[]
    }
    return value as unknown as number[]
  },
})

export const ragQueries = pgTable(
  'rag_queries',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // User & context
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    debateId: uuid('debate_id').references(() => quoorumDebates.id, { onDelete: 'set null' }),

    // Query
    query: text('query').notNull(),
    queryEmbedding: vector('query_embedding'),

    // Provider used
    embeddingProviderId: uuid('embedding_provider_id').references(() => embeddingProviders.id),

    // Results
    retrievedChunks: uuid('retrieved_chunks')
      .array()
      .default(sql`ARRAY[]::UUID[]`),
    topK: integer('top_k').default(5),
    similarityThreshold: real('similarity_threshold').default(0.7),

    // Performance metrics
    embeddingDurationMs: integer('embedding_duration_ms'),
    searchDurationMs: integer('search_duration_ms'),
    totalDurationMs: integer('total_duration_ms'),

    // Fallback tracking
    primaryProviderUsed: boolean('primary_provider_used').default(true),
    fallbackProviderUsed: uuid('fallback_provider_used').references(() => embeddingProviders.id),

    // User feedback (for improving the system)
    userRating: integer('user_rating'), // 1-5 stars
    wasHelpful: boolean('was_helpful'),

    // Timestamp
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('idx_rag_queries_user').on(table.userId),
    debateIdx: index('idx_rag_queries_debate').on(table.debateId),
    createdIdx: index('idx_rag_queries_created').on(table.createdAt),
  })
)

export type RagQuery = typeof ragQueries.$inferSelect
export type NewRagQuery = typeof ragQueries.$inferInsert
