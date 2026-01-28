/**
 * Team Members Router
 * 
 * Manages team members for team plans (CRUD operations)
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import { teamMembers, profiles } from '@quoorum/db/schema'
import { eq, and, desc, isNull, or } from 'drizzle-orm'
import { logger } from '../lib/logger'
import { sendTeamInvitationEmail } from '@quoorum/workers'
import crypto from 'crypto'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
})

const updateTeamMemberSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'member', 'viewer']).optional(),
  status: z.enum(['pending', 'active', 'inactive', 'removed']).optional(),
})

const removeTeamMemberSchema = z.object({
  id: z.string().uuid(),
})

// ============================================================================
// ROUTER
// ============================================================================

export const teamMembersRouter = router({
  // --------------------------------------------------------------------------
  // LIST: Get all team members (including pending invitations)
  // --------------------------------------------------------------------------
  list: protectedProcedure.query(async ({ ctx }) => {
    // Get all team members where the current user is the team owner
    const members = await db
      .select({
        id: teamMembers.id,
        teamOwnerId: teamMembers.teamOwnerId,
        memberProfileId: teamMembers.memberProfileId,
        invitationEmail: teamMembers.invitationEmail,
        role: teamMembers.role,
        status: teamMembers.status,
        permissions: teamMembers.permissions,
        invitedBy: teamMembers.invitedBy,
        joinedAt: teamMembers.joinedAt,
        createdAt: teamMembers.createdAt,
        updatedAt: teamMembers.updatedAt,
        // Profile info (if member has accepted invitation)
        memberName: profiles.name,
        memberEmail: profiles.email,
        memberAvatar: profiles.avatarUrl,
      })
      .from(teamMembers)
      .leftJoin(profiles, eq(teamMembers.memberProfileId, profiles.id))
      .where(eq(teamMembers.teamOwnerId, ctx.userId))
      .orderBy(desc(teamMembers.createdAt))

    return members.map((member) => ({
      id: member.id,
      email: member.memberEmail || member.invitationEmail || '',
      name: member.memberName || null,
      avatar: member.memberAvatar || null,
      role: member.role,
      status: member.status,
      isPending: member.status === 'pending',
      joinedAt: member.joinedAt,
      createdAt: member.createdAt,
    }))
  }),

  // --------------------------------------------------------------------------
  // INVITE: Invite a new team member
  // --------------------------------------------------------------------------
  invite: protectedProcedure
    .input(inviteTeamMemberSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user already has a team plan (this would be checked via subscription)
      // For now, we'll allow any user to invite members

      // Check if email is already invited or is a member
      const existing = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamOwnerId, ctx.userId),
            or(
              eq(teamMembers.invitationEmail, input.email),
              eq(teamMembers.memberProfileId, ctx.userId) // Check if profile exists with this email
            ),
            or(
              eq(teamMembers.status, 'pending'),
              eq(teamMembers.status, 'active')
            )
          )
        )
        .limit(1)

      if (existing.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Este email ya está invitado o es miembro del equipo',
        })
      }

      // Generate invitation token
      const invitationToken = crypto.randomBytes(32).toString('hex')
      const invitationExpiresAt = new Date()
      invitationExpiresAt.setDate(invitationExpiresAt.getDate() + 7) // 7 days expiration

      // Get inviter name for email
      const [inviterProfile] = await db
        .select({ name: profiles.name })
        .from(profiles)
        .where(eq(profiles.id, ctx.userId))
        .limit(1)

      const inviterName = inviterProfile?.name || 'Un usuario de Quoorum'

      // Create invitation
      const [invitation] = await db
        .insert(teamMembers)
        .values({
          teamOwnerId: ctx.userId,
          invitationEmail: input.email,
          invitationToken,
          invitationExpiresAt,
          role: input.role,
          status: 'pending',
          invitedBy: ctx.userId,
        })
        .returning()

      // Send invitation email (non-blocking)
      void sendTeamInvitationEmail(
        input.email,
        inviterName,
        invitationToken,
        input.role
      ).then((result) => {
        if (result.success) {
          logger.info('Team invitation email sent', { email: input.email })
        } else {
          logger.warn('Failed to send team invitation email', {
            email: input.email,
            error: result.error,
          })
        }
      })

      logger.info('Team member invitation created', {
        invitationId: invitation.id,
        email: input.email,
        teamOwnerId: ctx.userId,
      })

      return {
        id: invitation.id,
        email: input.email,
        role: input.role,
        status: 'pending',
        invitationToken, // Return token for email link generation
      }
    }),

  // --------------------------------------------------------------------------
  // UPDATE: Update team member role or status
  // --------------------------------------------------------------------------
  update: protectedProcedure
    .input(updateTeamMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input

      // Verify that the current user is the team owner
      const [existing] = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.id, id),
            eq(teamMembers.teamOwnerId, ctx.userId)
          )
        )
        .limit(1)

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Miembro del equipo no encontrado',
        })
      }

      // Prevent changing owner role
      if (existing.role === 'owner' && updates.role && updates.role !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No se puede cambiar el rol del propietario del equipo',
        })
      }

      const [updated] = await db
        .update(teamMembers)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(teamMembers.id, id))
        .returning()

      return updated
    }),

  // --------------------------------------------------------------------------
  // REMOVE: Remove a team member
  // --------------------------------------------------------------------------
  remove: protectedProcedure
    .input(removeTeamMemberSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify that the current user is the team owner
      const [existing] = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.id, input.id),
            eq(teamMembers.teamOwnerId, ctx.userId)
          )
        )
        .limit(1)

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Miembro del equipo no encontrado',
        })
      }

      // Prevent removing owner
      if (existing.role === 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No se puede eliminar al propietario del equipo',
        })
      }

      // Soft delete: set status to 'removed'
      const [removed] = await db
        .update(teamMembers)
        .set({
          status: 'removed',
          updatedAt: new Date(),
        })
        .where(eq(teamMembers.id, input.id))
        .returning()

      return removed
    }),

  // --------------------------------------------------------------------------
  // ACCEPT INVITATION: Accept a team invitation (public endpoint)
  // --------------------------------------------------------------------------
  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Find invitation by token
      const [invitation] = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.invitationToken, input.token),
            eq(teamMembers.status, 'pending')
          )
        )
        .limit(1)

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitación no encontrada o ya aceptada',
        })
      }

      // Check expiration
      if (invitation.invitationExpiresAt && invitation.invitationExpiresAt < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'La invitación ha expirado',
        })
      }

      // Verify email matches
      // Get user email from profile
      const [userProfile] = await db
        .select({ email: profiles.email })
        .from(profiles)
        .where(eq(profiles.id, ctx.userId))
        .limit(1)

      if (!userProfile || invitation.invitationEmail !== userProfile.email) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'El email de la invitación no coincide con tu cuenta',
        })
      }

      // Update invitation to active and link to profile
      const [accepted] = await db
        .update(teamMembers)
        .set({
          memberProfileId: ctx.userId,
          status: 'active',
          joinedAt: new Date(),
          invitationToken: null, // Clear token
          updatedAt: new Date(),
        })
        .where(eq(teamMembers.id, invitation.id))
        .returning()

      return accepted
    }),
})
