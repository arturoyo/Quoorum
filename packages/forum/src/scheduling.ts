/**
 * Debate Scheduling
 *
 * Schedule debates to run at specific times
 */

import { runDebate } from './index'
import type { DebateResult } from './types'
import { forumLogger } from './logger'

// ============================================================================
// TYPES
// ============================================================================

export interface ScheduledDebate {
  id: string
  userId: string
  question: string
  mode: 'static' | 'dynamic'
  scheduledFor: Date
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  result?: DebateResult
  createdAt: Date
  completedAt?: Date
  error?: string
}

export interface RecurringDebate {
  id: string
  userId: string
  question: string
  mode: 'static' | 'dynamic'
  schedule: {
    type: 'daily' | 'weekly' | 'monthly'
    time: string // HH:MM format
    dayOfWeek?: number // 0-6 for weekly
    dayOfMonth?: number // 1-31 for monthly
  }
  enabled: boolean
  lastRun?: Date
  nextRun: Date
  createdAt: Date
}

// ============================================================================
// SCHEDULING
// ============================================================================

const scheduledDebates = new Map<string, ScheduledDebate>()
const recurringDebates = new Map<string, RecurringDebate>()
const scheduledTimers = new Map<string, NodeJS.Timeout>()

export function scheduleDebate(
  userId: string,
  question: string,
  scheduledFor: Date,
  mode: 'static' | 'dynamic' = 'dynamic'
): ScheduledDebate {
  const id = `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const scheduled: ScheduledDebate = {
    id,
    userId,
    question,
    mode,
    scheduledFor,
    status: 'pending',
    createdAt: new Date(),
  }

  scheduledDebates.set(id, scheduled)

  // Schedule execution
  const delay = scheduledFor.getTime() - Date.now()
  if (delay > 0) {
    const timer = setTimeout(() => {
      void executeScheduledDebate(id)
    }, delay)
    scheduledTimers.set(id, timer)
  } else {
    // If scheduled time is in the past, execute immediately
    void executeScheduledDebate(id)
  }

  return scheduled
}

async function executeScheduledDebate(id: string) {
  const scheduled = scheduledDebates.get(id)
  if (!scheduled || scheduled.status !== 'pending') return

  scheduled.status = 'running'
  scheduledDebates.set(id, scheduled)

  try {
    const result = await runDebate({
      sessionId: scheduled.id,
      question: scheduled.question,
      context: { sources: [], combinedContext: '' },
    })

    scheduled.status = 'completed'
    scheduled.result = result
    scheduled.completedAt = new Date()
    scheduledDebates.set(id, scheduled)

    // Notify user (would integrate with notification system)
    forumLogger.info('Scheduled debate completed', { id, debateId: scheduled.result?.sessionId })
  } catch (error) {
    scheduled.status = 'failed'
    scheduled.error = error instanceof Error ? error.message : 'Unknown error'
    scheduled.completedAt = new Date()
    scheduledDebates.set(id, scheduled)

    forumLogger.error(
      'Scheduled debate failed',
      error instanceof Error ? error : new Error(String(error)),
      { id }
    )
  } finally {
    scheduledTimers.delete(id)
  }
}

export function cancelScheduledDebate(id: string): boolean {
  const scheduled = scheduledDebates.get(id)
  if (!scheduled || scheduled.status !== 'pending') return false

  scheduled.status = 'cancelled'
  scheduledDebates.set(id, scheduled)

  const timer = scheduledTimers.get(id)
  if (timer) {
    clearTimeout(timer)
    scheduledTimers.delete(id)
  }

  return true
}

export function getScheduledDebate(id: string): ScheduledDebate | undefined {
  return scheduledDebates.get(id)
}

export function listScheduledDebates(userId: string): ScheduledDebate[] {
  return Array.from(scheduledDebates.values())
    .filter((d) => d.userId === userId)
    .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())
}

// ============================================================================
// RECURRING DEBATES
// ============================================================================

export function createRecurringDebate(
  userId: string,
  question: string,
  schedule: RecurringDebate['schedule'],
  mode: 'static' | 'dynamic' = 'dynamic'
): RecurringDebate {
  const id = `recurring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const nextRun = calculateNextRun(schedule)

  const recurring: RecurringDebate = {
    id,
    userId,
    question,
    mode,
    schedule,
    enabled: true,
    nextRun,
    createdAt: new Date(),
  }

  recurringDebates.set(id, recurring)
  scheduleNextRecurringDebate(id)

  return recurring
}

