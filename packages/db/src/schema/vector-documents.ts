/**
 * Vector Documents Schema
 *
 * Documents uploaded by users for RAG (PDF, DOCX, TXT, etc.).
 */

import { pgTable, uuid, varchar, integer, text, timestamp, index } from 'drizzle-orm/pg-core'
import { profiles } from './index'
import { companies } from './companies'
import { embeddingProviders } from './embedding-providers'

export const vectorDocuments = pgTable(
  'vector_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Ownership
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),

    // File metadata
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileType: varchar('file_type', { length: 50 }).notNull(),
    fileSize: integer('file_size'),
    fileUrl: text('file_url'),

    // Content
    rawContent: text('raw_content'),
    processedContent: text('processed_content'),

    // Embedding configuration (what was actually used)
    embeddingProviderId: uuid('embedding_provider_id').references(() => embeddingProviders.id),
    embeddingModel: varchar('embedding_model', { length: 100 }),
    embeddingDimensions: integer('embedding_dimensions'),

    // Chunking configuration
    chunkStrategy: varchar('chunk_strategy', { length: 50 })
      .default('recursive')
      .$type<'recursive' | 'semantic' | 'fixed'>(),
    chunkSize: integer('chunk_size').default(1000),
    chunkOverlap: integer('chunk_overlap').default(200),
    totalChunks: integer('total_chunks').default(0),

    // Processing status
    processingStatus: varchar('processing_status', { length: 50 })
      .default('pending')
      .notNull()
      .$type<'pending' | 'processing' | 'completed' | 'failed'>(),
    errorMessage: text('error_message'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    processedAt: timestamp('processed_at'),
  },
  (table) => ({
    userIdx: index('idx_vector_documents_user').on(table.userId),
    companyIdx: index('idx_vector_documents_company').on(table.companyId),
    providerIdx: index('idx_vector_documents_provider').on(table.embeddingProviderId),
    statusIdx: index('idx_vector_documents_status').on(table.processingStatus),
  })
)

export type VectorDocument = typeof vectorDocuments.$inferSelect
export type NewVectorDocument = typeof vectorDocuments.$inferInsert
