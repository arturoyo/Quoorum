/**
 * Credit Transactions - Security Tests
 *
 * Tests para verificar que las transacciones atómicas previenen race conditions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '@quoorum/db'
import { users } from '@quoorum/db/schema'
import { eq } from 'drizzle-orm'
import {
  deductCredits,
  refundCredits,
  getCreditBalance,
  hasSufficientCredits,
} from '../credit-transactions'

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

const TEST_USER_ID = crypto.randomUUID()
const INITIAL_CREDITS = 1000

async function createTestUser() {
  await db.insert(users).values({
    id: TEST_USER_ID,
    email: 'test-credits@example.com',
    name: 'Test User Credits',
    credits: INITIAL_CREDITS,
  })
}

async function cleanupTestUser() {
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
}

// ============================================================================
// TESTS
// ============================================================================

describe('Credit Transactions - Basic Operations', () => {
  beforeEach(async () => {
    await createTestUser()
  })

  afterEach(async () => {
    await cleanupTestUser()
  })

  it('should deduct credits successfully with sufficient balance', async () => {
    const result = await deductCredits(TEST_USER_ID, 100)

    expect(result.success).toBe(true)
    expect(result.remainingCredits).toBe(900)
    expect(result.error).toBeUndefined()

    const balance = await getCreditBalance(TEST_USER_ID)
    expect(balance).toBe(900)
  })

  it('should reject deduction with insufficient balance', async () => {
    const result = await deductCredits(TEST_USER_ID, 1500)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Insufficient credits')
    expect(result.remainingCredits).toBeUndefined()

    // Balance should remain unchanged
    const balance = await getCreditBalance(TEST_USER_ID)
    expect(balance).toBe(INITIAL_CREDITS)
  })

  it('should reject deduction of zero or negative credits', async () => {
    const result1 = await deductCredits(TEST_USER_ID, 0)
    expect(result1.success).toBe(false)
    expect(result1.error).toBe('Invalid credit amount')

    const result2 = await deductCredits(TEST_USER_ID, -50)
    expect(result2.success).toBe(false)
    expect(result2.error).toBe('Invalid credit amount')
  })

  it('should refund credits successfully', async () => {
    // First deduct
    await deductCredits(TEST_USER_ID, 200)

    // Then refund
    const result = await refundCredits(TEST_USER_ID, 50, 'test-debate-123', 'refund', 'Test refund')

    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(850) // 1000 - 200 + 50

    const balance = await getCreditBalance(TEST_USER_ID)
    expect(balance).toBe(850)
  })

  it('should check sufficient credits correctly', async () => {
    const hasSufficient1 = await hasSufficientCredits(TEST_USER_ID, 500)
    expect(hasSufficient1).toBe(true)

    const hasSufficient2 = await hasSufficientCredits(TEST_USER_ID, 1500)
    expect(hasSufficient2).toBe(false)

    const hasSufficient3 = await hasSufficientCredits(TEST_USER_ID, 1000)
    expect(hasSufficient3).toBe(true) // Exact balance
  })

  it('should get credit balance correctly', async () => {
    const balance1 = await getCreditBalance(TEST_USER_ID)
    expect(balance1).toBe(INITIAL_CREDITS)

    await deductCredits(TEST_USER_ID, 300)

    const balance2 = await getCreditBalance(TEST_USER_ID)
    expect(balance2).toBe(700)
  })

  it('should return null for non-existent user', async () => {
    const balance = await getCreditBalance('non-existent-user-id')
    expect(balance).toBeNull()
  })
})

describe('Credit Transactions - Atomic Operations (Race Conditions)', () => {
  beforeEach(async () => {
    await createTestUser()
  })

  afterEach(async () => {
    await cleanupTestUser()
  })

  it('should prevent race condition with concurrent deductions', async () => {
    // Attempt two simultaneous deductions that together exceed balance
    // User has 1000 credits, we try to deduct 600 + 600 = 1200 simultaneously
    const [result1, result2] = await Promise.all([
      deductCredits(TEST_USER_ID, 600),
      deductCredits(TEST_USER_ID, 600),
    ])

    // One should succeed, one should fail
    const successes = [result1, result2].filter((r) => r.success)
    const failures = [result1, result2].filter((r) => !r.success)

    expect(successes).toHaveLength(1)
    expect(failures).toHaveLength(1)

    // Final balance should be 400 (1000 - 600)
    const finalBalance = await getCreditBalance(TEST_USER_ID)
    expect(finalBalance).toBe(400)
  })

  it('should handle multiple small concurrent deductions correctly', async () => {
    // 5 concurrent deductions of 150 credits each (total 750)
    // User has 1000, so all should succeed
    const results = await Promise.all([
      deductCredits(TEST_USER_ID, 150),
      deductCredits(TEST_USER_ID, 150),
      deductCredits(TEST_USER_ID, 150),
      deductCredits(TEST_USER_ID, 150),
      deductCredits(TEST_USER_ID, 150),
    ])

    const successes = results.filter((r) => r.success)
    expect(successes.length).toBeGreaterThan(0)

    // Final balance should be INITIAL_CREDITS - (number of successes * 150)
    const finalBalance = await getCreditBalance(TEST_USER_ID)
    const expectedBalance = INITIAL_CREDITS - successes.length * 150

    expect(finalBalance).toBe(expectedBalance)
    expect(finalBalance).toBeGreaterThanOrEqual(0) // Never negative
  })

  it('should handle concurrent deduction and refund correctly', async () => {
    // Deduct 500 first
    await deductCredits(TEST_USER_ID, 500)

    // Now balance is 500
    // Attempt concurrent deduction of 400 and refund of 200
    const [deductResult, refundResult] = await Promise.all([
      deductCredits(TEST_USER_ID, 400),
      refundCredits(TEST_USER_ID, 200, 'test-debate', 'refund', 'Test refund'),
    ])

    expect(deductResult.success).toBe(true)
    expect(refundResult.success).toBe(true)

    // Final balance should be 500 - 400 + 200 = 300 OR 500 + 200 - 400 = 300
    const finalBalance = await getCreditBalance(TEST_USER_ID)
    expect(finalBalance).toBe(300)
  })
})

describe('Credit Transactions - Edge Cases', () => {
  beforeEach(async () => {
    await createTestUser()
  })

  afterEach(async () => {
    await cleanupTestUser()
  })

  it('should handle exact balance deduction', async () => {
    const result = await deductCredits(TEST_USER_ID, INITIAL_CREDITS)

    expect(result.success).toBe(true)
    expect(result.remainingCredits).toBe(0)

    const balance = await getCreditBalance(TEST_USER_ID)
    expect(balance).toBe(0)
  })

  it('should reject deduction when balance is zero', async () => {
    // Deduct all credits
    await deductCredits(TEST_USER_ID, INITIAL_CREDITS)

    // Try to deduct more
    const result = await deductCredits(TEST_USER_ID, 1)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Insufficient credits')
  })

  it('should allow refund when balance is zero', async () => {
    // Deduct all credits
    await deductCredits(TEST_USER_ID, INITIAL_CREDITS)

    // Refund some
    const result = await refundCredits(TEST_USER_ID, 100, 'test-debate', 'refund', 'Refund to zero balance')

    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(100)
  })
})
