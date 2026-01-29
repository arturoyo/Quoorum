/**
 * Debate Sessions Schema
 * Persists real-time state of debates in execution for pause/resume/inject.
 */

import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, pgEnum, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { profiles } from './profiles'

export const debateSessionStateEnum = pgEnum('debate_session_state', [
  'initializing',
  'running',
  'paused',
  'waiting_input',   // Waiting for user to inject context
  'consensus_reached',
  'force_concluded',
  'failed',
  'completed',
])

export const debateSessions = pgTable('debate_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Link to the debate record
  debateId: uuid('debate_id').notNull(),

  // Session state
  state: debateSessionStateEnum('state').notNull().default('initializing'),
  currentRound: integer('current_round').notNull().default(0),
  maxRounds: integer('max_rounds').notNull().default(10),

  // Pause/resume
  pausedAt: timestamp('paused_at', { withTimezone: true }),
  pausedBy: uuid('paused_by')
    .references(() => profiles.id, { onDelete: 'set null' }),
  pauseReason: varchar('pause_reason', { length: 255 }),

  // Additional context injected mid-debate
  additionalContext: jsonb('additional_context').$type<Array<{
    text: string
    injectedAt: string
    injectedBy: string
  }>>().default([]),

  // Live metadata (updated each round)
  liveMetadata: jsonb('live_metadata').$type<{
    consensusScore?: number
    dominantPosition?: string
    activeExperts?: string[]
    lastRoundSummary?: string
    argumentCount?: number
  }>(),

  // Error info
  errorMessage: text('error_message'),

  // Owner
  createdBy: uuid('created_by')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Timestamps
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  debateIdx: index('idx_sessions_debate').on(table.debateId),
  stateIdx: index('idx_sessions_state').on(table.state),
  createdByIdx: index('idx_sessions_created_by').on(table.createdBy),
}))

// Relations
export const debateSessionsRelations = relations(debateSessions, ({ one }) => ({
  createdByProfile: one(profiles, {
    fields: [debateSessions.createdBy],
    references: [profiles.id],
  }),
  pausedByProfile: one(profiles, {
    fields: [debateSessions.pausedBy],
    references: [profiles.id],
    relationName: 'pausedBy',
  }),
}))

// Types
export type DebateSession = typeof debateSessions.$inferSelect
export type NewDebateSession = typeof debateSessions.$inferInsert
