/**
 * Monthly Credits Limit Verification
 * 
 * Verifica que el usuario no haya excedido su límite mensual de créditos
 * basado en su plan de suscripción.
 */

import { db } from '@quoorum/db'
import { subscriptions, plans, usage } from '@quoorum/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { logger } from './logger'

// ============================================================================
// PLAN CREDIT LIMITS (Fuente de verdad: subscription-management-modal.tsx)
// ============================================================================

export const PLAN_MONTHLY_CREDIT_LIMITS: Record<string, number> = {
  free: 100, // 100 créditos una vez (no mensual, pero límite total)
  starter: 3500, // 3,500 créditos/mes
  pro: 10000, // 10,000 créditos/mes
  business: 30000, // 30,000 créditos/mes
  enterprise: 100000, // 100,000 créditos/mes (si existe)
}

// ============================================================================
// HELPER: Get User's Monthly Credit Limit
// ============================================================================

export async function getUserMonthlyCreditLimit(userId: string): Promise<number> {
  try {
    // Get user's active subscription
    const [subscription] = await db
      .select({
        tier: plans.tier,
        monthlyCredits: subscriptions.monthlyCredits,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        )
      )
      .orderBy(sql`${subscriptions.createdAt} DESC`)
      .limit(1)

    if (!subscription) {
      // No active subscription = free tier
      return PLAN_MONTHLY_CREDIT_LIMITS.free
    }

    // Use monthlyCredits from subscription if set, otherwise use tier default
    const tier = subscription.tier || 'free'
    const tierLimit = PLAN_MONTHLY_CREDIT_LIMITS[tier] ?? PLAN_MONTHLY_CREDIT_LIMITS.free
    const monthlyCredits = subscription.monthlyCredits ?? 0
    return monthlyCredits > 0
      ? monthlyCredits
      : tierLimit
  } catch (error) {
    logger.error('Failed to get monthly credit limit', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    })
    // Fallback to free tier limit
    return PLAN_MONTHLY_CREDIT_LIMITS.free
  }
}

// ============================================================================
// HELPER: Get User's Monthly Credits Used (Current Period)
// ============================================================================

export async function getUserMonthlyCreditsUsed(userId: string): Promise<number> {
  try {
    // Get current billing period
    const [subscription] = await db
      .select({
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        )
      )
      .orderBy(sql`${subscriptions.createdAt} DESC`)
      .limit(1)

    if (!subscription || !subscription.currentPeriodStart || !subscription.currentPeriodEnd) {
      // No active subscription = use current month
      const now = new Date()
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      const [usageRecord] = await db
        .select({
          creditsDeducted: usage.creditsDeducted,
        })
        .from(usage)
        .where(
          and(
            eq(usage.userId, userId),
            gte(usage.periodStart, periodStart),
            lte(usage.periodEnd, periodEnd)
          )
        )
        .limit(1)

      return usageRecord?.creditsDeducted || 0
    }

    // Get usage for current billing period
    const [usageRecord] = await db
      .select({
        creditsDeducted: usage.creditsDeducted,
      })
      .from(usage)
      .where(
        and(
          eq(usage.userId, userId),
          gte(usage.periodStart, subscription.currentPeriodStart),
          lte(usage.periodEnd, subscription.currentPeriodEnd)
        )
      )
      .limit(1)

    return usageRecord?.creditsDeducted || 0
  } catch (error) {
    logger.error('Failed to get monthly credits used', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    })
    return 0
  }
}

// ============================================================================
// HELPER: Check if User Can Use Credits (Monthly Limit Check)
// ============================================================================

export interface MonthlyCreditCheckResult {
  allowed: boolean
  limit: number
  used: number
  remaining: number
  reason?: string
}

export async function checkMonthlyCreditLimit(
  userId: string,
  requestedCredits: number
): Promise<MonthlyCreditCheckResult> {
  try {
    const limit = await getUserMonthlyCreditLimit(userId)
    const used = await getUserMonthlyCreditsUsed(userId)
    const remaining = Math.max(0, limit - used)
    const wouldExceed = used + requestedCredits > limit

    if (wouldExceed) {
      return {
        allowed: false,
        limit,
        used,
        remaining,
        reason: `Monthly credit limit exceeded. Limit: ${limit.toLocaleString()}, Used: ${used.toLocaleString()}, Requested: ${requestedCredits.toLocaleString()}`,
      }
    }

    return {
      allowed: true,
      limit,
      used,
      remaining: remaining - requestedCredits,
    }
  } catch (error) {
    logger.error('Failed to check monthly credit limit', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      requestedCredits,
    })

    // On error, allow the request (fail open) but log the error
    return {
      allowed: true,
      limit: 0,
      used: 0,
      remaining: 0,
      reason: 'Error checking monthly limit, allowing request',
    }
  }
}

// ============================================================================
// HELPER: Update Usage Record (Track Monthly Credits Used)
// ============================================================================

export async function updateMonthlyUsage(
  userId: string,
  creditsUsed: number,
  costUsd: number,
  tokensUsed?: number
): Promise<void> {
  try {
    // Get current billing period
    const [subscription] = await db
      .select({
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        )
      )
      .orderBy(sql`${subscriptions.createdAt} DESC`)
      .limit(1)

    let periodStart: Date
    let periodEnd: Date

    if (subscription?.currentPeriodStart && subscription?.currentPeriodEnd) {
      periodStart = subscription.currentPeriodStart
      periodEnd = subscription.currentPeriodEnd
    } else {
      // No active subscription = use current month
      const now = new Date()
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    // Get or create usage record for this period
    const [existingUsage] = await db
      .select()
      .from(usage)
      .where(
        and(
          eq(usage.userId, userId),
          gte(usage.periodStart, periodStart),
          lte(usage.periodEnd, periodEnd)
        )
      )
      .limit(1)

    if (existingUsage) {
      // Update existing usage record
      await db
        .update(usage)
        .set({
          creditsDeducted: sql`${usage.creditsDeducted} + ${creditsUsed}`,
          totalCostUsd: sql`${usage.totalCostUsd} + ${Math.round(costUsd * 100)}`, // Convert to cents
          tokensUsed: tokensUsed
            ? sql`${usage.tokensUsed} + ${tokensUsed}`
            : usage.tokensUsed,
          debatesUsed: sql`${usage.debatesUsed} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(usage.id, existingUsage.id))
    } else {
      // Create new usage record
      await db.insert(usage).values({
        userId,
        periodStart,
        periodEnd,
        creditsDeducted: creditsUsed,
        totalCostUsd: Math.round(costUsd * 100), // Convert to cents
        tokensUsed: tokensUsed || 0,
        debatesUsed: 1,
      })
    }

    logger.debug('Monthly usage updated', {
      userId,
      creditsUsed,
      costUsd,
      periodStart,
      periodEnd,
    })
  } catch (error) {
    logger.error('Failed to update monthly usage', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      creditsUsed,
    })
    // Don't throw - usage tracking is not critical for debate execution
  }
}
