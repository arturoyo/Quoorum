import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

/**
 * API Keys para acceso programático
 */
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Key info
  name: varchar('name', { length: 100 }).notNull(),
  keyHash: varchar('key_hash', { length: 255 }).notNull(), // Hash SHA-256 de la key
  prefix: varchar('prefix', { length: 20 }).notNull(), // quoorum_live_abc... (primeros 20 chars para mostrar)

  // Usage tracking
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  usageCount: uuid('usage_count').default('0'), // Contador de veces usado

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }), // Soft delete
})

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}))

export type ApiKey = typeof apiKeys.$inferSelect
export type NewApiKey = typeof apiKeys.$inferInsert
