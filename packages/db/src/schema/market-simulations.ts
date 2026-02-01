/**
 * Market Simulations Schema
 * Focus Group de IA para evaluar variantes de mensajes
 */

import { pgTable, uuid, text, integer, decimal, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { profiles } from './auth'
import { companies } from './companies'

// ============================================================================
// TABLE
// ============================================================================

export const marketSimulations = pgTable('market_simulations', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Input data
  variants: text('variants').array().notNull(),
  buyerPersonaIds: uuid('buyer_persona_ids').array().notNull(),
  context: text('context'),

  // Results
  winningVariantIndex: integer('winning_variant_index').notNull(),
  winningVariantText: text('winning_variant_text').notNull(),
  consensusScore: decimal('consensus_score', { precision: 4, scale: 2 }),
  avgFriction: decimal('avg_friction', { precision: 4, scale: 2 }),
  frictionMap: jsonb('friction_map').notNull().$type<FrictionScore[]>(),
  synthesis: text('synthesis').notNull(),

  // Cost tracking
  evaluationCostUsd: decimal('evaluation_cost_usd', { precision: 10, scale: 6 }),
  synthesisCostUsd: decimal('synthesis_cost_usd', { precision: 10, scale: 6 }),
  totalCostUsd: decimal('total_cost_usd', { precision: 10, scale: 6 }),
  tokensUsed: integer('tokens_used'),
  executionTimeMs: integer('execution_time_ms'),

  // Ownership
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_market_simulations_user').on(table.userId),
  companyIdx: index('idx_market_simulations_company').on(table.companyId),
  createdIdx: index('idx_market_simulations_created').on(table.createdAt),
  userCreatedIdx: index('idx_market_simulations_user_created').on(table.userId, table.createdAt),
}))

// ============================================================================
// RELATIONS
// ============================================================================

export const marketSimulationsRelations = relations(marketSimulations, ({ one }) => ({
  user: one(profiles, {
    fields: [marketSimulations.userId],
    references: [profiles.id],
  }),
  company: one(companies, {
    fields: [marketSimulations.companyId],
    references: [companies.id],
  }),
}))

// ============================================================================
// TYPES
// ============================================================================

export type MarketSimulation = typeof marketSimulations.$inferSelect
export type NewMarketSimulation = typeof marketSimulations.$inferInsert

export interface FrictionScore {
  personaId: string
  personaName: string
  variantIndex: number
  frictionScore: number
  rejectionArgument: string
  alignment: {
    jobsToBeDone: number
    barrierReduction: number
  }
  rawResponse?: string
}
