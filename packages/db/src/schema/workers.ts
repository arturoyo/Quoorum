/**
 * Workers Schema (Profesionales)
 * Represents internal company professionals/employees (vs external experts)
 * 
 * Professionals are virtual representations of employees that can participate
 * in internal debates using their department context.
 * 
 * Difference from Experts:
 * - Experts: External advisors (consultants, industry experts)
 * - Professionals: Internal team members (employees, colleagues)
 * 
 * Difference from Team Members:
 * - Team Members: Real users who log into the app
 * - Professionals: Virtual AI representations of employees
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { departments } from './departments'
import { profiles } from './profiles'

// Worker role enum (common job titles)
export const workerRoleEnum = pgEnum('worker_role', [
  'ceo',
  'cto',
  'cfo',
  'cmo',
  'coo',
  'vp_sales',
  'vp_product',
  'vp_engineering',
  'director',
  'manager',
  'senior',
  'mid',
  'junior',
  'intern',
  'consultant',
  'advisor',
  'custom',
])

// Worker type enum
export const workerTypeEnum = pgEnum('worker_type', [
  'internal', // Internal company worker
  'external_expert', // External expert (legacy, will be migrated)
])

export const workers = pgTable('workers', {
  // Primary key
  id: uuid('id').defaultRandom().primaryKey(),

  // Foreign keys
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }), // Owner
  departmentId: uuid('department_id')
    .references(() => departments.id, { onDelete: 'set null' }), // Assigned department

  // Worker information
  name: varchar('name', { length: 255 }).notNull(), // "Juan García", "María López"
  role: workerRoleEnum('role').notNull().default('custom'), // Job title
  type: workerTypeEnum('type').notNull().default('internal'), // internal vs external_expert

  // Expertise and context
  expertise: text('expertise').notNull(), // "Marketing digital, SEO, Content strategy"
  description: text('description'), // Brief bio
  responsibilities: text('responsibilities'), // "Gestiona campañas, analiza métricas..."

  // AI Configuration (similar to experts)
  systemPrompt: text('system_prompt').notNull(), // Custom prompt for this worker
  aiConfig: jsonb('ai_config').$type<{
    provider: 'openai' | 'anthropic' | 'google' | 'groq'
    model: string
    temperature?: number
    maxTokens?: number
  }>().notNull(),

  // Metadata
  avatar: varchar('avatar', { length: 500 }), // URL or emoji
  email: varchar('email', { length: 255 }), // Optional contact
  phone: varchar('phone', { length: 50 }), // Optional contact

  // Status
  isActive: boolean('is_active').notNull().default(true),
  isPredefined: boolean('is_predefined').notNull().default(false), // System-provided templates

  // Library reference (if forked from template)
  libraryWorkerId: uuid('library_worker_id'), // Reference to original template

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Relations
export const workersRelations = relations(workers, ({ one }) => ({
  user: one(profiles, {
    fields: [workers.userId],
    references: [profiles.id],
  }),
  department: one(departments, {
    fields: [workers.departmentId],
    references: [departments.id],
  }),
  // Note: Many-to-many relation with departments is defined in worker-departments.ts
  // to avoid circular dependencies
}))

// Types
export type Worker = typeof workers.$inferSelect
export type NewWorker = typeof workers.$inferInsert
export type WorkerRole = typeof workerRoleEnum.enumValues[number]
export type WorkerType = typeof workerTypeEnum.enumValues[number]