function calculateNextRun(schedule: RecurringDebate['schedule']): Date {
  const now = new Date()
  const [hours, minutes] = schedule.time.split(':').map(Number)

  const next = new Date(now)
  next.setHours(hours || 0, minutes || 0, 0, 0)

  switch (schedule.type) {
    case 'daily':
      if (next <= now) {
        next.setDate(next.getDate() + 1)
      }
      break

    case 'weekly':
      if (schedule.dayOfWeek !== undefined) {
        const currentDay = next.getDay()
        const daysUntilTarget = (schedule.dayOfWeek - currentDay + 7) % 7
        next.setDate(next.getDate() + daysUntilTarget)

        if (next <= now) {
          next.setDate(next.getDate() + 7)
        }
      }
      break

    case 'monthly':
      if (schedule.dayOfMonth !== undefined) {
        next.setDate(schedule.dayOfMonth)

        if (next <= now) {
          next.setMonth(next.getMonth() + 1)
        }
      }
      break
  }

  return next
}

function scheduleNextRecurringDebate(id: string) {
  const recurring = recurringDebates.get(id)
  if (!recurring || !recurring.enabled) return

  const delay = recurring.nextRun.getTime() - Date.now()
  if (delay <= 0) return

  const timer = setTimeout(() => {
    void executeRecurringDebate(id)
  }, delay)

  scheduledTimers.set(`recurring-${id}`, timer)
}

async function executeRecurringDebate(id: string) {
  const recurring = recurringDebates.get(id)
  if (!recurring || !recurring.enabled) return

  try {
    await runDebate({
      sessionId: `recurring-${id}-${Date.now()}`,
      question: recurring.question,
      context: { sources: [], combinedContext: '' },
    })

    recurring.lastRun = new Date()
    recurring.nextRun = calculateNextRun(recurring.schedule)
    recurringDebates.set(id, recurring)

    // Schedule next run
    scheduleNextRecurringDebate(id)

    forumLogger.info('Recurring debate completed', { id, nextRun: recurring.nextRun.toISOString() })
  } catch (error) {
    forumLogger.error(
      'Recurring debate failed',
      error instanceof Error ? error : new Error(String(error)),
      { id }
    )

    // Still schedule next run even if this one failed
    recurring.lastRun = new Date()
    recurring.nextRun = calculateNextRun(recurring.schedule)
    recurringDebates.set(id, recurring)
    scheduleNextRecurringDebate(id)
  }
}

export function updateRecurringDebate(
  id: string,
  updates: Partial<Pick<RecurringDebate, 'question' | 'mode' | 'schedule' | 'enabled'>>
): RecurringDebate | undefined {
  const recurring = recurringDebates.get(id)
  if (!recurring) return undefined

  Object.assign(recurring, updates)

  if (updates.schedule) {
    recurring.nextRun = calculateNextRun(updates.schedule)
  }

  recurringDebates.set(id, recurring)

  // Reschedule
  const timer = scheduledTimers.get(`recurring-${id}`)
  if (timer) {
    clearTimeout(timer)
    scheduledTimers.delete(`recurring-${id}`)
  }

  if (recurring.enabled) {
    scheduleNextRecurringDebate(id)
  }

  return recurring
}

export function deleteRecurringDebate(id: string): boolean {
  const recurring = recurringDebates.get(id)
  if (!recurring) return false

  const timer = scheduledTimers.get(`recurring-${id}`)
  if (timer) {
    clearTimeout(timer)
    scheduledTimers.delete(`recurring-${id}`)
  }

  recurringDebates.delete(id)
  return true
}

export function listRecurringDebates(userId: string): RecurringDebate[] {
  return Array.from(recurringDebates.values())
    .filter((d) => d.userId === userId)
    .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime())
}

// ============================================================================
// UTILITIES
// ============================================================================

export function getUpcomingDebates(
  userId: string,
  limit: number = 10
): Array<{
  type: 'scheduled' | 'recurring'
  debate: ScheduledDebate | RecurringDebate
  runAt: Date
}> {
  const scheduled = listScheduledDebates(userId)
    .filter((d) => d.status === 'pending')
    .map((d) => ({ type: 'scheduled' as const, debate: d, runAt: d.scheduledFor }))

  const recurring = listRecurringDebates(userId)
    .filter((d) => d.enabled)
    .map((d) => ({ type: 'recurring' as const, debate: d, runAt: d.nextRun }))

  return [...scheduled, ...recurring]
    .sort((a, b) => a.runAt.getTime() - b.runAt.getTime())
    .slice(0, limit)
}

export function cleanupCompletedDebates(olderThanDays: number = 30) {
  const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000

  let cleaned = 0
  for (const [id, debate] of scheduledDebates.entries()) {
    if (
      (debate.status === 'completed' || debate.status === 'failed') &&
      debate.completedAt &&
      debate.completedAt.getTime() < cutoff
    ) {
      scheduledDebates.delete(id)
      cleaned++
    }
  }

  return cleaned
}
