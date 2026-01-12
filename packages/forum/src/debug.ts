/**
 * Debug & Monitoring Utilities
 *
 * Quick bonus: Advanced debugging and monitoring tools
 */

import type { DebateResult, DebateMessage as _DebateMessage } from './types'
import type { ExpertProfile as _ExpertProfile } from './expert-database'
import { forumLogger } from './logger'

// Types used for documentation purposes
void (0 as unknown as _DebateMessage)
void (0 as unknown as _ExpertProfile)

// ============================================================================
// DEBUG LOGGER
// ============================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class DebugLogger {
  private level: LogLevel = LogLevel.INFO
  private logs: Array<{ timestamp: Date; level: LogLevel; message: string; data?: unknown }> = []
  private maxLogs = 1000

  setLevel(level: LogLevel) {
    this.level = level
  }

  debug(message: string, data?: unknown) {
    this.log(LogLevel.DEBUG, message, data)
  }

  info(message: string, data?: unknown) {
    this.log(LogLevel.INFO, message, data)
  }

  warn(message: string, data?: unknown) {
    this.log(LogLevel.WARN, message, data)
  }

  error(message: string, data?: unknown) {
    this.log(LogLevel.ERROR, message, data)
  }

  private log(level: LogLevel, message: string, data?: unknown) {
    if (level < this.level) return

    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
    }

    this.logs.push(logEntry)

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Use forumLogger for structured logging
    const context = data ? { debugData: data } : undefined

    switch (level) {
      case LogLevel.DEBUG:
        forumLogger.debug(message, context)
        break
      case LogLevel.INFO:
        forumLogger.info(message, context)
        break
      case LogLevel.WARN:
        forumLogger.warn(message, context)
        break
      case LogLevel.ERROR:
        forumLogger.error(
          message,
          data instanceof Error ? data : undefined,
          data instanceof Error ? undefined : context
        )
        break
    }
  }

  getLogs(level?: LogLevel) {
    if (level === undefined) return this.logs
    return this.logs.filter((log) => log.level === level)
  }

  clear() {
    this.logs = []
  }

  export() {
    return JSON.stringify(this.logs, null, 2)
  }
}

export const logger = new DebugLogger()

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

class PerformanceMonitor {
  private timers: Map<string, number> = new Map()
  private metrics: Map<string, number[]> = new Map()

  start(label: string) {
    this.timers.set(label, Date.now())
  }

  end(label: string): number {
    const start = this.timers.get(label)
    if (!start) {
      logger.warn(`Timer not found: ${label}`)
      return 0
    }

    const duration = Date.now() - start
    this.timers.delete(label)

    // Store metric
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    this.metrics.get(label)!.push(duration)

    forumLogger.debug(`${label}: ${duration}ms`, { label, duration })
    return duration
  }

  getStats(label: string) {
    const values = this.metrics.get(label) || []
    if (values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)
    const sum = values.reduce((a, b) => a + b, 0)

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    }
  }

  getAllStats() {
    const stats: Record<string, ReturnType<typeof this.getStats>> = {}
    for (const label of this.metrics.keys()) {
      stats[label] = this.getStats(label)
    }
    return stats
  }

  clear() {
    this.timers.clear()
    this.metrics.clear()
  }
}

export const perfMonitor = new PerformanceMonitor()

// ============================================================================
// DEBATE DEBUGGER
// ============================================================================

export class DebateDebugger {
  private debate: DebateResult

  constructor(debate: DebateResult) {
    this.debate = debate
  }

