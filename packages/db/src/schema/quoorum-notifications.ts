/**
 * Quoorum Notifications Schema
 *
 * Tracks notifications for Quoorum-related events:
 * - Debate completed
 * - New comment on debate
 * - Expert consensus reached
 * - Team member action on shared debate
 * - Weekly digest
 */

import { pgTable, uuid, text, timestamp, boolean, index, pgEnum, jsonb } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'
import { quoorumDebates } from './quoorum-debates'
import { relations } from 'drizzle-orm'

// ============================================================
// Enums
// ============================================================

export const quoorumNotificationTypeEnum = pgEnum('quoorum_notification_type', [
  'debate_completed',
  'debate_failed',
  'new_comment',
  'comment_reply',
  'debate_shared',
  'consensus_reached',
  'expert_recommendation',
  'weekly_digest',
  'debate_reminder',
  'team_action',
])

export const forumNotificationChannelEnum = pgEnum('quoorum_notification_channel', [
  'in_app',
  'email',
  'push',
  'whatsapp',
])

export const forumNotificationPriorityEnum = pgEnum('quoorum_notification_priority', [
  'low',
  'normal',
  'high',
  'urgent',
])

// ============================================================
// Forum Notifications Table
// ============================================================

export const quoorumNotifications = pgTable('quoorum_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Recipient
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Notification type
  type: quoorumNotificationTypeEnum('type').notNull(),
  priority: forumNotificationPriorityEnum('priority').notNull().default('normal'),

  // Related debate (optional for digest notifications)
  debateId: uuid('debate_id')
    .references(() => quoorumDebates.id, { onDelete: 'cascade' }),

  // Content
  title: text('title').notNull(),
  message: text('message').notNull(),

  // Action
  actionUrl: text('action_url'),
  actionLabel: text('action_label'),

  // Extra data
  metadata: jsonb('metadata').$type<{
    expertId?: string
    commentId?: string
    triggeredBy?: string
    consensusScore?: number
    debateQuestion?: string
    [key: string]: unknown
  }>(),

  // Delivery status per channel
  channels: jsonb('channels').$type<{
    inApp?: { sent: boolean; sentAt?: string; read?: boolean; readAt?: string }
    email?: { sent: boolean; sentAt?: string; opened?: boolean; openedAt?: string }
    push?: { sent: boolean; sentAt?: string; clicked?: boolean }
    whatsapp?: { sent: boolean; sentAt?: string }
  }>(),

  // Read status (for in-app)
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at', { withTimezone: true }),

  // Archived
  isArchived: boolean('is_archived').notNull().default(false),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => ({
  userIdx: index('idx_quoorum_notifications_user').on(table.userId),
  typeIdx: index('idx_quoorum_notifications_type').on(table.type),
  debateIdx: index('idx_quoorum_notifications_debate').on(table.debateId),
  unreadIdx: index('idx_quoorum_notifications_unread').on(table.userId, table.isRead),
  createdAtIdx: index('idx_quoorum_notifications_created').on(table.createdAt),
}))

// ============================================================
// Notification Preferences Table
// ============================================================

export const quoorumNotificationPreferences = pgTable('quoorum_notification_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' })
    .unique(),

  // Per-type preferences
  debateCompleted: jsonb('debate_completed').$type<{
    enabled: boolean
    channels: ('in_app' | 'email' | 'push')[]
  }>().default({ enabled: true, channels: ['in_app', 'email'] }),

  newComment: jsonb('new_comment').$type<{
    enabled: boolean
    channels: ('in_app' | 'email' | 'push')[]
  }>().default({ enabled: true, channels: ['in_app'] }),

  debateShared: jsonb('debate_shared').$type<{
    enabled: boolean
    channels: ('in_app' | 'email' | 'push')[]
  }>().default({ enabled: true, channels: ['in_app', 'email'] }),

  weeklyDigest: jsonb('weekly_digest').$type<{
    enabled: boolean
    dayOfWeek: number // 0-6 (Sunday-Saturday)
    hour: number // 0-23
  }>().default({ enabled: true, dayOfWeek: 1, hour: 9 }),

  // Global settings
  emailEnabled: boolean('email_enabled').notNull().default(true),
  pushEnabled: boolean('push_enabled').notNull().default(true),
  quietHoursStart: text('quiet_hours_start'), // "22:00"
  quietHoursEnd: text('quiet_hours_end'), // "08:00"
  timezone: text('timezone').default('Europe/Madrid'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================
// Relations
// ============================================================

export const quoorumNotificationsRelations = relations(quoorumNotifications, ({ one }) => ({
  user: one(profiles, {
    fields: [quoorumNotifications.userId],
    references: [profiles.id],
  }),
  debate: one(quoorumDebates, {
    fields: [quoorumNotifications.debateId],
    references: [quoorumDebates.id],
  }),
}))

export const quoorumNotificationPreferencesRelations = relations(quoorumNotificationPreferences, ({ one }) => ({
  user: one(profiles, {
    fields: [quoorumNotificationPreferences.userId],
    references: [profiles.id],
  }),
}))

// ============================================================
// Types
// ============================================================

export type ForumNotification = typeof quoorumNotifications.$inferSelect
export type NewForumNotification = typeof quoorumNotifications.$inferInsert
export type ForumNotificationPreference = typeof quoorumNotificationPreferences.$inferSelect
export type NewForumNotificationPreference = typeof quoorumNotificationPreferences.$inferInsert
export type ForumNotificationType =
  | 'debate_completed'
  | 'debate_failed'
  | 'new_comment'
  | 'comment_reply'
  | 'debate_shared'
  | 'consensus_reached'
  | 'expert_recommendation'
  | 'weekly_digest'
  | 'debate_reminder'
  | 'team_action'
export type NotificationChannel = 'in_app' | 'email' | 'push' | 'whatsapp'
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'
