/**
 * Credit Transactions - Atomic Operations
 *
 * Previene race conditions en deducción de créditos usando PostgreSQL atomic operations
 */

import { db } from '@quoorum/db'
import { users, creditTransactions } from '@quoorum/db/schema'
import { eq, and, gte, sql } from 'drizzle-orm'
import { quoorumLogger } from '../logger'

export interface CreditDeductionResult {
  success: boolean
  remainingCredits?: number
  error?: string
}

export interface CreditRefundResult {
  success: boolean
  newBalance?: number
  error?: string
}

/**
 * Deduce credits from user balance atomically
 *
 * Uses PostgreSQL UPDATE with WHERE clause to prevent overdraft
 * Returns error if insufficient balance
 * Records transaction in credit_transactions table
 *
 * @example
 * const result = await deductCredits('user-123', 35, 'debate-456', 'debate_creation', 'Debate creation')
 * if (!result.success) {
 *   throw new Error(result.error) // 'Insufficient credits'
 * }
 */
export async function deductCredits(
  userId: string,
  amount: number,
  debateId?: string,
  source: 'debate_creation' | 'debate_execution' | 'debate_failed' | 'debate_cancelled' | 'admin_adjustment' = 'debate_execution',
  reason?: string
): Promise<CreditDeductionResult> {
  if (amount <= 0) {
    return { success: false, error: 'Invalid credit amount' }
  }

  quoorumLogger.info('Attempting credit deduction', {
    userId,
    amount,
    debateId,
    source,
    timestamp: new Date().toISOString(),
  })

  try {
    // Get current balance first (for transaction record)
    const [currentUser] = await db
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!currentUser) {
      return { success: false, error: 'User not found' }
    }

    const balanceBefore = currentUser.credits

    if (balanceBefore < amount) {
      quoorumLogger.warn('Credit deduction failed - insufficient balance', {
        userId,
        requestedAmount: amount,
        currentBalance: balanceBefore,
      })
      return { success: false, error: 'Insufficient credits' }
    }

    // Atomic UPDATE: only succeeds if credits >= amount
    const result = await db
      .update(users)
      .set({
        credits: sql`${users.credits} - ${amount}`,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId), gte(users.credits, amount)))
      .returning({ credits: users.credits })

    if (result.length === 0) {
      quoorumLogger.warn('Credit deduction failed - race condition or insufficient balance', {
        userId,
        requestedAmount: amount,
        balanceBefore,
      })
      return { success: false, error: 'Insufficient credits' }
    }

    const balanceAfter = result[0]!.credits

    // Record transaction
    await db.insert(creditTransactions).values({
      userId,
      debateId: debateId || null,
      type: 'deduction',
      source,
      amount,
      balanceBefore,
      balanceAfter,
      reason: reason || `Credit deduction for ${source}`,
    })

    quoorumLogger.info('Credit deduction successful', {
      userId,
      deducted: amount,
      balanceBefore,
      balanceAfter,
      debateId,
    })

    return { success: true, remainingCredits: balanceAfter }
  } catch (error) {
    quoorumLogger.error(
      'Credit deduction error',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        userId,
        amount,
        debateId,
      }
    )
    return { success: false, error: 'Database error during credit deduction' }
  }
}

/**
 * Refund credits to user (e.g., when debate fails mid-execution)
 *
 * Adds credits back atomically
 * Records transaction in credit_transactions table
 *
 * @example
 * await refundCredits('user-123', 35, 'debate-456', 'debate_failed', 'Debate failed at round 3')
 */
