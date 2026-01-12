/**
 * Forum Performance Metrics
 *
 * Sistema de métricas para monitorear performance y optimización
 */

import { forumLogger } from './logger'

export interface Metric {
  name: string
  value: number
  unit: 'ms' | 'count' | 'bytes' | 'usd'
  timestamp: string
  sessionId?: string
  tags?: Record<string, string>
}

export type MetricHandler = (metric: Metric) => void

// ============================================================================
// METRICS COLLECTOR
// ============================================================================

class MetricsCollector {
  private handlers: MetricHandler[] = []
  private metrics: Metric[] = []
  private maxStoredMetrics = 1000

  /**
   * Añade un handler para procesar métricas
   */
  addHandler(handler: MetricHandler): void {
    this.handlers.push(handler)
  }

  /**
   * Remueve todos los handlers
   */
  clearHandlers(): void {
    this.handlers = []
  }

  /**
   * Registra una métrica
   */
  record(
    name: string,
    value: number,
    unit: 'ms' | 'count' | 'bytes' | 'usd',
    sessionId?: string,
    tags?: Record<string, string>
  ): void {
    const metric: Metric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      sessionId,
      tags,
    }

    // Store metric
    this.metrics.push(metric)
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics.shift()
    }

    // Call handlers
    for (const handler of this.handlers) {
      try {
        handler(metric)
      } catch (error) {
        forumLogger.error(
          'Metric handler error',
          error instanceof Error ? error : new Error(String(error)),
          { metricName: metric.name }
        )
      }
    }
  }

  /**
   * Obtiene todas las métricas almacenadas
   */
  getMetrics(): Metric[] {
    return [...this.metrics]
  }

  /**
   * Obtiene métricas filtradas por nombre
   */
  getMetricsByName(name: string): Metric[] {
    return this.metrics.filter((m) => m.name === name)
  }

  /**
   * Obtiene métricas filtradas por sesión
   */
  getMetricsBySession(sessionId: string): Metric[] {
    return this.metrics.filter((m) => m.sessionId === sessionId)
  }

  /**
   * Limpia todas las métricas almacenadas
   */
  clear(): void {
    this.metrics = []
  }

  /**
   * Obtiene estadísticas de una métrica
   */
  getStats(name: string): {
    count: number
    min: number
    max: number
    avg: number
    sum: number
  } | null {
    const values = this.metrics.filter((m) => m.name === name).map((m) => m.value)

    if (values.length === 0) return null

    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      sum: values.reduce((a, b) => a + b, 0),
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const metrics = new MetricsCollector()

// ============================================================================
// TIMER UTILITY
// ============================================================================

export class Timer {
  private startTime: number
  private name: string
  private sessionId?: string
  private tags?: Record<string, string>

  constructor(name: string, sessionId?: string, tags?: Record<string, string>) {
    this.name = name
    this.sessionId = sessionId
    this.tags = tags
    this.startTime = Date.now()
  }

  /**
   * Detiene el timer y registra la métrica
   */
  stop(): number {
    const duration = Date.now() - this.startTime
    metrics.record(this.name, duration, 'ms', this.sessionId, this.tags)
    return duration
  }

  /**
   * Obtiene el tiempo transcurrido sin detener el timer
   */
  elapsed(): number {
    return Date.now() - this.startTime
  }
}

// ============================================================================
// BUILT-IN HANDLERS
// ============================================================================

/**
 * Logger handler (usa forumLogger)
 */
export const consoleMetricHandler: MetricHandler = (metric) => {
  const value =
    metric.unit === 'ms' ? `${metric.value.toFixed(2)}ms` : `${metric.value} ${metric.unit}`

  forumLogger.debug(`[Metric:${metric.name}] ${value}`, {
    metricName: metric.name,
    value: metric.value,
    unit: metric.unit,
    sessionId: metric.sessionId,
    tags: metric.tags,
  })
}

/**
 * Aggregation handler (agrupa métricas cada N segundos)
 */
export function createAggregationHandler(intervalSeconds: number): MetricHandler {
  const aggregates = new Map<string, number[]>()

  setInterval(() => {
    for (const [name, values] of aggregates.entries()) {
      if (values.length === 0) continue

      const stats = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
      }

      forumLogger.debug(`[Metric Aggregation:${name}]`, {
        metricName: name,
        stats,
      })
    }

    aggregates.clear()
  }, intervalSeconds * 1000)

  return (metric) => {
    if (!aggregates.has(metric.name)) {
      aggregates.set(metric.name, [])
    }
    aggregates.get(metric.name)!.push(metric.value)
  }
}

