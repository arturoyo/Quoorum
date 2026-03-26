/**
 * Roadmap Schema
 *
 * Tracks project roadmap items with status, priority, and category
 * for the admin dashboard.
 */

import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'

// ============================================================
// Enums
// ============================================================

export const roadmapStatusEnum = pgEnum('roadmap_status', [
  'planned',
  'in_progress',
  'completed',
  'blocked',
])

export const roadmapPriorityEnum = pgEnum('roadmap_priority', [
  'low',
  'medium',
  'high',
  'critical',
])

export const roadmapCategoryEnum = pgEnum('roadmap_category', [
  'feature',
  'bugfix',
  'infra',
  'docs',
])

// ============================================================
// Roadmap Items Table
// ============================================================

export const roadmapItems = pgTable('roadmap_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: roadmapStatusEnum('status').notNull().default('planned'),
  priority: roadmapPriorityEnum('priority').notNull().default('medium'),
  category: roadmapCategoryEnum('category').notNull().default('feature'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================
// Types
// ============================================================

export type RoadmapItem = typeof roadmapItems.$inferSelect
export type NewRoadmapItem = typeof roadmapItems.$inferInsert
export type RoadmapStatus = (typeof roadmapStatusEnum.enumValues)[number]
export type RoadmapPriority = (typeof roadmapPriorityEnum.enumValues)[number]
export type RoadmapCategory = (typeof roadmapCategoryEnum.enumValues)[number]
