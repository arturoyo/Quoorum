import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

/**
 * Sesiones activas de usuarios
 * Registra dispositivos y ubicaciones desde donde se ha iniciado sesión
 */
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Session info
  sessionToken: varchar('session_token', { length: 500 }).notNull().unique(),
  device: varchar('device', { length: 200 }).notNull(), // "Chrome on Windows", "Safari on iPhone"
  browser: varchar('browser', { length: 100 }), // "Chrome 120.0"
  os: varchar('os', { length: 100 }), // "Windows 11", "iOS 17.2"

  // Location
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6 compatible
  location: varchar('location', { length: 200 }), // "Madrid, España"
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),

  // User agent
  userAgent: text('user_agent'),

  // Activity
  lastActive: timestamp('last_active', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
