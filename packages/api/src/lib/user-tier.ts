/**
 * User Tier Helper
 * 
 * Obtiene el tier del usuario desde su suscripción activa
 */

import { db } from '@quoorum/db'
import { subscriptions, plans } from '@quoorum/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { logger } from './logger'

/**
 * Get user's subscription tier
 * @param userId - User ID (profile.id)
 * @returns Tier string ('free', 'starter', 'pro', 'business', 'enterprise') or 'free' as default
 */
export async function getUserTier(userId: string): Promise<'free' | 'starter' | 'pro' | 'business' | 'enterprise'> {
  try {
    const [subscription] = await db
      .select({
        tier: plans.tier,
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
      return 'free'
    }

    const tier = subscription.tier
    if (tier === 'free' || tier === 'starter' || tier === 'pro' || tier === 'business' || tier === 'enterprise') {
      return tier
    }

    return 'free'
  } catch (error) {
    logger.error('Failed to get user tier', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    })
    return 'free'
  }
}
