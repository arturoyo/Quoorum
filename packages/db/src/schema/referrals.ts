import { pgTable, uuid, varchar, timestamp, integer, pgEnum, jsonb, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { profiles } from './profiles'

// ============================================================================
// ENUMS
// ============================================================================

export const referralStatusEnum = pgEnum('referral_status', [
  'pending',    // Invitation sent, waiting for registration
  'converted',  // User registered and converted
  'rewarded',   // Reward claimed by referrer
  'expired',    // Invitation expired
  'cancelled',  // Invitation cancelled
])

export const referralRewardTypeEnum = pgEnum('referral_reward_type', [
  'free_month',      // Free month of subscription
  'unlock_agent',    // Unlock a premium agent
  'credits',         // Credit bonus
  'feature_unlock',  // Unlock a feature
  'discount',        // Discount code
])

// ============================================================================
// TABLES
// ============================================================================

/**
 * Referral Codes Table
 * Stores unique referral codes for each user (format: QUOORUM-XXXXXX)
 */
export const referralCodes = pgTable('referral_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' })
    .unique(), // One code per user
  code: varchar('code', { length: 20 }).notNull().unique(), // QUOORUM-XXXXXX format
  maxUses: integer('max_uses').default(100), // Maximum number of uses (null = unlimited)
  currentUses: integer('current_uses').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

/**
 * Referrals Table
 * Tracks individual referral invitations and conversions
 */
export const referrals = pgTable('referrals', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Referrer (who sent the invitation)
  referrerId: uuid('referrer_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  referralCodeId: uuid('referral_code_id')
    .references(() => referralCodes.id, { onDelete: 'set null' }),
  
  // Referred user (who was invited)
  referredEmail: varchar('referred_email', { length: 255 }), // Email of invited user (before registration)
  referredUserId: uuid('referred_user_id')
    .references(() => profiles.id, { onDelete: 'set null' }), // User ID after registration
  
  // Status and conversion
  status: referralStatusEnum('status').notNull().default('pending'),
  convertedAt: timestamp('converted_at', { withTimezone: true }), // When user registered
  rewardedAt: timestamp('rewarded_at', { withTimezone: true }), // When reward was claimed
  expiresAt: timestamp('expires_at', { withTimezone: true }), // Invitation expiration (30 days default)
  
  // Rewards
  rewardType: referralRewardTypeEnum('reward_type'), // Type of reward for referrer
  rewardValue: integer('reward_value'), // Reward amount (credits, discount %, etc.)
  rewardClaimed: boolean('reward_claimed').default(false).notNull(),
  
  // Invitation method
  invitationMethod: varchar('invitation_method', { length: 50 }), // 'email', 'whatsapp', 'link', etc.
  invitationSentAt: timestamp('invitation_sent_at', { withTimezone: true }),
  
  // Metadata
  metadata: jsonb('metadata').$type<{
    bonusShown?: boolean // Whether bonus banner was shown to referred user
    registrationSource?: string // Where user came from
    [key: string]: unknown
  }>(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================================
// RELATIONS
// ============================================================================

export const referralCodesRelations = relations(referralCodes, ({ one, many }) => ({
  user: one(profiles, {
    fields: [referralCodes.userId],
    references: [profiles.id],
  }),
  referrals: many(referrals),
}))

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(profiles, {
    fields: [referrals.referrerId],
    references: [profiles.id],
    relationName: 'referrer',
  }),
  referredUser: one(profiles, {
    fields: [referrals.referredUserId],
    references: [profiles.id],
    relationName: 'referred',
  }),
  referralCode: one(referralCodes, {
    fields: [referrals.referralCodeId],
    references: [referralCodes.id],
  }),
}))

// ============================================================================
// TYPES
// ============================================================================

export type ReferralCode = typeof referralCodes.$inferSelect
export type NewReferralCode = typeof referralCodes.$inferInsert

export type Referral = typeof referrals.$inferSelect
export type NewReferral = typeof referrals.$inferInsert
