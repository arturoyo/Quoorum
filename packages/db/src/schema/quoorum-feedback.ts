/**
 * Forum Expert Feedback Schema
 *
 * Allows users to rate and provide feedback on individual expert contributions
 * within debates. This helps improve expert selection and provides social proof.
 */

import { pgTable, uuid, text, timestamp, integer, boolean, index, pgEnum } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'
import { quoorumDebates } from './quoorum-debates'
import { relations } from 'drizzle-orm'

// ============================================================
// Enums
// ============================================================

export const feedbackSentimentEnum = pgEnum('feedback_sentiment', [
  'helpful',
  'neutral',
  'unhelpful',
])

// ============================================================
// Expert Feedback Table
// ============================================================

export const forumExpertFeedback = pgTable('quoorum_expert_feedback', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Owner
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Debate reference
  debateId: uuid('debate_id')
    .notNull()
    .references(() => quoorumDebates.id, { onDelete: 'cascade' }),

  // Expert being rated (e.g., 'april_dunford', 'alex_hormozi')
  expertId: text('expert_id').notNull(),

  // Rating (1-5 stars)
  rating: integer('rating').notNull(), // 1-5

  // Sentiment classification
  sentiment: feedbackSentimentEnum('sentiment').notNull().default('neutral'),

  // Detailed feedback
  comment: text('comment'),

  // Specific aspects rated (optional)
  insightfulness: integer('insightfulness'), // 1-5
  relevance: integer('relevance'), // 1-5
  clarity: integer('clarity'), // 1-5
  actionability: integer('actionability'), // 1-5

  // Was expert's recommendation followed?
  wasFollowed: boolean('was_followed'),

  // Did following the advice work?
  wasSuccessful: boolean('was_successful'),
  outcomeNotes: text('outcome_notes'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_quoorum_expert_feedback_user').on(table.userId),
  debateIdx: index('idx_quoorum_expert_feedback_debate').on(table.debateId),
  expertIdx: index('idx_quoorum_expert_feedback_expert').on(table.expertId),
  ratingIdx: index('idx_quoorum_expert_feedback_rating').on(table.rating),
}))

// ============================================================
// Aggregated Expert Ratings (Materialized View Alternative)
// ============================================================

export const forumExpertRatings = pgTable('quoorum_expert_ratings', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Expert identifier
  expertId: text('expert_id').notNull().unique(),

  // Aggregated metrics
  totalRatings: integer('total_ratings').notNull().default(0),
  avgRating: integer('avg_rating'), // Stored as 1-500 for precision (divide by 100)
  avgInsightfulness: integer('avg_insightfulness'),
  avgRelevance: integer('avg_relevance'),
  avgClarity: integer('avg_clarity'),
  avgActionability: integer('avg_actionability'),

  // Sentiment breakdown
  helpfulCount: integer('helpful_count').notNull().default(0),
  neutralCount: integer('neutral_count').notNull().default(0),
  unhelpfulCount: integer('unhelpful_count').notNull().default(0),

  // Success tracking
  followedCount: integer('followed_count').notNull().default(0),
  successCount: integer('success_count').notNull().default(0),

  // Last updated
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  avgRatingIdx: index('idx_quoorum_expert_ratings_avg').on(table.avgRating),
}))

// ============================================================
// Relations
// ============================================================

export const forumExpertFeedbackRelations = relations(forumExpertFeedback, ({ one }) => ({
  user: one(profiles, {
    fields: [forumExpertFeedback.userId],
    references: [profiles.id],
  }),
  debate: one(quoorumDebates, {
    fields: [forumExpertFeedback.debateId],
    references: [quoorumDebates.id],
  }),
}))

// ============================================================
// Types
// ============================================================

export type ForumExpertFeedback = typeof forumExpertFeedback.$inferSelect
export type NewForumExpertFeedback = typeof forumExpertFeedback.$inferInsert
export type ForumExpertRating = typeof forumExpertRatings.$inferSelect
export type NewForumExpertRating = typeof forumExpertRatings.$inferInsert
export type FeedbackSentiment = 'helpful' | 'neutral' | 'unhelpful'
