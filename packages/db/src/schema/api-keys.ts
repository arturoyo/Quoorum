import { pgTable, uuid, varchar, timestamp, boolean, integer } from 'drizzle-orm/pg-core'
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
  prefix: varchar('key_prefix', { length: 20 }).notNull(), // quoorum_live_abc... (primeros 20 chars para mostrar)

  // Usage tracking
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  usageCount: integer('usage_count').default(0).notNull(), // Contador de veces usado
  isActive: boolean('is_active').default(true).notNull(), // Soft delete

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}))

export type ApiKey = typeof apiKeys.$inferSelect
export type NewApiKey = typeof apiKeys.$inferInsert
