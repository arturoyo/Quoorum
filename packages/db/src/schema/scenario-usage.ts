/**
 * Scenario Usage Tracking
 *
 * Tracks which scenarios are used in which debates for analytics
 */

import { pgTable, uuid, timestamp, jsonb, integer, index } from 'drizzle-orm/pg-core'
import { scenarios } from './scenarios'
import { quoorumDebates } from './quoorum-debates'
import { profiles } from './profiles'

export const scenarioUsage = pgTable('scenario_usage', {
  id: uuid('id').defaultRandom().primaryKey(),

  scenarioId: uuid('scenario_id')
    .notNull()
    .references(() => scenarios.id, { onDelete: 'cascade' }),

  debateId: uuid('debate_id')
    .notNull()
    .references(() => quoorumDebates.id, { onDelete: 'cascade' }),

  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Track which variables were used
  variablesUsed: jsonb('variables_used').$type<Record<string, string>>().default({}),

  // Track success metrics extracted
  successMetricsExtracted: jsonb('success_metrics_extracted').$type<Record<string, unknown>>().default({}),

  // Quality score for this usage
  qualityScore: integer('quality_score'), // 0-100

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  scenarioIdIdx: index('idx_scenario_usage_scenario').on(table.scenarioId),
  debateIdIdx: index('idx_scenario_usage_debate').on(table.debateId),
  userIdIdx: index('idx_scenario_usage_user').on(table.userId),
}))

export type ScenarioUsage = typeof scenarioUsage.$inferSelect
export type NewScenarioUsage = typeof scenarioUsage.$inferInsert