// ============================================================================
// METRIC HELPERS
// ============================================================================

/**
 * Mide el tiempo de ejecución de una función
 */
export async function measure<T>(
  name: string,
  fn: () => Promise<T>,
  sessionId?: string,
  tags?: Record<string, string>
): Promise<T> {
  const timer = new Timer(name, sessionId, tags)
  try {
    const result = await fn()
    timer.stop()
    return result
  } catch (error) {
    timer.stop()
    throw error
  }
}

/**
 * Mide el tiempo de ejecución de una función síncrona
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  sessionId?: string,
  tags?: Record<string, string>
): T {
  const timer = new Timer(name, sessionId, tags)
  try {
    const result = fn()
    timer.stop()
    return result
  } catch (error) {
    timer.stop()
    throw error
  }
}

// ============================================================================
// PREDEFINED METRICS
// ============================================================================

/**
 * Métricas de análisis de preguntas
 */
export const questionMetrics = {
  analysisTime: (duration: number, sessionId: string) =>
    metrics.record('question.analysis.time', duration, 'ms', sessionId),

  complexity: (complexity: number, sessionId: string) =>
    metrics.record('question.complexity', complexity, 'count', sessionId),

  areaCount: (count: number, sessionId: string) =>
    metrics.record('question.areas.count', count, 'count', sessionId),
}

/**
 * Métricas de matching de expertos
 */
export const matchingMetrics = {
  matchingTime: (duration: number, sessionId: string) =>
    metrics.record('matching.time', duration, 'ms', sessionId),

  expertCount: (count: number, sessionId: string) =>
    metrics.record('matching.experts.count', count, 'count', sessionId),

  primaryCount: (count: number, sessionId: string) =>
    metrics.record('matching.primary.count', count, 'count', sessionId),
}

/**
 * Métricas de quality monitoring
 */
export const qualityMetrics = {
  checkTime: (duration: number, sessionId: string, round: number) =>
    metrics.record('quality.check.time', duration, 'ms', sessionId, { round: round.toString() }),

  score: (score: number, sessionId: string, round: number) =>
    metrics.record('quality.score', score, 'count', sessionId, { round: round.toString() }),

  issueCount: (count: number, sessionId: string, round: number) =>
    metrics.record('quality.issues.count', count, 'count', sessionId, { round: round.toString() }),
}

/**
 * Métricas de meta-moderador
 */
export const moderatorMetrics = {
  interventionTime: (duration: number, sessionId: string, round: number) =>
    metrics.record('moderator.intervention.time', duration, 'ms', sessionId, {
      round: round.toString(),
    }),

  interventionCount: (count: number, sessionId: string) =>
    metrics.record('moderator.interventions.count', count, 'count', sessionId),
}

/**
 * Métricas de debate
 */
export const debateMetrics = {
  totalTime: (duration: number, sessionId: string) =>
    metrics.record('debate.total.time', duration, 'ms', sessionId),

  roundTime: (duration: number, sessionId: string, round: number) =>
    metrics.record('debate.round.time', duration, 'ms', sessionId, { round: round.toString() }),

  roundCount: (count: number, sessionId: string) =>
    metrics.record('debate.rounds.count', count, 'count', sessionId),

  messageCount: (count: number, sessionId: string) =>
    metrics.record('debate.messages.count', count, 'count', sessionId),

  totalCost: (cost: number, sessionId: string) =>
    metrics.record('debate.total.cost', cost, 'usd', sessionId),

  consensusScore: (score: number, sessionId: string) =>
    metrics.record('debate.consensus.score', score, 'count', sessionId),
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Genera reporte de métricas
 */
export function generateReport(): string {
  const lines: string[] = []

  lines.push('📊 Forum Metrics Report')
  lines.push('='.repeat(50))

  const metricNames = [...new Set(metrics.getMetrics().map((m) => m.name))].sort()

  for (const name of metricNames) {
    const stats = metrics.getStats(name)
    if (!stats) continue

    lines.push(`\n${name}:`)
    lines.push(`  Count: ${stats.count}`)
    lines.push(`  Min: ${stats.min.toFixed(2)}`)
    lines.push(`  Max: ${stats.max.toFixed(2)}`)
    lines.push(`  Avg: ${stats.avg.toFixed(2)}`)
    lines.push(`  Sum: ${stats.sum.toFixed(2)}`)
  }

  return lines.join('\n')
}
