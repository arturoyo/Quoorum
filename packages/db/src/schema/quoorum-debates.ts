/**
 * Forum Debates Schema
 *
 * Stores debates from the dynamic expert system.
 * Includes full debate history, expert participation, and analytics.
 */

import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum, integer, boolean, real, type AnyPgColumn, index } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'
import { companies } from './companies'
import { departments } from './departments'
import { relations } from 'drizzle-orm'

// ============================================================
// Enums
// ============================================================

export const debateModeEnum = pgEnum('debate_mode', ['static', 'dynamic'])

export const debateStatusEnum = pgEnum('debate_status', [
  'draft',
  'pending',
  'in_progress',
  'completed',
  'failed',
  'cancelled',
])

export const debateVisibilityEnum = pgEnum('debate_visibility', ['private', 'team', 'public'])

// ============================================================
// Forum Debates Table
// ============================================================

export const quoorumDebates = pgTable('quoorum_debates', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Owner
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Debate info
  question: text('question').notNull(),
  mode: debateModeEnum('mode').notNull().default('dynamic'),
  status: debateStatusEnum('status').notNull().default('pending'),
  visibility: debateVisibilityEnum('visibility').notNull().default('private'),

  // Intelligence layers (4-layer prompt system)
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }), // Layer 2: Master context
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }), // Layer 3-4: Department context + personality

  // Context
  context: jsonb('context').$type<{
    sources?: Array<{ type: string; content: string }>
    constraints?: string[]
    background?: string
    [key: string]: unknown
  }>(),

  // Results
  consensusScore: real('consensus_score'), // 0-1
  totalRounds: integer('total_rounds'),
  totalCostUsd: real('total_cost_usd'),
  totalCreditsUsed: integer('total_credits_used'), // Credits consumed (formula: costUsd * 1.75 / 0.005)
  themeId: varchar('theme_id', { length: 50 }), // Narrative theme applied (e.g., 'greek-mythology', 'education', 'generic')
  themeConfidence: real('theme_confidence'), // Confidence score of theme selection (0-1)

  // Cost breakdown by AI provider (denormalized for analytics)
  costsByProvider: jsonb('costs_by_provider').$type<
    Record<
      string, // provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'groq'
      {
        costUsd: number
        creditsUsed: number
        tokensUsed: number
        messagesCount: number
      }
    >
  >(),

  // Cost breakdown by debate phase (denormalized for analytics)
  costsByPhase: jsonb('costs_by_phase').$type<
    Record<
      string, // phase: 'context' | 'experts' | 'strategy' | 'revision' | 'debate' | 'synthesis'
      {
        costUsd: number
        creditsUsed: number
        tokensUsed: number
        messagesCount: number
      }
    >
  >(),

  // Final ranking
  finalRanking: jsonb('final_ranking').$type<
    Array<{
      option: string
      score: number
      reasoning?: string
    }>
  >(),

  // Full debate data
  rounds: jsonb('rounds').$type<
    Array<{
      round: number
      messages: Array<{
        agentKey: string
        agentName?: string
        content: string
        timestamp?: string
        // AI provider tracking (denormalized for analytics)
        provider?: string // 'openai' | 'anthropic' | 'google' | 'deepseek' | 'groq'
        modelId?: string // e.g., 'gpt-4o', 'claude-3-5-sonnet', 'gemini-2.0-flash'
        tokensUsed?: number
        costUsd?: number
      }>
    }>
  >(),

  // Expert participation
  experts: jsonb('experts').$type<
    Array<{
      id: string
      name: string
      expertise: string[]
      matchScore?: number
    }>
  >(),

  // Quality metrics
  qualityMetrics: jsonb('quality_metrics').$type<{
    depth: number
    diversity: number
    originality: number
    issues?: Array<{
      type: string
      severity: number
      description: string
    }>
  }>(),

  // Meta-moderator interventions
  interventions: jsonb('interventions').$type<
    Array<{
      round: number
      type: string
      prompt: string
      wasEffective?: boolean
    }>
  >(),

  // Sharing
  shareToken: varchar('share_token', { length: 64 }), // For public sharing
  sharedWith: jsonb('shared_with').$type<string[]>(), // User IDs with access

  // Analytics
  viewCount: integer('view_count').notNull().default(0),
  likeCount: integer('like_count').notNull().default(0),
  commentCount: integer('comment_count').notNull().default(0),

  // Metadata
  metadata: jsonb('metadata').$type<{
    duration?: number // milliseconds
    complexity?: number
    areas?: string[]
    topics?: string[]
    tags?: string[]
    [key: string]: unknown
  }>(),

  // Real-time processing status (for UI cascade)
  processingStatus: jsonb('processing_status').$type<{
    phase: string // 'analyzing' | 'matching' | 'deliberating' | 'finalizing'
    message: string // Human-readable message
    progress: number // 0-100
    currentRound?: number
    totalRounds?: number
    timestamp: string // ISO date
  }>(),

  // Performance tier for this debate (Just-in-Time selection)
  performanceLevel: varchar('performance_level', { length: 50 }).default('balanced'),

  // Timestamps
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // Soft delete
}, (table) => ({
  // Performance indexes for quoorum_debates (critical table)
  userIdIdx: index('idx_quoorum_debates_user').on(table.userId),
  statusIdx: index('idx_quoorum_debates_status').on(table.status),
  visibilityIdx: index('idx_quoorum_debates_visibility').on(table.visibility),
  companyIdIdx: index('idx_quoorum_debates_company').on(table.companyId),
  departmentIdIdx: index('idx_quoorum_debates_department').on(table.departmentId),
  performanceLevelIdx: index('idx_quoorum_debates_performance_level').on(table.performanceLevel),
  createdAtIdx: index('idx_quoorum_debates_created').on(table.createdAt),
  // Composite indexes for common query patterns
  userStatusIdx: index('idx_quoorum_debates_user_status').on(table.userId, table.status),
  userCreatedIdx: index('idx_quoorum_debates_user_created').on(table.userId, table.createdAt),
  // Index for user + deletedAt filter (common in list queries)
  userDeletedIdx: index('idx_quoorum_debates_user_deleted').on(table.userId, table.deletedAt),
}))

