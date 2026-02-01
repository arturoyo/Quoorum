/**
 * Debate Routing Configs Schema
 * Routes debates to different agent configurations based on department/team.
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, integer, real, jsonb, pgEnum, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { companies } from './companies'
import { departments } from './departments'
import { profiles } from './profiles'

export const agentSelectionModeEnum = pgEnum('agent_selection_mode', [
  'auto',       // System selects best agents based on context
  'fixed',      // Use specific agents from config
  'template',   // Use a debate template's agents
])

export const debateRoutingConfigs = pgTable('debate_routing_configs', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Scope: company + optional department
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  departmentId: uuid('department_id')
    .references(() => departments.id, { onDelete: 'set null' }),

  // Routing config name
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),

  // Agent selection
  agentSelectionMode: agentSelectionModeEnum('agent_selection_mode').notNull().default('auto'),

  // Expert filtering rules (JSON: { categories?: string[], expertIds?: string[], excludeIds?: string[] })
  expertFilterRules: jsonb('expert_filter_rules').$type<{
    categories?: string[]
    expertIds?: string[]
    excludeIds?: string[]
  }>(),

  // Provider/model overrides
  providerOverride: varchar('provider_override', { length: 50 }),
  modelOverride: varchar('model_override', { length: 100 }),

  // Constraints
  maxCostUsd: real('max_cost_usd'),
  maxRounds: integer('max_rounds').default(10),

  // Notification overrides
  slackChannelOverride: varchar('slack_channel_override', { length: 100 }),

  // Priority (higher = matched first)
  priority: integer('priority').notNull().default(0),

  // Status
  isActive: boolean('is_active').notNull().default(true),
  isDefault: boolean('is_default').notNull().default(false),

  // Audit
  createdBy: uuid('created_by')
    .references(() => profiles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('idx_routing_company').on(table.companyId),
  departmentIdx: index('idx_routing_department').on(table.departmentId),
  activeIdx: index('idx_routing_active').on(table.isActive),
  priorityIdx: index('idx_routing_priority').on(table.priority),
}))

// Relations
export const debateRoutingConfigsRelations = relations(debateRoutingConfigs, ({ one }) => ({
  company: one(companies, {
    fields: [debateRoutingConfigs.companyId],
    references: [companies.id],
  }),
  department: one(departments, {
    fields: [debateRoutingConfigs.departmentId],
    references: [departments.id],
  }),
  createdByProfile: one(profiles, {
    fields: [debateRoutingConfigs.createdBy],
    references: [profiles.id],
  }),
}))

// Types
export type DebateRoutingConfig = typeof debateRoutingConfigs.$inferSelect
export type NewDebateRoutingConfig = typeof debateRoutingConfigs.$inferInsert
