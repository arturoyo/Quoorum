/**
 * Referrals Router
 * 
 * Complete referral system for user growth:
 * - Generate unique referral codes (QUOORUM-XXXXXX)
 * - Track invitations and conversions
 * - Reward system for referrers
 * - WhatsApp and email invitations
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { eq, and, desc, isNull, sql, or, gte } from 'drizzle-orm'
import { router, protectedProcedure, publicProcedure } from '../trpc'
import { db } from '@quoorum/db'
import { referralCodes, referrals, profiles } from '@quoorum/db/schema'
import { logger } from '../lib/logger'
import { inngest } from '../lib/inngest-client'

// ============================================================================
// SCHEMAS
// ============================================================================

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  method: z.enum(['email', 'whatsapp', 'link']).default('email'),
  message: z.string().max(500).optional(),
})

const listReferralsSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  status: z.enum(['pending', 'converted', 'rewarded', 'expired', 'cancelled']).optional(),
})

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate unique referral code in format QUOORUM-XXXXXX
 */
async function generateReferralCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars (0, O, I, 1)
  let code: string
  let attempts = 0
  const maxAttempts = 10

  do {
    // Generate 6 random characters
    const randomPart = Array.from({ length: 6 }, () => {
      return chars[Math.floor(Math.random() * chars.length)]
    }).join('')

    code = `QUOORUM-${randomPart}`

    // Check if code already exists
    const [existing] = await db
      .select({ id: referralCodes.id })
      .from(referralCodes)
      .where(eq(referralCodes.code, code))
      .limit(1)

    if (!existing) {
      return code
    }

    attempts++
  } while (attempts < maxAttempts)

  // Fallback: add timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4)
  return `QUOORUM-${timestamp}${Math.random().toString(36).substring(2, 4).toUpperCase()}`
}

/**
 * Get or create referral code for user
 */
async function getOrCreateReferralCode(userId: string) {
  // Try to get existing code
  const [existing] = await db
    .select()
    .from(referralCodes)
    .where(and(eq(referralCodes.userId, userId), eq(referralCodes.isActive, true)))
    .limit(1)

  if (existing) {
    return existing
  }

  // Generate new code
  const code = await generateReferralCode()

  const [newCode] = await db
    .insert(referralCodes)
    .values({
      userId,
      code,
      maxUses: 100, // Default limit
      currentUses: 0,
      isActive: true,
    })
    .returning()

  if (!newCode) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error al generar código de referido',
    })
  }

  return newCode
}

// ============================================================================
// ROUTER
// ============================================================================

