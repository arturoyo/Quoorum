/**
 * Vector Chunks Schema
 *
 * Document chunks with vector embeddings (dimension-flexible).
 */

import { pgTable, uuid, integer, text, timestamp, jsonb, index, unique, customType } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { vectorDocuments } from './vector-documents'

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
      // PostgreSQL returns vectors as strings like "[1,2,3]"
      return JSON.parse(value) as number[]
    }
    return value as unknown as number[]
  },
})

export const vectorChunks = pgTable(
  'vector_chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => vectorDocuments.id, { onDelete: 'cascade' }),

    // Chunk data
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),

    // Vector embedding (dimension-flexible)
    embedding: vector('embedding'),

    // Metadata (JSON for flexibility)
    metadata: jsonb('metadata').default(sql`'{}'::jsonb`).$type<Record<string, unknown>>(),

    // Timestamp
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    documentIdx: index('idx_vector_chunks_document').on(table.documentId),
    uniqueChunk: unique('vector_chunks_document_id_chunk_index_key').on(
      table.documentId,
      table.chunkIndex
    ),
  })
)

export type VectorChunk = typeof vectorChunks.$inferSelect
export type NewVectorChunk = typeof vectorChunks.$inferInsert
