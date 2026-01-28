/**
 * Team Members Schema
 * Manages team members for team plans
 */

import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { profiles } from './profiles'

// Team member role enum
export const teamMemberRoleEnum = pgEnum('team_member_role', [
  'owner',
  'admin',
  'member',
  'viewer',
])

// Team member status enum
export const teamMemberStatusEnum = pgEnum('team_member_status', [
  'pending',
  'active',
  'inactive',
  'removed',
])

export const teamMembers = pgTable('team_members', {
  // Primary key
  id: uuid('id').defaultRandom().primaryKey(),

  // Foreign keys
  teamOwnerId: uuid('team_owner_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }), // Owner of the team plan

  memberProfileId: uuid('member_profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' }), // Profile of the team member (null if pending invitation)

  // Invitation info (for pending members)
  invitationEmail: varchar('invitation_email', { length: 255 }), // Email to send invitation
  invitationToken: varchar('invitation_token', { length: 255 }), // Unique token for invitation
  invitationExpiresAt: timestamp('invitation_expires_at', { withTimezone: true }), // Expiration date

  // Member info
  role: teamMemberRoleEnum('role').notNull().default('member'),
  status: teamMemberStatusEnum('status').notNull().default('pending'),

  // Permissions (stored as JSON for flexibility)
  permissions: varchar('permissions', { length: 500 }), // JSON string with permissions

  // Metadata
  invitedBy: uuid('invited_by').references(() => profiles.id), // Who sent the invitation
  joinedAt: timestamp('joined_at', { withTimezone: true }), // When they accepted the invitation

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Relations
export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  teamOwner: one(profiles, {
    fields: [teamMembers.teamOwnerId],
    references: [profiles.id],
  }),
  memberProfile: one(profiles, {
    fields: [teamMembers.memberProfileId],
    references: [profiles.id],
  }),
  inviter: one(profiles, {
    fields: [teamMembers.invitedBy],
    references: [profiles.id],
  }),
}))

// Types
export type TeamMember = typeof teamMembers.$inferSelect
export type NewTeamMember = typeof teamMembers.$inferInsert
