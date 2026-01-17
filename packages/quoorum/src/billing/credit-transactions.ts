/**
 * Credit Transactions - Atomic Operations
 *
 * Previene race conditions en deducción de créditos usando PostgreSQL atomic operations
 */

import { db } from '@wallie/db'
import { users } from '@wallie/db/schema'
import { eq, and, gte, sql } from 'drizzle-orm'
import { quoorumLogger } from '../utils/logger'

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
 *
 * @example
 * const result = await deductCredits('user-123', 35)
 * if (!result.success) {
 *   throw new Error(result.error) // 'Insufficient credits'
 * }
 */
export async function deductCredits(
  userId: string,
  amount: number
): Promise<CreditDeductionResult> {
  if (amount <= 0) {
    return { success: false, error: 'Invalid credit amount' }
  }

  quoorumLogger.info('Attempting credit deduction', {
    userId,
    amount,
    timestamp: new Date().toISOString(),
  })

  try {
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
      quoorumLogger.warn('Credit deduction failed - insufficient balance', {
        userId,
        requestedAmount: amount,
      })
      return { success: false, error: 'Insufficient credits' }
    }

    const remainingCredits = result[0]!.credits

    quoorumLogger.info('Credit deduction successful', {
      userId,
      deducted: amount,
      remainingCredits,
    })

    return { success: true, remainingCredits }
  } catch (error) {
    quoorumLogger.error('Credit deduction error', {
      userId,
      amount,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return { success: false, error: 'Database error during credit deduction' }
  }
}

/**
 * Refund credits to user (e.g., when debate fails mid-execution)
 *
 * Adds credits back atomically
 *
 * @example
 * await refundCredits('user-123', 35, 'debate-456', 'Debate failed at round 3')
 */
export async function refundCredits(
  userId: string,
  amount: number,
  debateId?: string,
  reason?: string
): Promise<CreditRefundResult> {
  if (amount <= 0) {
    return { success: false, error: 'Invalid refund amount' }
  }

  quoorumLogger.info('Refunding credits', {
    userId,
    amount,
    debateId,
    reason,
    timestamp: new Date().toISOString(),
  })

  try {
    const result = await db
      .update(users)
      .set({
        credits: sql`${users.credits} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ credits: users.credits })

    if (result.length === 0) {
      quoorumLogger.error('Refund failed - user not found', { userId })
      return { success: false, error: 'User not found' }
    }

    const newBalance = result[0]!.credits

    quoorumLogger.info('Credits refunded successfully', {
      userId,
      refunded: amount,
      newBalance,
      debateId,
    })

    return { success: true, newBalance }
  } catch (error) {
    quoorumLogger.error('Credit refund error', {
      userId,
      amount,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
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
    quoorumLogger.error('Error fetching credit balance', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
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
