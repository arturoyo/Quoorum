/**
 * Integration Pairings Schema
 * Secure pairing codes for Slack/Discord bot integration.
 */

import { pgTable, uuid, varchar, timestamp, pgEnum, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { profiles } from './profiles'
import { companies } from './companies'

export const pairingPlatformEnum = pgEnum('pairing_platform', [
  'slack',
  'discord',
  'teams',
])

export const pairingStatusEnum = pgEnum('pairing_status', [
  'pending',     // Code generated, waiting for bot to claim
  'completed',   // Bot claimed the code, link established
  'expired',     // Code expired (TTL: 10 min)
  'revoked',     // Manually revoked by user
])

export const integrationPairings = pgTable('integration_pairings', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Scope
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Pairing code (8-char alphanumeric, uppercase)
  pairingCode: varchar('pairing_code', { length: 8 }).notNull().unique(),

  // Platform
  platform: pairingPlatformEnum('platform').notNull(),

  // Status
  status: pairingStatusEnum('status').notNull().default('pending'),

  // External ID (set when bot claims the code)
  externalId: varchar('external_id', { length: 255 }),        // Slack team_id, Discord guild_id
  externalChannelId: varchar('external_channel_id', { length: 255 }),  // Channel where bot operates
  externalName: varchar('external_name', { length: 255 }),     // Workspace/guild name

  // Expiration
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  codeIdx: index('idx_pairings_code').on(table.pairingCode),
  companyIdx: index('idx_pairings_company').on(table.companyId),
  statusIdx: index('idx_pairings_status').on(table.status),
  platformIdx: index('idx_pairings_platform').on(table.platform),
}))

// Relations
export const integrationPairingsRelations = relations(integrationPairings, ({ one }) => ({
  company: one(companies, {
    fields: [integrationPairings.companyId],
    references: [companies.id],
  }),
  createdByProfile: one(profiles, {
    fields: [integrationPairings.createdBy],
    references: [profiles.id],
  }),
}))

// Types
export type IntegrationPairing = typeof integrationPairings.$inferSelect
export type NewIntegrationPairing = typeof integrationPairings.$inferInsert
