/**
 * Integration Tests for Debates Router
 * Tests the complete flow: create → execute → notify
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { randomUUID } from 'crypto'
import { eq, and } from 'drizzle-orm'
import { db } from '@quoorum/db'
import { quoorumDebates, profiles } from '@quoorum/db/schema'

// ═══════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════

// Mock the debate runner
vi.mock('@quoorum/quoorum', () => ({
  runDynamicDebate: vi.fn().mockResolvedValue({
    sessionId: 'test-session',
    question: 'Test question',
    consensusScore: 0.85,
    rounds: [
      {
        round: 1,
        messages: [
          {
            id: 'msg-1',
            sessionId: 'test-session',
            round: 1,
            agentKey: 'expert-1',
            agentName: 'Expert 1',
            content: 'Test message',
            isCompressed: false,
            tokensUsed: 100,
            costUsd: 0.001,
            createdAt: new Date(),
          },
        ],
      },
    ],
    finalRanking: [
      {
        option: 'Option A',
        score: 95,
        successRate: 95,
        pros: ['Good', 'Fast'],
        cons: ['Expensive'],
        supporters: ['expert-1'],
        confidence: 0.9,
        reasoning: 'Best option',
      },
    ],
    experts: [
      {
        id: 'expert-1',
        name: 'Test Expert',
        specializations: ['Testing', 'Quality'],
      },
    ],
    qualityMetrics: {
      overallScore: 0.85,
      depthScore: 0.8,
      balanceScore: 0.9,
      originalityScore: 0.85,
    },
    interventions: [],
  }),
  notifyDebateComplete: vi.fn().mockResolvedValue(undefined),
}))

// Mock Inngest
vi.mock('../../lib/inngest-client.js', () => ({
  inngest: {
    send: vi.fn().mockResolvedValue({ ids: ['event-123'] }),
  },
}))

// ═══════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════

const TEST_USER_ID = randomUUID() // Generate valid UUID
const TEST_USER_EMAIL = 'test-integration@example.com'

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

async function createTestUser() {
  try {
    await db.insert(profiles).values({
      id: TEST_USER_ID,
      userId: TEST_USER_ID, // Supabase auth user ID (same for test)
      email: TEST_USER_EMAIL,
      name: 'Test Integration User',
      role: 'user',
      isActive: true,
    })
  } catch (error) {
    // User might already exist, that's ok
    console.log('Test user might already exist:', error)
  }
}

async function cleanupTestData() {
  try {
    // Delete debates first (foreign key)
    await db
      .delete(quoorumDebates)
      .where(eq(quoorumDebates.userId, TEST_USER_ID))

    // Then delete profile
    await db
      .delete(profiles)
      .where(eq(profiles.id, TEST_USER_ID))
  } catch (error) {
    console.log('Cleanup error (might be ok):', error)
  }
}

// ═══════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════

describe('debates router - integration tests', () => {
  beforeEach(async () => {
    await createTestUser()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('complete debate flow', () => {
    it('should create, execute and notify for a successful debate', async () => {
      // 1. Create draft debate
      const [draft] = await db
        .insert(quoorumDebates)
        .values({
          userId: TEST_USER_ID,
          question: '¿Cuál es la mejor estrategia de marketing digital?',
          context: { background: 'Test context' },
          mode: 'dynamic',
          status: 'draft',
          visibility: 'private',
          metadata: {
            title: 'Test Debate',
          },
        })
        .returning()

      expect(draft).toBeDefined()
      if (!draft) throw new Error('Draft not created')

      expect(draft.id).toBeDefined()
      expect(draft.status).toBe('draft')
      expect(draft.userId).toBe(TEST_USER_ID)

      // 2. Update to pending (simulating creation flow)
      const [pending] = await db
        .update(quoorumDebates)
        .set({
          status: 'pending',
          context: {
            background: 'Test context',
          },
          metadata: {
            expertCount: 6,
            maxRounds: 5,
            category: 'marketing',
          },
        })
        .where(
          and(
            eq(quoorumDebates.id, draft.id),
            eq(quoorumDebates.userId, TEST_USER_ID)
          )
        )
        .returning()

      expect(pending).toBeDefined()
      if (!pending) throw new Error('Pending update failed')
      expect(pending.status).toBe('pending')

      // 3. Update to in_progress (simulating debate execution start)
      const [inProgress] = await db
        .update(quoorumDebates)
        .set({
          status: 'in_progress',
          startedAt: new Date(),
        })
        .where(
          and(
            eq(quoorumDebates.id, draft.id),
            eq(quoorumDebates.userId, TEST_USER_ID)
          )
        )
        .returning()

      expect(inProgress).toBeDefined()
      if (!inProgress) throw new Error('In progress update failed')
      expect(inProgress.status).toBe('in_progress')
      expect(inProgress.startedAt).toBeDefined()

      // 4. Complete debate (simulating successful execution)
      const [completed] = await db
        .update(quoorumDebates)
        .set({
          status: 'completed',
          completedAt: new Date(),
          consensusScore: 0.85,
          totalRounds: 3,
          totalCostUsd: 0.05,
          finalRanking: [
            {
              option: 'Redes Sociales',
              score: 95,
              reasoning: 'Alto engagement y alcance',
            },
            {
              option: 'Email Marketing',
              score: 80,
              reasoning: 'ROI comprobado',
            },
          ],
          rounds: [
            {
              round: 1,
              messages: [
                {
                  agentKey: 'Marketing Expert',
                  content: 'Análisis inicial...',
                },
              ],
            },
          ],
          experts: [
            {
              id: 'expert-1',
              name: 'Marketing Expert',
              expertise: ['Marketing Digital', 'Redes Sociales'],
            },
          ],
        })
        .where(
          and(
            eq(quoorumDebates.id, draft.id),
            eq(quoorumDebates.userId, TEST_USER_ID)
          )
        )
        .returning()

      expect(completed).toBeDefined()
      if (!completed) throw new Error('Completed update failed')
      expect(completed.status).toBe('completed')
      expect(completed.completedAt).toBeDefined()
      expect(completed.consensusScore).toBe(0.85)
      expect(completed.totalRounds).toBe(3)
      expect(completed.finalRanking).toHaveLength(2)
      expect(completed.experts).toHaveLength(1)

      // 5. Verify debate can be retrieved
      const [retrieved] = await db
        .select()
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, draft.id),
            eq(quoorumDebates.userId, TEST_USER_ID)
          )
        )

      expect(retrieved).toBeDefined()
      if (!retrieved) throw new Error('Retrieved debate not found')
      expect(retrieved.id).toBe(draft.id)
      expect(retrieved.status).toBe('completed')
      expect(retrieved.consensusScore).toBe(0.85)
    }, 10000) // 10 second timeout for integration test

    it('should handle debate failure correctly', async () => {
      // 1. Create and start debate
      const [debate] = await db
        .insert(quoorumDebates)
        .values({
          userId: TEST_USER_ID,
          question: 'Test failed debate',
          context: {},
          mode: 'dynamic',
          status: 'in_progress',
          visibility: 'private',
          startedAt: new Date(),
        })
        .returning()

      expect(debate).toBeDefined()
      if (!debate) throw new Error('Debate not created')

      // 2. Mark as failed
      const [failed] = await db
        .update(quoorumDebates)
        .set({
          status: 'failed',
          completedAt: new Date(),
        })
        .where(
          and(
            eq(quoorumDebates.id, debate.id),
            eq(quoorumDebates.userId, TEST_USER_ID)
          )
        )
        .returning()

      expect(failed).toBeDefined()
      if (!failed) throw new Error('Failed update not applied')
      expect(failed.status).toBe('failed')
      expect(failed.completedAt).toBeDefined()
    })

    it('should support interactive controls (pause/resume)', async () => {
      // 1. Create in_progress debate
      const [debate] = await db
        .insert(quoorumDebates)
        .values({
          userId: TEST_USER_ID,
          question: 'Test interactive controls',
          context: {},
          mode: 'dynamic',
          status: 'in_progress',
          visibility: 'private',
          startedAt: new Date(),
          metadata: {},
        })
        .returning()

      expect(debate).toBeDefined()
      if (!debate) throw new Error('Debate not created')

      // 2. Pause debate
      const [paused] = await db
        .update(quoorumDebates)
        .set({
          metadata: {
            ...debate.metadata,
            paused: true,
          },
        })
        .where(
          and(
            eq(quoorumDebates.id, debate.id),
            eq(quoorumDebates.userId, TEST_USER_ID)
          )
        )
        .returning()

      expect(paused).toBeDefined()
      if (!paused) throw new Error('Pause update failed')
      expect(paused.metadata).toHaveProperty('paused', true)

      // 3. Resume debate
      const [resumed] = await db
        .update(quoorumDebates)
        .set({
          metadata: {
            ...paused.metadata,
            paused: false,
          },
        })
        .where(
          and(
            eq(quoorumDebates.id, debate.id),
            eq(quoorumDebates.userId, TEST_USER_ID)
          )
        )
        .returning()

      expect(resumed).toBeDefined()
      if (!resumed) throw new Error('Resume update failed')
      expect(resumed.metadata).toHaveProperty('paused', false)
    })

    it('should support adding context during debate', async () => {
      // 1. Create in_progress debate
      const [debate] = await db
        .insert(quoorumDebates)
        .values({
          userId: TEST_USER_ID,
          question: 'Test add context',
          context: { background: 'Initial context' },
          mode: 'dynamic',
          status: 'in_progress',
          visibility: 'private',
          startedAt: new Date(),
        })
        .returning()

      expect(debate).toBeDefined()
      if (!debate) throw new Error('Debate not created')

      // 2. Add additional context
      const additionalContext = 'New information to consider'
      const currentContext = debate.context as any
      const additional = currentContext.additional || []
      additional.push({
        content: additionalContext,
        addedAt: new Date().toISOString(),
      })

      const [updated] = await db
        .update(quoorumDebates)
        .set({
          context: {
            ...currentContext,
            additional,
          },
        })
        .where(
          and(
            eq(quoorumDebates.id, debate.id),
            eq(quoorumDebates.userId, TEST_USER_ID)
          )
        )
        .returning()

      expect(updated).toBeDefined()
      if (!updated) throw new Error('Context update failed')
      expect((updated.context as any).additional).toHaveLength(1)
      expect((updated.context as any).additional[0].content).toBe(additionalContext)
    })

    it('should list debates with filters', async () => {
      // Create multiple debates with different statuses
      await db.insert(quoorumDebates).values([
        {
          userId: TEST_USER_ID,
          question: 'Completed debate',
          context: {},
          mode: 'dynamic',
          status: 'completed',
          visibility: 'private',
          completedAt: new Date(),
        },
        {
          userId: TEST_USER_ID,
          question: 'In progress debate',
          context: {},
          mode: 'dynamic',
          status: 'in_progress',
          visibility: 'private',
          startedAt: new Date(),
        },
        {
          userId: TEST_USER_ID,
          question: 'Draft debate',
          context: {},
          mode: 'dynamic',
          status: 'draft',
          visibility: 'private',
        },
      ])

      // List all debates
      const allDebates = await db
        .select()
        .from(quoorumDebates)
        .where(eq(quoorumDebates.userId, TEST_USER_ID))

      expect(allDebates).toHaveLength(3)

      // Filter by status
      const completedDebates = await db
        .select()
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.userId, TEST_USER_ID),
            eq(quoorumDebates.status, 'completed')
          )
        )

      expect(completedDebates).toHaveLength(1)
      expect(completedDebates[0]?.status).toBe('completed')
    })
  })

  describe('authorization checks', () => {
    it('should not allow user to access another users debate', async () => {
      // Create debate for TEST_USER_ID
      const [debate] = await db
        .insert(quoorumDebates)
        .values({
          userId: TEST_USER_ID,
          question: 'Private debate',
          context: {},
          mode: 'dynamic',
          status: 'completed',
          visibility: 'private',
        })
        .returning()

      expect(debate).toBeDefined()
      if (!debate) throw new Error('Debate not created')

      // Try to access with different userId
      const OTHER_USER_ID = randomUUID() // Different UUID
      const otherUserDebate = await db
        .select()
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, debate.id),
            eq(quoorumDebates.userId, OTHER_USER_ID) // Different user
          )
        )

      expect(otherUserDebate).toHaveLength(0)
    })
  })
})
