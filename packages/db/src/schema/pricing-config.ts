/**
 * Pricing Configuration Schema
 *
 * Almacena toda la configuración de pricing del sistema:
 * - Parámetros globales (CREDIT_MULTIPLIER, USD_PER_CREDIT)
 * - Configuración de cada tier (precios, créditos)
 * - Historial de cambios
 */

import { pgTable, uuid, varchar, integer, decimal, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

// ============================================================================
// PRICING GLOBAL CONFIG (parámetros del sistema)
// ============================================================================

export const pricingGlobalConfig = pgTable('pricing_global_config', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Credit system parameters
  creditMultiplier: decimal('credit_multiplier', { precision: 10, scale: 2 })
    .notNull()
    .default('1.75'), // Markup sobre costo API (1.75 = 75% markup)

  usdPerCredit: decimal('usd_per_credit', { precision: 10, scale: 4 })
    .notNull()
    .default('0.01'), // Valor de 1 crédito en USD (0.01 = 100 créditos = $1)

  // Metadata
  isActive: boolean('is_active').notNull().default(true),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
  effectiveUntil: timestamp('effective_until', { withTimezone: true }),

  // Audit
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

  // Notes
  changeReason: varchar('change_reason', { length: 500 }),
})

// ============================================================================
// TIER PRICING CONFIG (configuración por tier)
// ============================================================================

export const tierPricingConfig = pgTable('tier_pricing_config', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Tier info
  tier: varchar('tier', { length: 50 }).notNull(), // 'free', 'starter', 'pro', 'business', 'enterprise'
  tierName: varchar('tier_name', { length: 100 }).notNull(), // Display name
  tierDescription: varchar('tier_description', { length: 500 }),

  // Pricing
  monthlyPriceUsd: integer('monthly_price_usd').notNull().default(0), // in cents
  yearlyPriceUsd: integer('yearly_price_usd').notNull().default(0), // in cents

  // Credits allocation
  monthlyCredits: integer('monthly_credits').notNull().default(1000),
  yearlyCredits: integer('yearly_credits').notNull().default(12000),

  // Limits
  debatesPerMonth: integer('debates_per_month').notNull().default(5),
  maxExperts: integer('max_experts').notNull().default(4),
  maxRoundsPerDebate: integer('max_rounds_per_debate').notNull().default(3),
  maxTeamMembers: integer('max_team_members').notNull().default(1),

  // Features
  features: jsonb('features').$type<{
    customExperts?: boolean
    pdfExport?: boolean
    apiAccess?: boolean
    prioritySupport?: boolean
    whiteLabel?: boolean
    analytics?: boolean
    webhooks?: boolean
    scenariosAccess?: boolean
    departmentsAccess?: boolean
  }>(),

  // Stripe IDs (optional, si se usa Stripe)
  stripePriceIdMonthly: varchar('stripe_price_id_monthly', { length: 255 }),
  stripePriceIdYearly: varchar('stripe_price_id_yearly', { length: 255 }),
  stripeProductId: varchar('stripe_product_id', { length: 255 }),

  // Status
  isActive: boolean('is_active').notNull().default(true),
  isPubliclyVisible: boolean('is_publicly_visible').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0), // Para ordenar en UI

  // Effective dates
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
  effectiveUntil: timestamp('effective_until', { withTimezone: true }),

  // Audit
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

  // Notes
  changeReason: varchar('change_reason', { length: 500 }),
})

// ============================================================================
// PRICING CHANGE HISTORY (historial de cambios)
// ============================================================================

export const pricingChangeHistory = pgTable('pricing_change_history', {
  id: uuid('id').primaryKey().defaultRandom(),

  // What changed
  changeType: varchar('change_type', { length: 50 }).notNull(), // 'global_config', 'tier_config', 'tier_created', 'tier_deleted'
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'global_config', 'tier_pricing_config'
  entityId: uuid('entity_id').notNull(), // ID del registro modificado

  // Values
  oldValues: jsonb('old_values').$type<Record<string, unknown>>(),
  newValues: jsonb('new_values').$type<Record<string, unknown>>(),

  // Impact analysis (calculado al momento del cambio)
  impactAnalysis: jsonb('impact_analysis').$type<{
    affectedUsers?: number
    estimatedRevenueDelta?: number
    estimatedCostDelta?: number
    profitMarginChange?: number
    breakEvenPointChange?: {
      tier: string
      oldBreakEven: number
      newBreakEven: number
    }[]
  }>(),

  // Audit
  changedBy: uuid('changed_by').notNull().references(() => users.id),
  changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
  changeReason: varchar('change_reason', { length: 500 }),

  // Rollback info
  canRollback: boolean('can_rollback').notNull().default(true),
  rolledBackAt: timestamp('rolled_back_at', { withTimezone: true }),
  rolledBackBy: uuid('rolled_back_by').references(() => users.id),
})

// ============================================================================
// RELATIONS
// ============================================================================

export const pricingGlobalConfigRelations = relations(pricingGlobalConfig, ({ one }) => ({
  createdBy: one(users, {
    fields: [pricingGlobalConfig.createdBy],
    references: [users.id],
  }),
}))

export const tierPricingConfigRelations = relations(tierPricingConfig, ({ one }) => ({
  createdBy: one(users, {
    fields: [tierPricingConfig.createdBy],
    references: [users.id],
  }),
}))

export const pricingChangeHistoryRelations = relations(pricingChangeHistory, ({ one }) => ({
  changedBy: one(users, {
    fields: [pricingChangeHistory.changedBy],
    references: [users.id],
  }),
  rolledBackBy: one(users, {
    fields: [pricingChangeHistory.rolledBackBy],
    references: [users.id],
  }),
}))

// ============================================================================
// TYPES
// ============================================================================

export type PricingGlobalConfig = typeof pricingGlobalConfig.$inferSelect
export type NewPricingGlobalConfig = typeof pricingGlobalConfig.$inferInsert
export type TierPricingConfig = typeof tierPricingConfig.$inferSelect
export type NewTierPricingConfig = typeof tierPricingConfig.$inferInsert
export type PricingChangeHistory = typeof pricingChangeHistory.$inferSelect
export type NewPricingChangeHistory = typeof pricingChangeHistory.$inferInsert
