/**
 * Embedding Providers Schema
 *
 * Registry of available embedding providers (OpenAI, Ollama, custom pods).
 */

import { pgTable, uuid, varchar, text, integer, real, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const embeddingProviders = pgTable(
  'embedding_providers',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Provider info
    name: varchar('name', { length: 100 }).notNull().unique(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    providerType: varchar('provider_type', { length: 50 }).notNull().$type<'cloud' | 'self-hosted' | 'hybrid'>(),

    // Model configuration
    defaultModel: varchar('default_model', { length: 100 }),
    supportedModels: jsonb('supported_models').notNull().default(sql`'[]'::jsonb`).$type<string[]>(),

    // Embedding dimensions
    dimensions: integer('dimensions').notNull(),
    maxBatchSize: integer('max_batch_size').default(1),

    // API configuration (nullable for self-hosted)
    apiEndpoint: text('api_endpoint'),
    requiresApiKey: boolean('requires_api_key').default(false),

    // Performance & costs
    avgLatencyMs: integer('avg_latency_ms'),
    costPer1kTokens: real('cost_per_1k_tokens').default(0),

    // Status
    isActive: boolean('is_active').default(true).notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    healthCheckUrl: text('health_check_url'),
    lastHealthCheck: timestamp('last_health_check'),

    // Metadata
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_embedding_providers_active').on(table.isActive),
    defaultIdx: index('idx_embedding_providers_default').on(table.isDefault),
  })
)

export type EmbeddingProvider = typeof embeddingProviders.$inferSelect
export type NewEmbeddingProvider = typeof embeddingProviders.$inferInsert