// ============================================================
// Forum Debate Comments Table
// ============================================================

export const quoorumDebateComments = pgTable('quoorum_debate_comments', {
  id: uuid('id').defaultRandom().primaryKey(),

  debateId: uuid('debate_id')
    .notNull()
    .references(() => quoorumDebates.id, { onDelete: 'cascade' }),

  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  content: text('content').notNull(),

  // Optional: reply to another comment (self-reference)
  parentId: uuid('parent_id').references((): AnyPgColumn => quoorumDebateComments.id, { onDelete: 'cascade' }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for quoorum_debate_comments
  debateIdIdx: index('idx_quoorum_debate_comments_debate').on(table.debateId),
  userIdIdx: index('idx_quoorum_debate_comments_user').on(table.userId),
  parentIdIdx: index('idx_quoorum_debate_comments_parent').on(table.parentId),
}))

// ============================================================
// Forum Debate Likes Table
// ============================================================

export const quoorumDebateLikes = pgTable('quoorum_debate_likes', {
  id: uuid('id').defaultRandom().primaryKey(),

  debateId: uuid('debate_id')
    .notNull()
    .references(() => quoorumDebates.id, { onDelete: 'cascade' }),

  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for quoorum_debate_likes
  debateIdIdx: index('idx_quoorum_debate_likes_debate').on(table.debateId),
  userIdIdx: index('idx_quoorum_debate_likes_user').on(table.userId),
  userDebateIdx: index('idx_quoorum_debate_likes_user_debate').on(table.userId, table.debateId),
}))

// ============================================================
// Expert Performance Table (Learning System)
// ============================================================

export const quoorumExpertPerformance = pgTable('quoorum_expert_performance', {
  id: uuid('id').defaultRandom().primaryKey(),

  expertId: varchar('expert_id', { length: 100 }).notNull(), // e.g., 'april_dunford'

  // Performance metrics
  totalDebates: integer('total_debates').notNull().default(0),
  totalWins: integer('total_wins').notNull().default(0), // Times their option won
  avgQualityScore: real('avg_quality_score'), // 0-100
  avgConsensusScore: real('avg_consensus_score'), // 0-1

  // Chemistry scores with other experts
  chemistryScores: jsonb('chemistry_scores').$type<
    Record<
      string,
      {
        score: number // 0-100
        debates: number
        avgConsensus: number
      }
    >
  >(),

  // Performance by topic
  topicPerformance: jsonb('topic_performance').$type<
    Record<
      string,
      {
        debates: number
        wins: number
        avgQuality: number
      }
    >
  >(),

  // Timestamps
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for quoorum_expert_performance
  expertIdIdx: index('idx_quoorum_expert_performance_expert').on(table.expertId),
}))

// ============================================================
// Custom Experts Table (Premium Feature)
// ============================================================

export const quoorumCustomExperts = pgTable('quoorum_custom_experts', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Expert info
  name: varchar('name', { length: 100 }).notNull(),
  expertise: jsonb('expertise').$type<string[]>().notNull(),
  philosophy: text('philosophy').notNull(),
  approach: text('approach').notNull(),
  style: text('style').notNull(),

  // Training data
  trainingDocs: jsonb('training_docs').$type<
    Array<{
      title: string
      content: string
      source?: string
    }>
  >(),

  // Usage
  isActive: boolean('is_active').notNull().default(true),
  usageCount: integer('usage_count').notNull().default(0),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for quoorum_custom_experts
  userIdIdx: index('idx_quoorum_custom_experts_user').on(table.userId),
  isActiveIdx: index('idx_quoorum_custom_experts_active').on(table.isActive),
  userActiveIdx: index('idx_quoorum_custom_experts_user_active').on(table.userId, table.isActive),
}))

