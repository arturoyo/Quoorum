/**
 * Debate Skills Schema
 * Configurable "skills" (SWOT, Risk Assessment, etc.) for debates.
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, pgEnum, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { companies } from './companies'
import { profiles } from './profiles'

export const skillCategoryEnum = pgEnum('skill_category', [
  'strategy',
  'finance',
  'marketing',
  'operations',
  'hr',
  'legal',
  'product',
  'custom',
])

export const skillVisibilityEnum = pgEnum('skill_visibility', [
  'public',       // Available to all companies (marketplace)
  'company',      // Only for one company
  'system',       // Built-in, not editable
])

// Global skill definitions
export const debateSkills = pgTable('debate_skills', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Skill identity
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  category: skillCategoryEnum('category').notNull().default('strategy'),
  icon: varchar('icon', { length: 50 }),  // lucide icon name

  // Skill configuration
  systemPromptTemplate: text('system_prompt_template').notNull(),  // Prompt injected into debate
  suggestedExperts: jsonb('suggested_experts').$type<string[]>(),  // Expert IDs suited for this skill
  suggestedRounds: integer('suggested_rounds').default(5),
  suggestedAgentMode: varchar('suggested_agent_mode', { length: 20 }).default('auto'),

  // Output format
  outputTemplate: text('output_template'),  // Expected output structure (markdown template)

  // Metadata
  visibility: skillVisibilityEnum('visibility').notNull().default('system'),
  usageCount: integer('usage_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),

  // Audit
  createdBy: uuid('created_by')
    .references(() => profiles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('idx_skills_slug').on(table.slug),
  categoryIdx: index('idx_skills_category').on(table.category),
  visibilityIdx: index('idx_skills_visibility').on(table.visibility),
}))

// Company-specific skill enablement / overrides
export const companySkills = pgTable('company_skills', {
  id: uuid('id').defaultRandom().primaryKey(),

  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  skillId: uuid('skill_id')
    .notNull()
    .references(() => debateSkills.id, { onDelete: 'cascade' }),

  // Company overrides
  customPromptOverride: text('custom_prompt_override'),
  customExpertsOverride: jsonb('custom_experts_override').$type<string[]>(),
  isEnabled: boolean('is_enabled').notNull().default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('idx_company_skills_company').on(table.companyId),
  skillIdx: index('idx_company_skills_skill').on(table.skillId),
}))

// Relations
export const debateSkillsRelations = relations(debateSkills, ({ one, many }) => ({
  createdByProfile: one(profiles, {
    fields: [debateSkills.createdBy],
    references: [profiles.id],
  }),
  companySkills: many(companySkills),
}))

export const companySkillsRelations = relations(companySkills, ({ one }) => ({
  company: one(companies, {
    fields: [companySkills.companyId],
    references: [companies.id],
  }),
  skill: one(debateSkills, {
    fields: [companySkills.skillId],
    references: [debateSkills.id],
  }),
}))

// Types
export type DebateSkill = typeof debateSkills.$inferSelect
export type NewDebateSkill = typeof debateSkills.$inferInsert
export type CompanySkill = typeof companySkills.$inferSelect
export type NewCompanySkill = typeof companySkills.$inferInsert