export async function refundCredits(
  userId: string,
  amount: number,
  debateId?: string,
  source: 'debate_failed' | 'debate_cancelled' | 'refund' | 'admin_adjustment' = 'refund',
  reason?: string
): Promise<CreditRefundResult> {
  if (amount <= 0) {
    return { success: false, error: 'Invalid refund amount' }
  }

  quoorumLogger.info('Refunding credits', {
    userId,
    amount,
    debateId,
    source,
    reason,
    timestamp: new Date().toISOString(),
  })

  try {
    // Get current balance first (for transaction record)
    const [currentUser] = await db
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!currentUser) {
      quoorumLogger.error('Refund failed - user not found', new Error('User not found'), { userId })
      return { success: false, error: 'User not found' }
    }

    const balanceBefore = currentUser.credits

    const result = await db
      .update(users)
      .set({
        credits: sql`${users.credits} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ credits: users.credits })

    if (result.length === 0) {
      quoorumLogger.error('Refund failed - user not found after update', new Error('User not found'), { userId })
      return { success: false, error: 'User not found' }
    }

    const balanceAfter = result[0]!.credits

    // Record transaction
    await db.insert(creditTransactions).values({
      userId,
      debateId: debateId || null,
      type: 'refund',
      source,
      amount,
      balanceBefore,
      balanceAfter,
      reason: reason || `Credit refund for ${source}`,
    })

    quoorumLogger.info('Credits refunded successfully', {
      userId,
      refunded: amount,
      balanceBefore,
      balanceAfter,
      debateId,
    })

    return { success: true, newBalance: balanceAfter }
  } catch (error) {
    quoorumLogger.error(
      'Credit refund error',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        userId,
        amount,
        debateId,
      }
    )
    return { success: false, error: 'Database error during refund' }
  }
}

/**
 * Get current credit balance (non-atomic read)
 */
export async function getCreditBalance(userId: string): Promise<number | null> {
  try {
    const result = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId))

    if (result.length === 0) {
      return null
    }

    return result[0]!.credits
  } catch (error) {
    quoorumLogger.error(
      'Error fetching credit balance',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        userId,
      }
    )
    return null
  }
}

/**
 * Add credits to user balance (e.g., monthly allocation, purchase)
 *
 * Adds credits atomically
 *
 * @example
 * await addCredits('user-123', 3500, 'sub-456', 'Monthly credits allocation for Starter plan')
 */
export interface CreditAddResult {
  success: boolean
  newBalance?: number
  error?: string
}

export async function addCredits(
  userId: string,
  amount: number,
  subscriptionId?: string,
  source: 'monthly_allocation' | 'purchase' | 'admin_adjustment' | 'daily_reset' = 'admin_adjustment',
  reason?: string
): Promise<CreditAddResult> {
  if (amount <= 0) {
    return { success: false, error: 'Invalid credit amount' }
  }

  quoorumLogger.info('Adding credits', {
    userId,
    amount,
    subscriptionId,
    source,
    reason,
    timestamp: new Date().toISOString(),
  })

  try {
    // Get current balance first (for transaction record)
    const [currentUser] = await db
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!currentUser) {
      quoorumLogger.error('Add credits failed - user not found', new Error('User not found'), { userId })
      return { success: false, error: 'User not found' }
    }

    const balanceBefore = currentUser.credits

    const result = await db
      .update(users)
      .set({
        credits: sql`${users.credits} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ credits: users.credits })

    if (result.length === 0) {
      quoorumLogger.error('Add credits failed - user not found after update', new Error('User not found'), { userId })
      return { success: false, error: 'User not found' }
    }

    const balanceAfter = result[0]!.credits

    // Record transaction
    await db.insert(creditTransactions).values({
      userId,
      debateId: null,
      type: 'addition',
      source,
      amount,
      balanceBefore,
      balanceAfter,
      reason: reason || `Credit addition for ${source}`,
      metadata: subscriptionId ? { subscriptionId } : undefined,
    })

    quoorumLogger.info('Credits added successfully', {
      userId,
      added: amount,
      balanceBefore,
      balanceAfter,
      subscriptionId,
    })

    return { success: true, newBalance: balanceAfter }
  } catch (error) {
    quoorumLogger.error(
      'Credit add error',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        userId,
        amount,
      }
    )
    return { success: false, error: 'Database error during credit addition' }
  }
}

/**
 * Check if user has sufficient credits (pre-flight check)
 *
 * @returns true if user has enough credits, false otherwise
 */
export async function hasSufficientCredits(userId: string, required: number): Promise<boolean> {
  const balance = await getCreditBalance(userId)
  if (balance === null) return false
  return balance >= required
}

// Re-export convertUsdToCredits from analytics/cost for convenience
export { convertUsdToCredits, CREDIT_MULTIPLIER, USD_PER_CREDIT } from '../analytics/cost'
