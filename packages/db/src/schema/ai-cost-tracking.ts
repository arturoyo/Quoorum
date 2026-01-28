/**
 * AI Cost Tracking Schema
 * Tracks ALL AI API calls including free tier usage (Gemini, etc.)
 * Purpose: Prevent "hidden costs" from destroying profit margins
 */

import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  boolean,
  text,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { users, debates } from './index'
import { relations } from 'drizzle-orm'

// ============================================================================
// ENUMS & TYPES
// ============================================================================

export const AI_OPERATION_TYPES = [
  // Context Assessment operations
  'context_assessment',
  'context_refinement',
  'memorable_summary',

  // Auto-Research operations
  'auto_research_analysis',
  'auto_research_queries',
  'auto_research_synthesis',

  // Debate phases
  'debate_phase_estrategia',
  'debate_phase_expertos',
  'debate_phase_revision',
  'debate_phase_sintesis',

  // Onboarding & Profile
  'profile_analysis',
  'company_analysis',
  'knowledge_base_ingestion',

  // Content Generation
  'expert_generation',
  'professional_generation',
  'department_generation',

  // Workers (background)
  'worker_emotion_analysis',
  'worker_intent_scoring',
  'worker_sentiment_analysis',

  // Other
  'generic_ai_call',
] as const

export type AIOperationType = (typeof AI_OPERATION_TYPES)[number]

export const AI_PROVIDERS = ['openai', 'anthropic', 'google', 'groq', 'deepseek'] as const
export type AIProvider = (typeof AI_PROVIDERS)[number]

// ============================================================================
// TABLE
// ============================================================================

export const aiCostTracking = pgTable(
  'ai_cost_tracking',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Identification
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    debateId: uuid('debate_id').references(() => debates.id, { onDelete: 'cascade' }),
    operationType: varchar('operation_type', { length: 100 }).notNull().$type<AIOperationType>(),

    // AI Provider Details
    provider: varchar('provider', { length: 50 }).notNull().$type<AIProvider>(),
    modelId: varchar('model_id', { length: 100 }).notNull(),

    // Token Usage
    promptTokens: integer('prompt_tokens').notNull().default(0),
    completionTokens: integer('completion_tokens').notNull().default(0),
    totalTokens: integer('total_tokens').notNull().default(0),

    // Cost Breakdown
    costUsdPrompt: decimal('cost_usd_prompt', { precision: 12, scale: 8 }).notNull().default('0'),
    costUsdCompletion: decimal('cost_usd_completion', { precision: 12, scale: 8 }).notNull().default('0'),
    costUsdTotal: decimal('cost_usd_total', { precision: 12, scale: 8 }).notNull().default('0'),
    isFreeTier: boolean('is_free_tier').notNull().default(false),

    // Performance Metrics
    latencyMs: integer('latency_ms'),
    success: boolean('success').notNull().default(true),
    errorMessage: text('error_message'),

    // Context
    inputSummary: varchar('input_summary', { length: 500 }),
    outputSummary: varchar('output_summary', { length: 500 }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_ai_cost_tracking_user_id').on(table.userId),
    debateIdIdx: index('idx_ai_cost_tracking_debate_id').on(table.debateId),
    operationTypeIdx: index('idx_ai_cost_tracking_operation_type').on(table.operationType),
    providerIdx: index('idx_ai_cost_tracking_provider').on(table.provider),
    createdAtIdx: index('idx_ai_cost_tracking_created_at').on(table.createdAt),
    isFreeTierIdx: index('idx_ai_cost_tracking_is_free_tier').on(table.isFreeTier),
    // Composite index for cost analysis queries
    analysisIdx: index('idx_ai_cost_tracking_analysis').on(table.userId, table.createdAt, table.operationType),
  })
)

// ============================================================================
// RELATIONS
// ============================================================================

export const aiCostTrackingRelations = relations(aiCostTracking, ({ one }) => ({
  user: one(users, {
    fields: [aiCostTracking.userId],
    references: [users.id],
  }),
  debate: one(debates, {
    fields: [aiCostTracking.debateId],
    references: [debates.id],
  }),
}))

// ============================================================================
// TYPES (inferred from schema)
// ============================================================================

export type AICostTracking = typeof aiCostTracking.$inferSelect
export type NewAICostTracking = typeof aiCostTracking.$inferInsert