export const referralsRouter = router({
  /**
   * Get or generate user's referral code
   */
  getMyCode: protectedProcedure.query(async ({ ctx }) => {
    const code = await getOrCreateReferralCode(ctx.userId)

    return {
      code: code.code,
      currentUses: code.currentUses,
      maxUses: code.maxUses,
      isActive: code.isActive,
      createdAt: code.createdAt,
    }
  }),

  /**
   * Regenerate referral code (deactivate old, create new)
   */
  regenerateCode: protectedProcedure.mutation(async ({ ctx }) => {
    // Deactivate old code
    await db
      .update(referralCodes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(referralCodes.userId, ctx.userId), eq(referralCodes.isActive, true)))

    // Generate new code
    const newCode = await getOrCreateReferralCode(ctx.userId)

    logger.info('Referral code regenerated', {
      userId: ctx.userId,
      newCode: newCode.code,
    })

    return {
      code: newCode.code,
      currentUses: newCode.currentUses,
      maxUses: newCode.maxUses,
      isActive: newCode.isActive,
    }
  }),

  /**
   * Get referral statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    // Get referral code
    const [code] = await db
      .select()
      .from(referralCodes)
      .where(and(eq(referralCodes.userId, ctx.userId), eq(referralCodes.isActive, true)))
      .limit(1)

    if (!code) {
      return {
        totalReferrals: 0,
        pendingReferrals: 0,
        convertedReferrals: 0,
        rewardedReferrals: 0,
        currentUses: 0,
        maxUses: 100,
      }
    }

    // Count referrals by status
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referrals)
      .where(eq(referrals.referrerId, ctx.userId))

    const [pendingResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referrals)
      .where(and(eq(referrals.referrerId, ctx.userId), eq(referrals.status, 'pending')))

    const [convertedResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referrals)
      .where(and(eq(referrals.referrerId, ctx.userId), eq(referrals.status, 'converted')))

    const [rewardedResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referrals)
      .where(and(eq(referrals.referrerId, ctx.userId), eq(referrals.rewardClaimed, true)))

    return {
      totalReferrals: totalResult?.count ?? 0,
      pendingReferrals: pendingResult?.count ?? 0,
      convertedReferrals: convertedResult?.count ?? 0,
      rewardedReferrals: rewardedResult?.count ?? 0,
      currentUses: code.currentUses,
      maxUses: code.maxUses,
    }
  }),

  /**
   * Send invitation (email or WhatsApp)
   */
  invite: protectedProcedure.input(inviteSchema).mutation(async ({ ctx, input }) => {
    // Get or create referral code
    const code = await getOrCreateReferralCode(ctx.userId)

    // Check if email already invited
    const [existing] = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerId, ctx.userId),
          eq(referrals.referredEmail, input.email),
          or(eq(referrals.status, 'pending'), eq(referrals.status, 'converted'))
        )
      )
      .limit(1)

    if (existing) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Este email ya fue invitado',
      })
    }

    // Check max uses
    if (code.maxUses && code.currentUses >= code.maxUses) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Has alcanzado el límite de invitaciones',
      })
    }

    // Create referral record
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days expiration

    const [referral] = await db
      .insert(referrals)
      .values({
        referrerId: ctx.userId,
        referralCodeId: code.id,
        referredEmail: input.email,
        status: 'pending',
        invitationMethod: input.method,
        invitationSentAt: new Date(),
        expiresAt,
        metadata: {
          message: input.message,
        },
      })
      .returning()

    if (!referral) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al crear invitación',
      })
    }

    // Update code usage count
    await db
      .update(referralCodes)
      .set({
        currentUses: sql`${referralCodes.currentUses} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(referralCodes.id, code.id))

    // Send invitation via Inngest
    if (input.method === 'whatsapp') {
      await inngest.send({
        name: 'referrals/invite.whatsapp',
        data: {
          referralId: referral.id,
          email: input.email,
          code: code.code,
          message: input.message,
        },
      })
    } else if (input.method === 'email') {
      await inngest.send({
        name: 'referrals/invite.email',
        data: {
          referralId: referral.id,
          email: input.email,
          code: code.code,
          message: input.message,
        },
      })
    }

    logger.info('Referral invitation sent', {
      userId: ctx.userId,
      referralId: referral.id,
      email: input.email,
      method: input.method,
    })

    return {
      referralId: referral.id,
      code: code.code,
      expiresAt: referral.expiresAt,
    }
  }),

  /**
   * List all referrals with pagination
   */
  list: protectedProcedure.input(listReferralsSchema).query(async ({ ctx, input }) => {
    const conditions = [eq(referrals.referrerId, ctx.userId)]

    if (input.status) {
      conditions.push(eq(referrals.status, input.status))
    }

    const results = await db
      .select()
      .from(referrals)
      .where(and(...conditions))
      .orderBy(desc(referrals.createdAt))
      .limit(input.limit)
      .offset(input.offset)

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referrals)
      .where(and(...conditions))

    return {
      items: results,
      total: totalResult?.count ?? 0,
      limit: input.limit,
      offset: input.offset,
    }
  }),

  /**
   * Validate referral code (public endpoint)
   */
  validateCode: publicProcedure
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ input }) => {
      const [code] = await db
        .select()
        .from(referralCodes)
        .where(and(eq(referralCodes.code, input.code), eq(referralCodes.isActive, true)))
        .limit(1)

      if (!code) {
        return {
          valid: false,
          message: 'Código de referido inválido',
        }
      }

      // Check if code has reached max uses
      if (code.maxUses && code.currentUses >= code.maxUses) {
        return {
          valid: false,
          message: 'Este código ha alcanzado su límite de usos',
        }
      }

      // Get referrer profile
      const [referrer] = await db
        .select({ name: profiles.name, email: profiles.email })
        .from(profiles)
        .where(eq(profiles.id, code.userId))
        .limit(1)

      return {
        valid: true,
        code: code.code,
        referrerName: referrer?.name ?? 'Usuario',
        message: `Código válido. Obtendrás un bonus al registrarte.`,
      }
    }),

  /**
   * Convert referral on registration (called from auth callback)
   */
  convertReferral: publicProcedure
    .input(
      z.object({
        referralCode: z.string().min(1),
        referredUserId: z.string().uuid(),
        referredEmail: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      // Find referral code
      const [code] = await db
        .select()
        .from(referralCodes)
        .where(and(eq(referralCodes.code, input.referralCode), eq(referralCodes.isActive, true)))
        .limit(1)

      if (!code) {
        logger.warn('Invalid referral code on conversion', { code: input.referralCode })
        return { success: false, message: 'Código de referido inválido' }
      }

      // Find pending referral by email
      const [referral] = await db
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.referralCodeId, code.id),
            eq(referrals.referredEmail, input.referredEmail),
            eq(referrals.status, 'pending')
          )
        )
        .limit(1)

      if (!referral) {
        // Create new referral if not found (direct link usage)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        const [newReferral] = await db
          .insert(referrals)
          .values({
            referrerId: code.userId,
            referralCodeId: code.id,
            referredEmail: input.referredEmail,
            referredUserId: input.referredUserId,
            status: 'converted',
            convertedAt: new Date(),
            expiresAt,
            invitationMethod: 'link',
            metadata: {
              registrationSource: 'direct_link',
            },
          })
          .returning()

        if (newReferral) {
          logger.info('Referral converted (direct link)', {
            referralId: newReferral.id,
            referrerId: code.userId,
            referredUserId: input.referredUserId,
          })
        }

        return { success: true, referralId: newReferral?.id }
      }

      // Update existing referral
      await db
        .update(referrals)
        .set({
          referredUserId: input.referredUserId,
          status: 'converted',
          convertedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(referrals.id, referral.id))

      logger.info('Referral converted', {
        referralId: referral.id,
        referrerId: code.userId,
        referredUserId: input.referredUserId,
      })

      return { success: true, referralId: referral.id }
    }),

  /**
   * Claim referral reward
   */
  claimReward: protectedProcedure
    .input(z.object({ referralId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get referral
      const [referral] = await db
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.id, input.referralId),
            eq(referrals.referrerId, ctx.userId),
            eq(referrals.status, 'converted'),
            eq(referrals.rewardClaimed, false)
          )
        )
        .limit(1)

      if (!referral) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Referido no encontrado o recompensa ya reclamada',
        })
      }

      // Determine reward (default: 100 credits)
      const rewardType = referral.rewardType ?? 'credits'
      const rewardValue = referral.rewardValue ?? 100

      // Apply reward
      if (rewardType === 'credits') {
        // Get user profile to find users.id
        const [profile] = await db
          .select({ userId: profiles.userId })
          .from(profiles)
          .where(eq(profiles.id, ctx.userId))
          .limit(1)

        if (profile) {
          // Add credits to user's account
          await db
            .update(users)
            .set({
              credits: sql`${users.credits} + ${rewardValue}`,
              updatedAt: new Date(),
            })
            .where(eq(users.id, profile.userId))

          logger.info('Referral reward claimed (credits)', {
            referralId: referral.id,
            userId: ctx.userId,
            credits: rewardValue,
          })
        }
      }

      // Mark reward as claimed
      await db
        .update(referrals)
        .set({
          rewardClaimed: true,
          rewardedAt: new Date(),
          status: 'rewarded',
          updatedAt: new Date(),
        })
        .where(eq(referrals.id, referral.id))

      return {
        success: true,
        rewardType,
        rewardValue,
      }
    }),

  /**
   * Get shareable invite URL
   */
  getInviteUrl: protectedProcedure.query(async ({ ctx }) => {
    const code = await getOrCreateReferralCode(ctx.userId)

    // Get app URL from env (default to localhost for dev)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return {
      url: `${appUrl}/signup?ref=${code.code}`,
      code: code.code,
    }
  }),

  /**
   * Bulk WhatsApp invitations via Inngest
   */
  inviteViaWhatsapp: protectedProcedure
    .input(
      z.object({
        phoneNumbers: z.array(z.string().regex(/^\+?[0-9]{9,15}$/)).min(1).max(50),
        message: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const code = await getOrCreateReferralCode(ctx.userId)

      // Check max uses
      if (code.maxUses && code.currentUses + input.phoneNumbers.length > code.maxUses) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El número de invitaciones excede el límite permitido',
        })
      }

      // Create referral records for each phone number
      const referralIds: string[] = []

      for (const phone of input.phoneNumbers) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        const [referral] = await db
          .insert(referrals)
          .values({
            referrerId: ctx.userId,
            referralCodeId: code.id,
            referredEmail: `${phone}@whatsapp.local`, // Placeholder email for WhatsApp
            status: 'pending',
            invitationMethod: 'whatsapp',
            invitationSentAt: new Date(),
            expiresAt,
            metadata: {
              phoneNumber: phone,
              message: input.message,
            },
          })
          .returning()

        if (referral) {
          referralIds.push(referral.id)
        }
      }

      // Update code usage count
      await db
        .update(referralCodes)
        .set({
          currentUses: sql`${referralCodes.currentUses} + ${input.phoneNumbers.length}`,
          updatedAt: new Date(),
        })
        .where(eq(referralCodes.id, code.id))

      // Trigger bulk WhatsApp send via Inngest
      await inngest.send({
        name: 'referrals/invite.batch-whatsapp',
        data: {
          referralIds,
          code: code.code,
          message: input.message,
        },
      })

      logger.info('Bulk WhatsApp invitations sent', {
        userId: ctx.userId,
        count: input.phoneNumbers.length,
        referralIds,
      })

      return {
        success: true,
        count: referralIds.length,
        referralIds,
      }
    }),
})
