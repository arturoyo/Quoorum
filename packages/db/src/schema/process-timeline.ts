/**
 * Process Timeline Schema
 *
 * Tracks multi-phase processes with progress tracking:
 * - Sales increase campaigns (1/5, 2/5, etc.)
 * - Onboarding flows
 * - Campaign automation
 * - Any multi-step process
 */

import { pgTable, uuid, text, timestamp, integer, index, pgEnum, jsonb, varchar } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'
import { relations } from 'drizzle-orm'

// ============================================================
// Enums
// ============================================================

export const processStatusEnum = pgEnum('process_status', [
  'in_progress',
  'completed',
  'paused',
  'failed',
  'cancelled',
])

export const processPhaseStatusEnum = pgEnum('process_phase_status', [
  'pending',
  'in_progress',
  'completed',
  'skipped',
])

// ============================================================
// Process Timeline Table
// ============================================================

export const processTimeline = pgTable(
  'process_timeline',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // User ownership
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    // Process identification
    processType: varchar('process_type', { length: 100 }).notNull(), // 'sales_increase', 'onboarding', 'campaign'
    processId: uuid('process_id'), // Optional: ID of related entity (campaign, deal, etc.)
    processName: text('process_name').notNull(), // "Aumentar ventas"

    // Progress tracking
    currentPhase: integer('current_phase').notNull().default(1), // 1, 2, 3...
    totalPhases: integer('total_phases').notNull().default(5), // 5
    progressPercent: integer('progress_percent').notNull().default(0), // 0-100

    // Status
    status: processStatusEnum('status').notNull().default('in_progress'),

    // Phases array (JSONB for flexibility)
    phases: jsonb('phases').$type<ProcessPhase[]>().notNull(),

    // Metadata (flexible JSON for process-specific data)
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    // Timestamps
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_process_timeline_user').on(table.userId),
    processTypeIdx: index('idx_process_timeline_type').on(table.processType),
    statusIdx: index('idx_process_timeline_status').on(table.status),
    createdAtIdx: index('idx_process_timeline_started').on(table.startedAt),
  })
)

// ============================================================
// Types
// ============================================================

export type ProcessPhase = {
  phaseNumber: number
  name: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  startedAt?: string
  completedAt?: string
  metadata?: Record<string, unknown>
}

export type ProcessTimeline = typeof processTimeline.$inferSelect
export type NewProcessTimeline = typeof processTimeline.$inferInsert
export type ProcessStatus = 'in_progress' | 'completed' | 'paused' | 'failed' | 'cancelled'

// ============================================================
// Relations
// ============================================================

export const processTimelineRelations = relations(processTimeline, ({ one }) => ({
  user: one(profiles, {
    fields: [processTimeline.userId],
    references: [profiles.id],
  }),
}))
