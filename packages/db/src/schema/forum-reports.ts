/**
 * Forum Reports Schema
 *
 * Tracks PDF exports and scheduled weekly reports for Forum.
 * Stores report history and schedule configurations.
 */

import { pgTable, uuid, text, timestamp, boolean, index, jsonb, pgEnum, integer } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'
import { relations } from 'drizzle-orm'

// ============================================================
// Enums
// ============================================================

export const forumReportTypeEnum = pgEnum('forum_report_type', [
  'single_debate',
  'weekly_summary',
  'monthly_summary',
  'deal_analysis',
  'expert_performance',
  'custom',
])

export const forumReportStatusEnum = pgEnum('forum_report_status', [
  'pending',
  'generating',
  'completed',
  'failed',
])

export const forumReportFormatEnum = pgEnum('forum_report_format', [
  'pdf',
  'html',
  'markdown',
])

// ============================================================
// Forum Reports Table
// ============================================================

export const forumReports = pgTable('forum_reports', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Owner
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Report info
  type: forumReportTypeEnum('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  format: forumReportFormatEnum('format').notNull().default('pdf'),

  // Status
  status: forumReportStatusEnum('status').notNull().default('pending'),
  errorMessage: text('error_message'),

  // File storage
  fileUrl: text('file_url'),
  fileSize: integer('file_size'), // bytes
  fileName: text('file_name'),

  // Report parameters
  parameters: jsonb('parameters').$type<{
    debateIds?: string[]
    dateFrom?: string
    dateTo?: string
    includeExperts?: boolean
    includeMetrics?: boolean
    includeCharts?: boolean
    dealIds?: string[]
    expertIds?: string[]
    [key: string]: unknown
  }>(),

  // Report content summary (for quick preview)
  summary: jsonb('summary').$type<{
    totalDebates?: number
    avgConsensus?: number
    topExperts?: Array<{ name: string; rating: number }>
    keyInsights?: string[]
  }>(),

  // Access
  shareToken: text('share_token'), // For sharing without login
  expiresAt: timestamp('expires_at', { withTimezone: true }),

  // Timestamps
  generatedAt: timestamp('generated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_forum_reports_user').on(table.userId),
  typeIdx: index('idx_forum_reports_type').on(table.type),
  statusIdx: index('idx_forum_reports_status').on(table.status),
  createdAtIdx: index('idx_forum_reports_created').on(table.createdAt),
}))

// ============================================================
// Scheduled Reports Table
// ============================================================

export const forumScheduledReports = pgTable('forum_scheduled_reports', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Owner
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Schedule config
  name: text('name').notNull(),
  type: forumReportTypeEnum('type').notNull(),
  format: forumReportFormatEnum('format').notNull().default('pdf'),

  // Schedule
  schedule: jsonb('schedule').$type<{
    frequency: 'daily' | 'weekly' | 'monthly'
    dayOfWeek?: number // 0-6 for weekly
    dayOfMonth?: number // 1-31 for monthly
    hour: number // 0-23
    timezone: string
  }>().notNull(),

  // Delivery
  deliveryMethod: jsonb('delivery_method').$type<{
    email?: boolean
    emailAddresses?: string[]
    inApp?: boolean
    webhook?: string
  }>().notNull(),

  // Report parameters
  parameters: jsonb('parameters').$type<{
    includeExperts?: boolean
    includeMetrics?: boolean
    includeCharts?: boolean
    debateFilter?: {
      status?: string[]
      minConsensus?: number
    }
  }>(),

  // Status
  isActive: boolean('is_active').notNull().default(true),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  lastReportId: uuid('last_report_id'),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
  runCount: integer('run_count').notNull().default(0),
  failCount: integer('fail_count').notNull().default(0),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_forum_scheduled_reports_user').on(table.userId),
  activeIdx: index('idx_forum_scheduled_reports_active').on(table.isActive),
  nextRunIdx: index('idx_forum_scheduled_reports_next').on(table.nextRunAt),
}))

// ============================================================
// Relations
// ============================================================

export const forumReportsRelations = relations(forumReports, ({ one }) => ({
  user: one(profiles, {
    fields: [forumReports.userId],
    references: [profiles.id],
  }),
}))

export const forumScheduledReportsRelations = relations(forumScheduledReports, ({ one }) => ({
  user: one(profiles, {
    fields: [forumScheduledReports.userId],
    references: [profiles.id],
  }),
}))

// ============================================================
// Types
// ============================================================

export type ForumReport = typeof forumReports.$inferSelect
export type NewForumReport = typeof forumReports.$inferInsert
export type ForumScheduledReport = typeof forumScheduledReports.$inferSelect
export type NewForumScheduledReport = typeof forumScheduledReports.$inferInsert
export type ForumReportType =
  | 'single_debate'
  | 'weekly_summary'
  | 'monthly_summary'
  | 'deal_analysis'
  | 'expert_performance'
  | 'custom'
export type ForumReportStatus = 'pending' | 'generating' | 'completed' | 'failed'
export type ForumReportFormat = 'pdf' | 'html' | 'markdown'
