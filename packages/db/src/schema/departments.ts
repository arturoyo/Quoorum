/**
 * Departments Schema
 * Stores department-specific context and custom prompts
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum, index, foreignKey } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { companies } from './companies'

// Department types enum
export const departmentTypeEnum = pgEnum('department_type', [
  'finance',
  'marketing',
  'operations',
  'hr',
  'sales',
  'product',
  'engineering',
  'customer_success',
  'legal',
  'custom',
])

export const departments = pgTable('departments', {
  // Primary key
  id: uuid('id').defaultRandom().primaryKey(),

  // Foreign keys
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'), // Self-reference defined via foreignKey below

  // Department information
  name: varchar('name', { length: 100 }).notNull(), // "Finanzas", "Marketing", etc.
  type: departmentTypeEnum('type').notNull().default('custom'),

  // Layer 3: Department-specific context
  departmentContext: text('department_context').notNull(), // "KPIs: ..., Procesos: ..., Informes: ..."

  // Layer 4: Prompt templates
  basePrompt: text('base_prompt').notNull(), // Template suggested by system
  customPrompt: text('custom_prompt'), // User customization (optional)

  // Agent configuration
  agentRole: varchar('agent_role', { length: 50 }).default('analyst'), // "analyst", "critic", "synthesizer"
  temperature: varchar('temperature', { length: 10 }).default('0.7'), // "0.7" for balanced

  // Optional metadata
  description: text('description'),
  icon: varchar('icon', { length: 50 }), // Emoji or icon name

  // Status
  isActive: boolean('is_active').notNull().default(true),
  isPredefined: boolean('is_predefined').notNull().default(false), // System-provided departments

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for departments
  companyIdIdx: index('idx_departments_company').on(table.companyId),
  parentIdIdx: index('idx_departments_parent').on(table.parentId),
  typeIdx: index('idx_departments_type').on(table.type),
  isActiveIdx: index('idx_departments_is_active').on(table.isActive),
  // Self-reference foreign key
  parentFk: foreignKey({
    columns: [table.parentId],
    foreignColumns: [table.id],
    name: 'departments_parent_id_fkey',
  }).onDelete('set null'),
}))

// Relations
export const departmentsRelations = relations(departments, ({ one, many }) => ({
  company: one(companies, {
    fields: [departments.companyId],
    references: [companies.id],
  }),
  parent: one(departments, {
    fields: [departments.parentId],
    references: [departments.id],
    relationName: 'parent',
  }),
  children: many(departments, {
    relationName: 'parent',
  }),
  // Note: Many-to-many relation with workers is defined in worker-departments.ts
  // to avoid circular dependencies
}))

// Types
export type Department = typeof departments.$inferSelect
export type NewDepartment = typeof departments.$inferInsert
export type DepartmentType = typeof departmentTypeEnum.enumValues[number]
