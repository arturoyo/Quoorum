/**
 * Forum-Deals Integration Schema
 *
 * Links Forum debates to sales opportunities/deals.
 * Allows users to:
 * - Create debates about specific deals
 * - Track which debates influenced deal outcomes
 * - Get AI recommendations for deals based on debate insights
 */

import { pgTable, uuid, text, timestamp, boolean, index, jsonb, pgEnum } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'
import { forumDebates } from './forum-debates'
import { deals } from './deals'
import { relations } from 'drizzle-orm'

// ============================================================
// Enums
// ============================================================

export const debateDealContextEnum = pgEnum('debate_deal_context', [
  'pricing_strategy',
  'negotiation_tactics',
  'objection_handling',
  'proposal_review',
  'competitor_analysis',
  'closing_strategy',
  'risk_assessment',
  'value_proposition',
  'general',
])

export const debateInfluenceEnum = pgEnum('debate_influence', [
  'decisive', // Debate was decisive in deal outcome
  'significant', // Debate had significant influence
  'moderate', // Some influence
  'minimal', // Little influence
  'none', // No influence
  'unknown', // Not evaluated
])

// ============================================================
// Forum Deal Links Table
// ============================================================

export const forumDealLinks = pgTable('forum_deal_links', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Owner
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Links
  debateId: uuid('debate_id')
    .notNull()
    .references(() => forumDebates.id, { onDelete: 'cascade' }),
  dealId: uuid('deal_id')
    .notNull()
    .references(() => deals.id, { onDelete: 'cascade' }),

  // Context
  context: debateDealContextEnum('context').notNull().default('general'),
  notes: text('notes'),

  // Influence tracking (filled after deal closes)
  influence: debateInfluenceEnum('influence').default('unknown'),
  influenceNotes: text('influence_notes'),

  // Was the debate's recommendation followed?
  recommendationFollowed: boolean('recommendation_followed'),

  // Outcome data (captured when deal closes)
  outcomeData: jsonb('outcome_data').$type<{
    dealStage?: string
    dealValue?: number
    wasWon?: boolean
    closedAt?: string
    keyInsights?: string[]
  }>(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_forum_deal_links_user').on(table.userId),
  debateIdx: index('idx_forum_deal_links_debate').on(table.debateId),
  dealIdx: index('idx_forum_deal_links_deal').on(table.dealId),
  contextIdx: index('idx_forum_deal_links_context').on(table.context),
}))

// ============================================================
// Deal Strategy Recommendations Table
// ============================================================

export const forumDealRecommendations = pgTable('forum_deal_recommendations', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Owner
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Deal
  dealId: uuid('deal_id')
    .notNull()
    .references(() => deals.id, { onDelete: 'cascade' }),

  // AI-generated recommendation based on past debates
  recommendation: text('recommendation').notNull(),
  confidence: text('confidence'), // 'high', 'medium', 'low'

  // Based on these debates
  basedOnDebates: jsonb('based_on_debates').$type<string[]>(),

  // Action items
  suggestedActions: jsonb('suggested_actions').$type<
    Array<{
      action: string
      priority: 'high' | 'medium' | 'low'
      reasoning: string
    }>
  >(),

  // Risk assessment
  riskFactors: jsonb('risk_factors').$type<
    Array<{
      factor: string
      severity: 'high' | 'medium' | 'low'
      mitigation: string
    }>
  >(),

  // Status
  isActive: boolean('is_active').notNull().default(true),
  dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
  dismissReason: text('dismiss_reason'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => ({
  userIdx: index('idx_forum_deal_recs_user').on(table.userId),
  dealIdx: index('idx_forum_deal_recs_deal').on(table.dealId),
  activeIdx: index('idx_forum_deal_recs_active').on(table.dealId, table.isActive),
}))

// ============================================================
// Relations
// ============================================================

export const forumDealLinksRelations = relations(forumDealLinks, ({ one }) => ({
  user: one(profiles, {
    fields: [forumDealLinks.userId],
    references: [profiles.id],
  }),
  debate: one(forumDebates, {
    fields: [forumDealLinks.debateId],
    references: [forumDebates.id],
  }),
  deal: one(deals, {
    fields: [forumDealLinks.dealId],
    references: [deals.id],
  }),
}))

export const forumDealRecommendationsRelations = relations(forumDealRecommendations, ({ one }) => ({
  user: one(profiles, {
    fields: [forumDealRecommendations.userId],
    references: [profiles.id],
  }),
  deal: one(deals, {
    fields: [forumDealRecommendations.dealId],
    references: [deals.id],
  }),
}))

// ============================================================
// Types
// ============================================================

export type ForumDealLink = typeof forumDealLinks.$inferSelect
export type NewForumDealLink = typeof forumDealLinks.$inferInsert
export type ForumDealRecommendation = typeof forumDealRecommendations.$inferSelect
export type NewForumDealRecommendation = typeof forumDealRecommendations.$inferInsert
export type DebateDealContext =
  | 'pricing_strategy'
  | 'negotiation_tactics'
  | 'objection_handling'
  | 'proposal_review'
  | 'competitor_analysis'
  | 'closing_strategy'
  | 'risk_assessment'
  | 'value_proposition'
  | 'general'
export type DebateInfluence = 'decisive' | 'significant' | 'moderate' | 'minimal' | 'none' | 'unknown'
