/**
 * Forum Public API Schema
 *
 * Database schema for Forum API keys and webhooks.
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'

// ============================================================================
// FORUM API KEYS
// ============================================================================

/**
 * API keys for Forum public API access
 */
export const quoorumApiKeys = pgTable('quoorum_api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Key identification
  name: varchar('name', { length: 100 }).notNull(),
  keyHash: varchar('key_hash', { length: 255 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 20 }).notNull(), // First chars for display

  // Permissions
  scopes: jsonb('scopes').$type<string[]>().notNull().default(['debates:read', 'debates:write']),

  // Status
  isActive: boolean('is_active').notNull().default(true),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),

  // Usage tracking
  requestCount: integer('request_count').notNull().default(0),
  lastIp: varchar('last_ip', { length: 45 }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================================
// FORUM WEBHOOKS
// ============================================================================

/**
 * Webhooks for Quoorum event notifications
 */
export const quoorumWebhooks = pgTable('quoorum_webhooks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Webhook configuration
  name: varchar('name', { length: 100 }).notNull().default('Webhook'),
  url: text('url').notNull(),
  secret: varchar('secret', { length: 64 }),

  // Events to listen for
  events: jsonb('events').$type<string[]>().notNull().default([]),

  // Status
  isActive: boolean('is_active').notNull().default(true),

  // Delivery tracking
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
  lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
  lastFailureAt: timestamp('last_failure_at', { withTimezone: true }),
  lastErrorMessage: text('last_error_message'),

  // Health tracking
  successCount: integer('success_count').notNull().default(0),
  failCount: integer('fail_count').notNull().default(0),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================================
// FORUM WEBHOOK LOGS
// ============================================================================

/**
 * Logs for webhook delivery attempts
 */
export const forumWebhookLogs = pgTable('quoorum_webhook_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  webhookId: uuid('webhook_id')
    .notNull()
    .references(() => quoorumWebhooks.id, { onDelete: 'cascade' }),

  // Event details
  event: varchar('event', { length: 50 }).notNull(),
  payload: jsonb('payload'),

  // Delivery result
  success: boolean('success').notNull(),
  statusCode: integer('status_code'),
  responseBody: text('response_body'),
  errorMessage: text('error_message'),

  // Timing
  deliveryDurationMs: integer('delivery_duration_ms'),
  attemptNumber: integer('attempt_number').notNull().default(1),

  // Timestamp
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================================
// Type Exports
// ============================================================================

export type ForumApiKey = typeof quoorumApiKeys.$inferSelect
export type NewForumApiKey = typeof quoorumApiKeys.$inferInsert

export type QuoorumWebhook = typeof quoorumWebhooks.$inferSelect
export type NewQuoorumWebhook = typeof quoorumWebhooks.$inferInsert

export type ForumWebhookLog = typeof forumWebhookLogs.$inferSelect
export type NewForumWebhookLog = typeof forumWebhookLogs.$inferInsert
