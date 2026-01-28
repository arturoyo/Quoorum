/**
 * Team Credits Helpers
 * Manages shared credit pool for team plans
 */

import { db } from '@quoorum/db'
import { users, subscriptions } from '@quoorum/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { getUserTeamOwnerId } from './team-helpers'

/**
 * Get team owner's subscription credits (shared pool)
 * Returns the monthly credits allocated to the team plan
 */
export async function getTeamCreditsPool(teamOwnerId: string): Promise<number> {
  // Get team owner's subscription
  const [subscription] = await db
    .select({ monthlyCredits: subscriptions.monthlyCredits })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, teamOwnerId),
        eq(subscriptions.status, 'active')
      )
    )
    .limit(1)

  return subscription?.monthlyCredits || 0
}

/**
 * Check if user has team plan and get team owner ID
 * Returns teamOwnerId if user is in a team, null otherwise
 */
export async function getUserTeamPlan(userId: string): Promise<{
  teamOwnerId: string
  creditsPool: number
} | null> {
  const teamOwnerId = await getUserTeamOwnerId(userId)
  if (!teamOwnerId) {
    return null
  }

  const creditsPool = await getTeamCreditsPool(teamOwnerId)
  return { teamOwnerId, creditsPool }
}

/**
 * Consume credits from team pool
 * Deducts credits from team owner's subscription pool
 * Returns true if successful, false if insufficient credits
 */
export async function consumeTeamCredits(
  teamOwnerId: string,
  credits: number
): Promise<boolean> {
  // Get current subscription
  const [subscription] = await db
    .select({ id: subscriptions.id, monthlyCredits: subscriptions.monthlyCredits })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, teamOwnerId),
        eq(subscriptions.status, 'active')
      )
    )
    .limit(1)

  if (!subscription) {
    return false
  }

  // Check if enough credits available
  if (subscription.monthlyCredits < credits) {
    return false
  }

  // Deduct credits from subscription pool
  await db
    .update(subscriptions)
    .set({
      monthlyCredits: sql`${subscriptions.monthlyCredits} - ${credits}`,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscription.id))

  return true
}

/**
 * Get available credits for a user
 * Returns individual credits if not in team, or team pool credits if in team
 */
export async function getAvailableCredits(userId: string): Promise<number> {
  // Check if user is in a team
  const teamPlan = await getUserTeamPlan(userId)
  if (teamPlan) {
    return teamPlan.creditsPool
  }

  // Individual user credits
  const [user] = await db
    .select({ credits: users.credits })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return user?.credits || 0
}

/**
 * Consume credits (team or individual)
 * Automatically detects if user is in team and uses appropriate pool
 */
export async function consumeCredits(
  userId: string,
  credits: number
): Promise<boolean> {
  // Check if user is in a team
  const teamPlan = await getUserTeamPlan(userId)
  if (teamPlan) {
    return await consumeTeamCredits(teamPlan.teamOwnerId, credits)
  }

  // Individual user credits
  const [user] = await db
    .select({ id: users.id, credits: users.credits })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user || user.credits < credits) {
    return false
  }

  // Deduct from user's individual credits
  await db
    .update(users)
    .set({
      credits: sql`${users.credits} - ${credits}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  return true
}
