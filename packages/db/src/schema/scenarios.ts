/**
 * Scenarios Schema
 *
 * Pre-configured decision playbooks (Escenarios de Oro) that pre-select
 * experts, frameworks, and contexts for high-quality decisions with one click.
 */

import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum, boolean, integer, index } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'
import { relations } from 'drizzle-orm'

// ============================================================
// Enums
// ============================================================

export const scenarioSegmentEnum = pgEnum('scenario_segment', [
  'entrepreneur', // Emprendedor
  'sme',          // Pyme / Autónomo
  'corporate',     // Corporate / Inversor
])

export const scenarioStatusEnum = pgEnum('scenario_status', [
  'draft',
  'active',
  'archived',
])

// ============================================================
// Scenarios Table
// ============================================================

export const scenarios = pgTable('scenarios', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Metadata
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  shortDescription: varchar('short_description', { length: 500 }),
  segment: scenarioSegmentEnum('segment').notNull(),
  status: scenarioStatusEnum('status').notNull().default('active'),

  // Expert Mix (The Quorum)
  expertIds: jsonb('expert_ids').$type<string[]>().notNull().default([]), // Array of expert IDs (slugs from expert-database)
  
  // Department & Professional Selection (optional, for corporate)
  requiresDepartments: boolean('requires_departments').notNull().default(false),
  departmentIds: jsonb('department_ids').$type<string[]>().default([]), // Optional: specific departments to use

  // Framework Injection
  frameworkId: varchar('framework_id', { length: 100 }), // e.g., 'foda', 'delphi', 'roi', 'premortem'
  
  // Master Prompt Template (with variables like {{user_input}}, {{context}}, etc.)
  masterPromptTemplate: text('master_prompt_template').notNull(),
  promptVariables: jsonb('prompt_variables').$type<Record<string, {
    label: string
    description: string
    defaultValue?: string
    required: boolean
  }>>().default({}),

  // Success Metrics (KPIs to extract from final synthesis)
  successMetrics: jsonb('success_metrics').$type<Array<{
    key: string
    label: string
    description: string
    type: 'number' | 'boolean' | 'string' | 'array'
    extractor?: string // Optional: AI prompt to extract this metric
  }>>().default([]),

  // Agent Behavior Overrides (optional)
  agentBehaviorOverrides: jsonb('agent_behavior_overrides').$type<Record<string, {
    role?: string // Override agent role behavior
    temperature?: number
    specialInstructions?: string // e.g., "Act as Devil's Advocate"
  }>>().default({}),

  // Token Optimization Settings
  tokenOptimization: jsonb('token_optimization').$type<{
    enabled: boolean
    maxTokensPerMessage?: number
    compressionEnabled?: boolean
  }>().default({ enabled: true, maxTokensPerMessage: 50 }),

  // Audit Trail & Governance
  generateCertificate: boolean('generate_certificate').notNull().default(true),
  certificateTemplate: text('certificate_template'), // Optional: custom certificate template

  // Access Control
  minTier: varchar('min_tier', { length: 50 }).default('free'), // Minimum subscription tier required
  isPublic: boolean('is_public').notNull().default(true), // Public scenarios vs user-created

  // Ownership (for user-created scenarios)
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),

  // Usage Analytics
  usageCount: integer('usage_count').notNull().default(0),
  avgQualityScore: integer('avg_quality_score'), // 0-100

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Indexes
  segmentIdx: index('idx_scenarios_segment').on(table.segment),
  statusIdx: index('idx_scenarios_status').on(table.status),
  createdByIdx: index('idx_scenarios_created_by').on(table.createdBy),
  minTierIdx: index('idx_scenarios_min_tier').on(table.minTier),
}))

// ============================================================
// Relations
// ============================================================

export const scenariosRelations = relations(scenarios, ({ one }) => ({
  creator: one(profiles, {
    fields: [scenarios.createdBy],
    references: [profiles.id],
  }),
}))

// ============================================================
// Types
// ============================================================

export type Scenario = typeof scenarios.$inferSelect
export type NewScenario = typeof scenarios.$inferInsert
export type ScenarioSegment = 'entrepreneur' | 'sme' | 'corporate'
export type ScenarioStatus = 'draft' | 'active' | 'archived'