  /**
   * Validate debate structure
   */
  validate(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check required fields
    if (!this.debate.sessionId) errors.push('Missing sessionId')
    if (!this.debate.question) errors.push('Missing question')
    if (!this.debate.rounds) errors.push('Missing rounds')

    // Check rounds
    if (this.debate.rounds) {
      if (this.debate.rounds.length === 0) {
        warnings.push('No rounds in debate')
      }

      this.debate.rounds.forEach((round, i) => {
        if (!round.messages || round.messages.length === 0) {
          warnings.push(`Round ${i + 1} has no messages`)
        }
      })
    }

    // Check consensus
    if (this.debate.consensusScore < 0 || this.debate.consensusScore > 1) {
      errors.push('Invalid consensus score')
    }

    // Check ranking
    if (!this.debate.ranking || this.debate.ranking.length === 0) {
      warnings.push('No ranking available')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Analyze debate quality
   */
  analyzeQuality() {
    const stats = {
      totalMessages: 0,
      avgMessageLength: 0,
      expertParticipation: new Map<string, number>(),
      qualityScore: 0,
    }

    this.debate.rounds?.forEach((round) => {
      round.messages?.forEach((msg) => {
        stats.totalMessages++
        stats.avgMessageLength += msg.content.length

        const count = stats.expertParticipation.get(msg.agentKey) || 0
        stats.expertParticipation.set(msg.agentKey, count + 1)
      })
    })

    if (stats.totalMessages > 0) {
      stats.avgMessageLength /= stats.totalMessages
    }

    // Calculate quality score (0-100)
    let qualityScore = 0

    // Factor 1: Consensus (40 points)
    qualityScore += this.debate.consensusScore * 40

    // Factor 2: Message quality (30 points)
    const avgLength = stats.avgMessageLength
    if (avgLength > 200) qualityScore += 30
    else if (avgLength > 100) qualityScore += 20
    else if (avgLength > 50) qualityScore += 10

    // Factor 3: Expert participation (30 points)
    const expertCount = stats.expertParticipation.size
    if (expertCount >= 5) qualityScore += 30
    else if (expertCount >= 3) qualityScore += 20
    else if (expertCount >= 2) qualityScore += 10

    stats.qualityScore = qualityScore

    return stats
  }

  /**
   * Find potential issues
   */
  findIssues() {
    const issues: Array<{ severity: 'low' | 'medium' | 'high'; message: string }> = []

    // Check consensus
    if (this.debate.consensusScore < 0.3) {
      issues.push({
        severity: 'high',
        message: 'Very low consensus - experts strongly disagree',
      })
    } else if (this.debate.consensusScore < 0.5) {
      issues.push({
        severity: 'medium',
        message: 'Low consensus - consider more rounds',
      })
    }

    // Check rounds
    const roundCount = this.debate.rounds?.length || 0
    if (roundCount > 10) {
      issues.push({
        severity: 'medium',
        message: 'Too many rounds - may indicate lack of progress',
      })
    }

    // Check cost
    if ((this.debate.totalCostUsd || 0) > 5) {
      issues.push({
        severity: 'high',
        message: 'High cost - exceeds $5',
      })
    } else if ((this.debate.totalCostUsd || 0) > 2) {
      issues.push({
        severity: 'medium',
        message: 'Moderate cost - approaching limit',
      })
    }

    // Check ranking
    if (this.debate.ranking && this.debate.ranking.length > 0) {
      const topOption = this.debate.ranking[0]
      if (topOption && topOption.successRate < 50) {
        issues.push({
          severity: 'medium',
          message: 'Top option has low success rate',
        })
      }
    }

    return issues
  }

  /**
   * Generate debug report
   */
  generateReport() {
    const validation = this.validate()
    const quality = this.analyzeQuality()
    const issues = this.findIssues()

    return {
      validation,
      quality,
      issues,
      summary: {
        sessionId: this.debate.sessionId,
        question: this.debate.question,
        rounds: this.debate.rounds?.length || 0,
        consensus: this.debate.consensusScore,
        cost: this.debate.totalCostUsd || 0,
        ranking: this.debate.ranking?.length || 0,
      },
    }
  }
}

// ============================================================================
// ERROR TRACKING
// ============================================================================

class ErrorTracker {
  private errors: Array<{
    timestamp: Date
    error: Error
    context?: unknown
  }> = []

  track(error: Error, context?: Record<string, unknown>) {
    this.errors.push({
      timestamp: new Date(),
      error,
      context,
    })

    forumLogger.error(error.message, error, context)
  }

  getErrors() {
    return this.errors
  }

  getErrorsByType(type: string) {
    return this.errors.filter((e) => e.error.name === type)
  }

  clear() {
    this.errors = []
  }

  export() {
    return JSON.stringify(
      this.errors.map((e) => ({
        timestamp: e.timestamp,
        name: e.error.name,
        message: e.error.message,
        stack: e.error.stack,
        context: e.context,
      })),
      null,
      2
    )
  }
}

export const errorTracker = new ErrorTracker()

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function healthCheck() {
  const health = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date(),
    checks: {
      database: false,
      websocket: false,
      api: false,
    },
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
  }

  // Check database
  try {
    const { db } = await import('@forum/db')
    const { sql } = await import('drizzle-orm')
    // Use sql template literal - cast to satisfy type checker
    const query = sql`SELECT 1` as unknown as string
    await db.execute(query)
    health.checks.database = true
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    health.checks.database = false
    health.status = 'degraded'
  }

  // Check WebSocket (if running)
  try {
    const response = await fetch('http://localhost:3001/health').catch(() => null)
    health.checks.websocket = !!response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    health.checks.websocket = false
  }

  // Check API
  try {
    const response = await fetch('http://localhost:3000/api/health').catch(() => null)
    health.checks.api = !!response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    health.checks.api = false
  }

  // Determine overall status
  if (!health.checks.database) {
    health.status = 'unhealthy'
  } else if (!health.checks.websocket || !health.checks.api) {
    health.status = 'degraded'
  }

  return health
}

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

/**
 * Pretty print debate for debugging
 */
/**
 * Pretty print debate for debugging (CLI tool)
 */
export function prettyPrintDebate(debate: DebateResult) {
  const debugInfo = {
    sessionId: debate.sessionId,
    question: debate.question,
    consensus: `${(debate.consensusScore * 100).toFixed(1)}%`,
    rounds: debate.rounds?.length || 0,
    cost: `$${debate.totalCostUsd?.toFixed(3) || 0}`,
    ranking: debate.ranking?.map((option, i) => {
      if (!option) return { rank: i + 1, option: 'N/A', successRate: '0%' }
      return {
        rank: i + 1,
        option: option.option,
        successRate: `${option.successRate.toFixed(1)}%`,
      }
    }),
  }

  // Use forumLogger for structured output
  forumLogger.info('Debate debug info', { debugInfo })
}

/**
 * Export debug data
 */
export function exportDebugData(): {
  logs: ReturnType<typeof logger.getLogs>
  performance: ReturnType<typeof perfMonitor.getAllStats>
  errors: ReturnType<typeof errorTracker.getErrors>
  timestamp: Date
} {
  return {
    logs: logger.getLogs(),
    performance: perfMonitor.getAllStats(),
    errors: errorTracker.getErrors(),
    timestamp: new Date(),
  }
}
