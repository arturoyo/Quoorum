/**
 * Embedding Preferences Schema
 *
 * User/company preferences for embedding provider selection.
 */

import { pgTable, uuid, boolean, timestamp, index, unique, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { profiles } from './index'
import { companies } from './companies'
import { embeddingProviders } from './embedding-providers'

export const embeddingPreferences = pgTable(
  'embedding_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Scope (either user_id OR company_id, not both)
    userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),

    // Provider selection
    primaryProviderId: uuid('primary_provider_id')
      .notNull()
      .references(() => embeddingProviders.id),
    fallbackProviderIds: uuid('fallback_provider_ids')
      .array()
      .default(sql`ARRAY[]::UUID[]`),

    // Settings
    autoFallback: boolean('auto_fallback').default(true).notNull(),
    cacheEmbeddings: boolean('cache_embeddings').default(true).notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('idx_embedding_preferences_user').on(table.userId),
    companyIdx: index('idx_embedding_preferences_company').on(table.companyId),
    userUnique: unique('embedding_preferences_user_id_key').on(table.userId),
    companyUnique: unique('embedding_preferences_company_id_key').on(table.companyId),
    // Check constraint: either user_id OR company_id, not both
    scopeCheck: check(
      'embedding_preferences_scope_check',
      sql`(user_id IS NOT NULL AND company_id IS NULL) OR (user_id IS NULL AND company_id IS NOT NULL)`
    ),
  })
)

export type EmbeddingPreference = typeof embeddingPreferences.$inferSelect
export type NewEmbeddingPreference = typeof embeddingPreferences.$inferInsert
