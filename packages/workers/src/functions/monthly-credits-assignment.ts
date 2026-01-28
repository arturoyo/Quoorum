/**
 * Monthly Credits Assignment Worker
 * 
 * Asigna créditos mensuales automáticamente cuando se renueva una suscripción
 * o al inicio de cada período de facturación.
 */

import { inngest } from '../client'
import { db } from '@quoorum/db'
import { subscriptions, plans } from '@quoorum/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { logger } from '../lib/logger'
import type { Inngest } from 'inngest'

// ============================================================================
// PLAN CREDIT LIMITS (Fuente de verdad: subscription-management-modal.tsx)
// ============================================================================

const PLAN_MONTHLY_CREDITS: Record<string, number> = {
  free: 100, // 100 créditos una vez (no mensual)
  starter: 3500, // 3,500 créditos/mes
  pro: 10000, // 10,000 créditos/mes
  business: 30000, // 30,000 créditos/mes
  enterprise: 100000, // 100,000 créditos/mes (si existe)
}

// ============================================================================
// WORKER: Assign Monthly Credits on Subscription Renewal
// ============================================================================

export const assignMonthlyCredits = (inngest as unknown as Inngest).createFunction(
  {
    id: 'assign-monthly-credits',
    name: 'Assign Monthly Credits on Subscription Renewal',
    retries: 3,
  },
  { event: 'stripe/subscription.updated' },
  async ({ event, step }: { event: any; step: any }) => {
    const subscriptionId = event.data.object.id as string

    // Step 1: Get subscription from database
    const subscription = await step.run('get-subscription', async () => {
      const [sub] = await db
        .select({
          id: subscriptions.id,
          userId: subscriptions.userId,
          planId: subscriptions.planId,
          status: subscriptions.status,
          currentPeriodStart: subscriptions.currentPeriodStart,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
          monthlyCredits: subscriptions.monthlyCredits,
          plan: {
            tier: plans.tier,
            name: plans.name,
          },
        })
        .from(subscriptions)
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
        .limit(1)

      if (!sub) {
        logger.warn('[Monthly Credits] Subscription not found', { subscriptionId })
        return null
      }

      return sub
    })

    if (!subscription) {
      return { success: false, reason: 'Subscription not found' }
    }

    // Step 2: Check if this is a renewal (new billing period started)
    const isRenewal = await step.run('check-renewal', async () => {
      if (!subscription.currentPeriodStart || !subscription.currentPeriodEnd) {
        return false
      }

      // Check if we're at the start of a new billing period
      const now = new Date()
      const periodStart = new Date(subscription.currentPeriodStart)
      const periodEnd = new Date(subscription.currentPeriodEnd)

      // Renewal happens when we're within the first day of the new period
      const daysSincePeriodStart = Math.floor(
        (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
      )

      return daysSincePeriodStart <= 1 && now <= periodEnd
    })

    if (!isRenewal) {
      return { success: false, reason: 'Not a renewal period' }
    }

    // Step 3: Get plan tier and calculate credits to assign
    const creditsToAssign = await step.run('calculate-credits', async () => {
      const tier = subscription.plan.tier
      const monthlyCredits = PLAN_MONTHLY_CREDITS[tier] || 0

      if (monthlyCredits === 0) {
        logger.warn('[Monthly Credits] No credits for tier', { tier, subscriptionId })
        return 0
      }

      return monthlyCredits
    })

    if (creditsToAssign === 0) {
      return { success: false, reason: 'No credits to assign for this tier' }
    }

    // Step 4: Assign credits to user
    const result = await step.run('assign-credits', async () => {
      try {
        // Dynamically import addCredits function
        const creditModule = await import('@quoorum/quoorum')
        const { addCredits } = creditModule as any
        const addResult = await addCredits(
          subscription.userId,
          creditsToAssign,
          subscription.id,
          'monthly_allocation',
          `Monthly credits allocation for ${subscription.plan.name} plan`
        )

        if (!addResult.success) {
          throw new Error(addResult.error || 'Failed to add credits')
        }

        // Update subscription monthlyCredits field
        await db
          .update(subscriptions)
          .set({
            monthlyCredits: creditsToAssign,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscription.id))

        logger.info('[Monthly Credits] Credits assigned successfully', {
          userId: subscription.userId,
          subscriptionId: subscription.id,
          tier: subscription.plan.tier,
          creditsAssigned: creditsToAssign,
        })

        return {
          success: true,
          creditsAssigned: creditsToAssign,
          userId: subscription.userId,
        }
      } catch (error) {
        logger.error('[Monthly Credits] Failed to assign credits', {
          error: error instanceof Error ? error.message : String(error),
          userId: subscription.userId,
          subscriptionId: subscription.id,
          creditsToAssign,
        })
        throw error
      }
    })

    return result
  }
)

// ============================================================================
// WORKER: Daily Check for Renewals (Cron job)
// ============================================================================

export const checkMonthlyCreditsRenewals = (inngest as unknown as Inngest).createFunction(
  {
    id: 'check-monthly-credits-renewals',
    name: 'Check Monthly Credits Renewals (Daily Cron)',
    retries: 2,
  },
  { cron: '0 1 * * *' }, // Run daily at 01:00 UTC
  async ({ step }: { step: any }) => {
    // Step 1: Find all active subscriptions that need renewal
    const subscriptionsToRenew = await step.run('find-renewals', async () => {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      // Find subscriptions where currentPeriodEnd was yesterday or today (renewal period)
      // This catches subscriptions that just renewed
      const results = await db
        .select({
          id: subscriptions.id,
          userId: subscriptions.userId,
          planId: subscriptions.planId,
          stripeSubscriptionId: subscriptions.stripeSubscriptionId,
          currentPeriodStart: subscriptions.currentPeriodStart,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
          monthlyCredits: subscriptions.monthlyCredits,
          plan: {
            tier: plans.tier,
            name: plans.name,
          },
        })
        .from(subscriptions)
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .where(
          and(
            eq(subscriptions.status, 'active'),
            // Period ended yesterday or today (renewal happened)
            sql`DATE(${subscriptions.currentPeriodEnd}) >= DATE(${sql.raw(`'${yesterday.toISOString()}'`)})`,
            sql`DATE(${subscriptions.currentPeriodEnd}) <= DATE(${sql.raw(`'${today.toISOString()}'`)})`
          )
        )

      // Convert Date objects to ISO strings for serialization
      return results.map((sub) => ({
        ...sub,
        currentPeriodStart: sub.currentPeriodStart ? sub.currentPeriodStart.toISOString() : null,
        currentPeriodEnd: sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null,
      }))
    })

    if (subscriptionsToRenew.length === 0) {
      return { success: true, renewed: 0, message: 'No subscriptions to renew today' }
    }

    // Step 2: Assign credits for each subscription
    const results = await step.run('assign-all-credits', async () => {
      const results: Array<{ subscriptionId: string; success: boolean; creditsAssigned?: number; error?: string }> = []

      for (const sub of subscriptionsToRenew) {
        try {
          // Check if credits were already assigned for this period
          // Compare currentPeriodStart with the last time credits were assigned
          // If monthlyCredits was set and currentPeriodStart hasn't changed, skip
          // Note: sub.currentPeriodStart is already a string (ISO) from the query above
          const periodStart = sub.currentPeriodStart ? new Date(sub.currentPeriodStart) : null
          const now = new Date()
          const daysSincePeriodStart = periodStart
            ? Math.floor((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
            : null

          // If credits were already assigned (monthlyCredits > 0) and we're still in the same period, skip
          if (sub.monthlyCredits > 0 && daysSincePeriodStart !== null && daysSincePeriodStart > 1) {
            logger.info('[Monthly Credits] Credits already assigned for this period', {
              subscriptionId: sub.id,
              monthlyCredits: sub.monthlyCredits,
              daysSincePeriodStart,
            })
            continue
          }

          const tier = sub.plan.tier
          const creditsToAssign = PLAN_MONTHLY_CREDITS[tier] || 0

          if (creditsToAssign === 0) {
            logger.warn('[Monthly Credits] No credits for tier', { tier, subscriptionId: sub.id })
            continue
          }

          // Add credits
          const creditModule = await import('@quoorum/quoorum')
          const { addCredits } = creditModule as any
          const addResult = await addCredits(
            sub.userId,
            creditsToAssign,
            sub.id,
            'monthly_allocation',
            `Monthly credits allocation for ${sub.plan.name} plan (automatic renewal)`
          )

          if (!addResult.success) {
            logger.error('[Monthly Credits] Failed to assign credits', {
              error: addResult.error,
              userId: sub.userId,
              subscriptionId: sub.id,
            })
            results.push({ subscriptionId: sub.id, success: false, error: addResult.error })
            continue
          }

          // Update subscription
          await db
            .update(subscriptions)
            .set({
              monthlyCredits: creditsToAssign,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, sub.id))

          results.push({
            subscriptionId: sub.id,
            success: true,
            creditsAssigned: creditsToAssign,
          })

          logger.info('[Monthly Credits] Credits assigned via cron', {
            userId: sub.userId,
            subscriptionId: sub.id,
            tier,
            creditsAssigned: creditsToAssign,
          })
        } catch (error) {
          logger.error('[Monthly Credits] Error in cron assignment', {
            error: error instanceof Error ? error.message : String(error),
            userId: sub.userId,
            subscriptionId: sub.id,
          })
          results.push({
            subscriptionId: sub.id,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }

      return results
    })

    const successful = results.filter((r: any) => r.success).length
    const failed = results.filter((r: any) => !r.success).length

    return {
      success: true,
      renewed: successful,
      failed,
      total: subscriptionsToRenew.length,
      results,
    }
  }
)
