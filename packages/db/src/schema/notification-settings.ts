import { pgTable, uuid, boolean, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

/**
 * Configuración de notificaciones por usuario
 */
export const notificationSettings = pgTable('notification_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),

  // Email notifications
  emailNotifications: boolean('email_notifications').notNull().default(true),
  debateUpdates: boolean('debate_updates').notNull().default(true),
  weeklyDigest: boolean('weekly_digest').notNull().default(true),

  // Push notifications
  pushNotifications: boolean('push_notifications').notNull().default(false),

  // Security & Marketing
  securityAlerts: boolean('security_alerts').notNull().default(true),
  marketingEmails: boolean('marketing_emails').notNull().default(false),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
  user: one(users, {
    fields: [notificationSettings.userId],
    references: [users.id],
  }),
}))

export type NotificationSettings = typeof notificationSettings.$inferSelect
export type NewNotificationSettings = typeof notificationSettings.$inferInsert
