/**
 * Forum Consultations Schema
 *
 * Tracks automatic Forum consultations that happen during Wallie response generation.
 * These are quick strategic advice lookups for complex conversations (negotiations, objections, VIP clients).
 */

import { pgTable, uuid, text, timestamp, jsonb, real, integer, boolean, index, pgEnum } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'
import { clients } from './clients'
import { conversations } from './conversations'
import { relations } from 'drizzle-orm'

// ============================================================
// Enums
// ============================================================

export const consultationTriggerEnum = pgEnum('consultation_trigger', [
  'price_negotiation',
  'competitor_mention',
  'objection_complex',
  'high_value_client',
  'escalation_risk',
  'contract_terms',
  'strategic_decision',
  'churn_signal',
])

export const responseApproachEnum = pgEnum('response_approach', [
  'empathetic',
  'assertive',
  'consultative',
  'direct',
])

export const consultationUrgencyEnum = pgEnum('consultation_urgency', [
  'low',
  'medium',
  'high',
  'critical',
])

// ============================================================
// Forum Consultations Table
// ============================================================

export const forumConsultations = pgTable('forum_consultations', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Owner
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Related entities (optional - may not always have a client/conversation)
  clientId: uuid('client_id')
    .references(() => clients.id, { onDelete: 'set null' }),
  conversationId: uuid('conversation_id')
    .references(() => conversations.id, { onDelete: 'set null' }),

  // Input context
  originalMessage: text('original_message').notNull(),

  // Complexity analysis
  triggers: jsonb('triggers').$type<string[]>().notNull(),
  urgency: consultationUrgencyEnum('urgency').notNull().default('low'),
  complexityConfidence: real('complexity_confidence'), // 0-1

  // Forum advice
  strategy: text('strategy'),
  responseApproach: responseApproachEnum('response_approach'),
  talkingPoints: jsonb('talking_points').$type<string[]>(),
  avoidSaying: jsonb('avoid_saying').$type<string[]>(),
  risksToAddress: jsonb('risks_to_address').$type<string[]>(),
  opportunitiesToLeverage: jsonb('opportunities_to_leverage').$type<string[]>(),

  // Negotiation guidance (if applicable)
  negotiationGuidance: jsonb('negotiation_guidance').$type<{
    idealOutcome?: string
    fallbackPosition?: string
    leveragePoints?: string[]
  }>(),

  // Escalation
  recommendHumanEscalation: boolean('recommend_human_escalation').default(false),
  escalationReason: text('escalation_reason'),

  // Result
  adviceConfidence: real('advice_confidence'), // 0-100
  wasAdviceUsed: boolean('was_advice_used').default(true),
  processingTimeMs: integer('processing_time_ms'),

  // User feedback (Phase 3: users can rate advice)
  userRating: integer('user_rating'), // 1-5 stars
  userFeedback: text('user_feedback'),

  // Metadata
  clientContext: jsonb('client_context').$type<{
    pipelineStatus?: string
    intentScore?: number
    sentimentScore?: number
    discType?: string
    isVIP?: boolean
    clientValue?: number
  }>(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_forum_consultations_user').on(table.userId),
  clientIdx: index('idx_forum_consultations_client').on(table.clientId),
  conversationIdx: index('idx_forum_consultations_conversation').on(table.conversationId),
  createdAtIdx: index('idx_forum_consultations_created').on(table.createdAt),
  urgencyIdx: index('idx_forum_consultations_urgency').on(table.urgency),
}))

// ============================================================
// Relations
// ============================================================

export const forumConsultationsRelations = relations(forumConsultations, ({ one }) => ({
  user: one(profiles, {
    fields: [forumConsultations.userId],
    references: [profiles.id],
  }),
  client: one(clients, {
    fields: [forumConsultations.clientId],
    references: [clients.id],
  }),
  conversation: one(conversations, {
    fields: [forumConsultations.conversationId],
    references: [conversations.id],
  }),
}))

// ============================================================
// Types
// ============================================================

export type ForumConsultation = typeof forumConsultations.$inferSelect
export type NewForumConsultation = typeof forumConsultations.$inferInsert
export type ConsultationTrigger = 'price_negotiation' | 'competitor_mention' | 'objection_complex' | 'high_value_client' | 'escalation_risk' | 'contract_terms' | 'strategic_decision' | 'churn_signal'
export type ResponseApproach = 'empathetic' | 'assertive' | 'consultative' | 'direct'
export type ConsultationUrgency = 'low' | 'medium' | 'high' | 'critical'
