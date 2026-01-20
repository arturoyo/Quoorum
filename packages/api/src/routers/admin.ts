/**
 * Admin Router
 * 
 * Administrative controls for Quoorum system:
 * - Credit multiplier management (CREDIT_MULTIPLIER)
 * - User management (search, add credits)
 * - Model/API health monitoring
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, adminProcedure } from '../trpc'
import { db } from '@quoorum/db'
import { users, profiles, usage, subscriptions } from '@quoorum/db/schema'
import { eq, and, like, desc, sql } from 'drizzle-orm'
import { CREDIT_MULTIPLIER } from '@quoorum/quoorum'
import { env } from '../env'

// ============================================================================
// SCHEMAS
// ============================================================================

const searchUsersSchema = z.object({
  email: z.string().email().optional(),
  search: z.string().min(1).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
})

const addCreditsSchema = z.object({
  userId: z.string().uuid(),
  credits: z.number().int().positive(),
  reason: z.string().max(500).optional(),
})

const updateCreditMultiplierSchema = z.object({
  multiplier: z.number().min(1).max(10), // 1.0 to 10.0
})

// ============================================================================
// ROUTER
// ============================================================================

export const adminRouter = router({
  /**
   * Search users by email or name
   */
  searchUsers: adminProcedure
    .input(searchUsersSchema)
    .query(async ({ ctx, input }) => {
      const conditions = []

      if (input.email) {
        conditions.push(eq(users.email, input.email))
      }

      if (input.search) {
        conditions.push(
          sql`(${users.email} ILIKE ${`%${input.search}%`} OR ${users.name} ILIKE ${`%${input.search}%`})`
        )
      }

      const results = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          tier: users.tier,
          credits: users.credits,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(users.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      return results
    }),

  /**
   * Get user details with usage and subscription
   */
  getUserDetails: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1)

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        })
      }

      // Get current subscription
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, input.userId), eq(subscriptions.status, 'active')))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1)

      // Get current period usage
      const now = new Date()
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const [currentUsage] = await db
        .select()
        .from(usage)
        .where(
          and(
            eq(usage.userId, input.userId),
            sql`${usage.periodStart} >= ${periodStart}`,
            sql`${usage.periodEnd} <= ${periodEnd}`
          )
        )
        .limit(1)

      return {
        user,
        subscription: subscription || null,
        currentUsage: currentUsage || null,
      }
    }),

  /**
   * Add credits to user (for support)
   */
  addCredits: adminProcedure
    .input(addCreditsSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user exists
      const [user] = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1)

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        })
      }

      // Add credits atomically
      const [updated] = await db
        .update(users)
        .set({
          credits: sql`${users.credits} + ${input.credits}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId))
        .returning()

      return {
        success: true,
        userId: input.userId,
        creditsAdded: input.credits,
        newBalance: updated.credits,
        reason: input.reason || 'Añadidos por administrador',
        adminId: ctx.user.id,
      }
    }),

  /**
   * Get current credit multiplier
   */
  getCreditMultiplier: adminProcedure.query(() => {
    return {
      multiplier: CREDIT_MULTIPLIER,
      usdPerCredit: 0.005,
      formula: `credits = (costUsd * ${CREDIT_MULTIPLIER}) / 0.005`,
      note: 'Para cambiar el multiplicador, edita CREDIT_MULTIPLIER en packages/quoorum/src/analytics/cost.ts y reinicia el servidor',
    }
  }),

  /**
   * Get usage history for a user
   */
  getUserUsageHistory: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const results = await db
        .select()
        .from(usage)
        .where(eq(usage.userId, input.userId))
        .orderBy(desc(usage.periodStart))
        .limit(input.limit)
        .offset(input.offset)

      return results
    }),

  /**
   * Get payment history for a user (from subscriptions)
   */
  getUserPaymentHistory: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const results = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, input.userId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      return results
    }),

  /**
   * Get API model health status (mock for now - would need real health check)
   */
  getModelHealth: adminProcedure.query(async () => {
    // Mock health status - in real implementation, this would check each provider
    const models = [
      { provider: 'openai', model: 'gpt-4o', status: 'healthy' as const, latency: 120, errorRate: 0.02 },
      { provider: 'openai', model: 'gpt-4o-mini', status: 'healthy' as const, latency: 80, errorRate: 0.01 },
      { provider: 'anthropic', model: 'claude-3-5-sonnet', status: 'healthy' as const, latency: 150, errorRate: 0.03 },
      { provider: 'google', model: 'gemini-2.0-flash-exp', status: 'healthy' as const, latency: 200, errorRate: 0.01 },
      { provider: 'google', model: 'gemini-1.5-pro', status: 'degraded' as const, latency: 300, errorRate: 0.05 },
      { provider: 'deepseek', model: 'deepseek-chat', status: 'healthy' as const, latency: 100, errorRate: 0.02 },
      { provider: 'groq', model: 'llama-3.3-70b', status: 'healthy' as const, latency: 50, errorRate: 0.01 },
    ]

    return {
      models,
      overallHealth: 'healthy' as const,
      lastChecked: new Date().toISOString(),
    }
  }),

  /**
   * Get Stripe configuration variables (for admin visibility)
   */
  getStripeConfig: adminProcedure.query(() => {
    
    return {
      // Stripe Keys
      hasSecretKey: !!env.STRIPE_SECRET_KEY,
      secretKeyPrefix: env.STRIPE_SECRET_KEY ? `${env.STRIPE_SECRET_KEY.substring(0, 10)}...` : 'NO CONFIGURADO',
      hasWebhookSecret: !!env.STRIPE_WEBHOOK_SECRET,
      webhookSecretPrefix: env.STRIPE_WEBHOOK_SECRET ? `${env.STRIPE_WEBHOOK_SECRET.substring(0, 10)}...` : 'NO CONFIGURADO',
      
      // Subscription Price IDs
      priceIds: {
        starter: {
          monthly: env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'NO CONFIGURADO',
          yearly: env.STRIPE_STARTER_YEARLY_PRICE_ID || 'NO CONFIGURADO',
        },
        pro: {
          monthly: env.STRIPE_PRO_MONTHLY_PRICE_ID || 'NO CONFIGURADO',
          yearly: env.STRIPE_PRO_YEARLY_PRICE_ID || 'NO CONFIGURADO',
        },
        business: {
          monthly: env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || 'NO CONFIGURADO',
          yearly: env.STRIPE_BUSINESS_YEARLY_PRICE_ID || 'NO CONFIGURADO',
        },
      },
      
      // Credit Pack Price IDs
      creditPacks: {
        '100': env.STRIPE_CREDITS_100_PRICE_ID || 'NO CONFIGURADO',
        '500': env.STRIPE_CREDITS_500_PRICE_ID || 'NO CONFIGURADO',
        '1000': env.STRIPE_CREDITS_1000_PRICE_ID || 'NO CONFIGURADO',
        '5000': env.STRIPE_CREDITS_5000_PRICE_ID || 'NO CONFIGURADO',
        '10000': env.STRIPE_CREDITS_10000_PRICE_ID || 'NO CONFIGURADO',
      },
      
      // App URL
      appUrl: env.NEXT_PUBLIC_APP_URL || 'NO CONFIGURADO',
    }
  }),
})