// ============================================================
// Debate Templates Table (Industry-Specific)
// ============================================================

export const quoorumDebateTemplates = pgTable('quoorum_debate_templates', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Template info
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  industry: varchar('industry', { length: 50 }), // 'saas', 'ecommerce', etc.
  category: varchar('category', { length: 50 }), // 'pricing', 'positioning', etc.

  // Template config
  questionTemplate: text('question_template').notNull(),
  suggestedExperts: jsonb('suggested_experts').$type<string[]>(),
  defaultContext: jsonb('default_context').$type<{
    constraints?: string[]
    background?: string
    [key: string]: unknown
  }>(),

  // Usage
  usageCount: integer('usage_count').notNull().default(0),
  isPublic: boolean('is_public').notNull().default(false),

  // Creator (null = system template)
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for quoorum_debate_templates
  createdByIdx: index('idx_quoorum_debate_templates_created_by').on(table.createdBy),
  industryIdx: index('idx_quoorum_debate_templates_industry').on(table.industry),
  categoryIdx: index('idx_quoorum_debate_templates_category').on(table.category),
  isPublicIdx: index('idx_quoorum_debate_templates_public').on(table.isPublic),
}))

// ============================================================
// Relations
// ============================================================

export const quoorumDebatesRelations = relations(quoorumDebates, ({ one, many }) => ({
  user: one(profiles, {
    fields: [quoorumDebates.userId],
    references: [profiles.id],
  }),
  company: one(companies, {
    fields: [quoorumDebates.companyId],
    references: [companies.id],
  }),
  department: one(departments, {
    fields: [quoorumDebates.departmentId],
    references: [departments.id],
  }),
  comments: many(quoorumDebateComments),
  likes: many(quoorumDebateLikes),
}))

export const quoorumDebateCommentsRelations = relations(quoorumDebateComments, ({ one }) => ({
  debate: one(quoorumDebates, {
    fields: [quoorumDebateComments.debateId],
    references: [quoorumDebates.id],
  }),
  user: one(profiles, {
    fields: [quoorumDebateComments.userId],
    references: [profiles.id],
  }),
  parent: one(quoorumDebateComments, {
    fields: [quoorumDebateComments.parentId],
    references: [quoorumDebateComments.id],
  }),
}))

export const quoorumDebateLikesRelations = relations(quoorumDebateLikes, ({ one }) => ({
  debate: one(quoorumDebates, {
    fields: [quoorumDebateLikes.debateId],
    references: [quoorumDebates.id],
  }),
  user: one(profiles, {
    fields: [quoorumDebateLikes.userId],
    references: [profiles.id],
  }),
}))

export const quoorumCustomExpertsRelations = relations(quoorumCustomExperts, ({ one }) => ({
  user: one(profiles, {
    fields: [quoorumCustomExperts.userId],
    references: [profiles.id],
  }),
}))

export const quoorumDebateTemplatesRelations = relations(quoorumDebateTemplates, ({ one }) => ({
  creator: one(profiles, {
    fields: [quoorumDebateTemplates.createdBy],
    references: [profiles.id],
  }),
}))

// ============================================================
// Types
// ============================================================

export type ForumDebate = typeof quoorumDebates.$inferSelect
export type NewForumDebate = typeof quoorumDebates.$inferInsert
export type QuoorumDebateComment = typeof quoorumDebateComments.$inferSelect
export type NewQuoorumDebateComment = typeof quoorumDebateComments.$inferInsert
export type QuoorumDebateLike = typeof quoorumDebateLikes.$inferSelect
export type NewQuoorumDebateLike = typeof quoorumDebateLikes.$inferInsert
export type QuoorumExpertPerformance = typeof quoorumExpertPerformance.$inferSelect
export type NewQuoorumExpertPerformance = typeof quoorumExpertPerformance.$inferInsert
export type QuoorumCustomExpert = typeof quoorumCustomExperts.$inferSelect
export type NewQuoorumCustomExpert = typeof quoorumCustomExperts.$inferInsert
export type QuoorumDebateTemplate = typeof quoorumDebateTemplates.$inferSelect
export type NewQuoorumDebateTemplate = typeof quoorumDebateTemplates.$inferInsert

export type DebateMode = 'static' | 'dynamic'
export type DebateStatus = 'draft' | 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
export type DebateVisibility = 'private' | 'team' | 'public'
