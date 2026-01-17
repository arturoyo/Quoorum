/**
 * Webhook Events Schema
 *
 * Tracks processed webhook events for idempotency
 */

import { pgTable, uuid, varchar, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core'
import { users } from './users'

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Stripe event ID (unique identifier for idempotency)
  stripeEventId: varchar('stripe_event_id', { length: 255 }).notNull().unique(),

  // Event type (e.g., 'checkout.session.completed')
  eventType: varchar('event_type', { length: 100 }).notNull(),

  // Processing status
  processed: boolean('processed').notNull().default(false),
  processingStartedAt: timestamp('processing_started_at', { withTimezone: true }),
  processedAt: timestamp('processed_at', { withTimezone: true }),

  // User affected by this webhook (nullable - some events don't have userId)
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Event payload (for debugging)
  payload: jsonb('payload').$type<Record<string, unknown>>(),

  // Error tracking
  error: varchar('error', { length: 1000 }),
  retryCount: varchar('retry_count', { length: 10 }).notNull().default('0'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============================================================================
// TYPES
// ============================================================================

export type WebhookEvent = typeof webhookEvents.$inferSelect
export type NewWebhookEvent = typeof webhookEvents.$inferInsert
