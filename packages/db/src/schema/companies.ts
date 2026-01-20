/**
 * Companies Schema
 * Stores company-wide context and master information
 */

import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { departments } from './departments'

export const companies = pgTable('companies', {
  // Primary key
  id: uuid('id').defaultRandom().primaryKey(),

  // Foreign keys
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Company information
  name: varchar('name', { length: 200 }).notNull(),

  // Master context (Layer 2: Mission, vision, values)
  context: text('context').notNull(), // "Misión: ..., Visión: ..., Valores: ..."

  // Optional fields
  industry: varchar('industry', { length: 100 }), // "SaaS B2B", "E-commerce", etc.
  size: varchar('size', { length: 50 }), // "1-10", "11-50", "51-200", etc.
  description: text('description'), // Brief company description

  // Status
  isActive: boolean('is_active').notNull().default(true),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Relations
export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(users, {
    fields: [companies.userId],
    references: [users.id],
  }),
  departments: many(departments),
}))

// Types
export type Company = typeof companies.$inferSelect
export type NewCompany = typeof companies.$inferInsert
