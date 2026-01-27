/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
/**
 * Forum Integration Examples
 *
 * Ejemplos de código para integrar el sistema dinámico con diferentes aplicaciones
 */

import { runDynamicDebate } from '../src/runner-dynamic'
import { getDebateMode, getRecommendedExperts, estimateDebateCost } from '../src/helpers'
import { initLogger } from '../src/logger'
import { metrics, debateMetrics } from '../src/metrics'
import { updateConfig, applyPreset } from '../src/config'

// ============================================================================
// EXAMPLE 1: Basic Integration
// ============================================================================

/**
 * Ejemplo básico: Ejecutar un debate con configuración por defecto
 */
export async function basicExample() {
  const result = await runDynamicDebate({
    sessionId: 'session-123',
    question: '¿Debo lanzar Wallie a 29€, 49€ o 79€?',
    context: {
      sources: [
        {
          type: 'manual',
          content: 'Wallie es un AI Sales Assistant para WhatsApp Business',
        },
      ],
    },
  })

  console.log('Debate completed!')
  console.log(`Rounds: ${result.totalRounds}`)
  console.log(`Cost: $${result.totalCostUsd}`)
  console.log(`Consensus: ${result.consensusScore}%`)
  console.log(`Top option: ${result.finalRanking[0]}`)
}

// ============================================================================
// EXAMPLE 2: With Observability
// ============================================================================

/**
 * Ejemplo con observabilidad: Monitorear calidad e intervenciones
 */
export async function observabilityExample() {
  const result = await runDynamicDebate({
    sessionId: 'session-456',
    question: '¿Cómo posicionar Wallie: "WhatsApp CRM" o "AI Sales Assistant"?',
    context: {
      sources: [
        {
          type: 'manual',
          content: 'Wallie automatiza ventas en WhatsApp usando AI',
        },
      ],
    },
    onQualityCheck: async (quality) => {
      console.log(`Round ${quality.round}: Quality score ${quality.score}`)
      if (quality.issues.length > 0) {
        console.log(`Issues detected: ${quality.issues.join(', ')}`)
      }
    },
    onIntervention: async (intervention) => {
      console.log(`Meta-moderator intervened: ${intervention.type}`)
      console.log(`Prompt: ${intervention.prompt.substring(0, 100)}...`)
    },
  })

  return result
}

// ============================================================================
// EXAMPLE 3: Preview Before Running
// ============================================================================

/**
 * Ejemplo con preview: Ver modo, expertos y costo antes de ejecutar
 */
export async function previewExample() {
  const question = '¿Debo enfocarme en inmobiliarias o expandir a otros verticales?'

  // 1. Check mode
  const modeInfo = await getDebateMode(question)
  console.log(`Mode: ${modeInfo.mode}`)
  console.log(`Reason: ${modeInfo.reason}`)

  // 2. Preview experts
  const experts = await getRecommendedExperts(question)
  console.log(`\nRecommended experts:`)
  for (const expert of experts) {
    console.log(`  - ${expert.name} (${expert.role})`)
  }

  // 3. Estimate cost
  const cost = await estimateDebateCost(question)
  console.log(`\nEstimated cost: $${cost.expectedCostUsd}`)

  // 4. Run debate if approved
  const approved = true // In real app, ask user
  if (approved) {
    const result = await runDynamicDebate({
      sessionId: 'session-789',
      question,
      context: { sources: [] },
    })
    return result
  }
}

// ============================================================================
// EXAMPLE 4: Custom Configuration
// ============================================================================

/**
 * Ejemplo con configuración personalizada
 */
export async function customConfigExample() {
  // Apply economical preset
  applyPreset('economical')

  // Or customize specific values
  updateConfig({
    dynamicModeComplexityThreshold: 6, // More conservative
    maxExperts: 5, // Fewer experts
    maxRounds: 15, // Fewer rounds
  })

  const result = await runDynamicDebate({
    sessionId: 'session-eco',
    question: '¿Qué feature construir primero?',
    context: { sources: [] },
  })

  return result
}

// ============================================================================
// EXAMPLE 5: With Logging and Metrics
// ============================================================================

/**
 * Ejemplo con logging y métricas
 */
export async function loggingMetricsExample() {
  // Initialize logger
  initLogger({
    level: 'info',
    handler: 'console',
  })

  // Add metric handler
  metrics.addHandler((metric) => {
    if (metric.name.includes('cost')) {
      console.log(`💰 Cost metric: ${metric.value} ${metric.unit}`)
    }
  })

  const result = await runDynamicDebate({
    sessionId: 'session-metrics',
    question: '¿Cómo estructurar los tiers de pricing?',
    context: { sources: [] },
  })

  // Get metrics
  const totalCostMetrics = metrics.getMetricsByName('debate.total.cost')
  console.log(`Total cost metrics recorded: ${totalCostMetrics.length}`)

  return result
}

// ============================================================================
// EXAMPLE 6: Force Mode
// ============================================================================

/**
 * Ejemplo forzando modo específico
 */
export async function forceModeExample() {
  // Force dynamic mode even for simple questions
  const result = await runDynamicDebate({
    sessionId: 'session-force',
    question: '¿Qué color usar para el botón de CTA?',
    context: { sources: [] },
    forceMode: 'dynamic', // Force dynamic mode
  })

  console.log(`Used ${result.totalRounds} rounds (dynamic mode)`)

  return result
}

// ============================================================================
// EXAMPLE 7: API Integration
// ============================================================================

/**
 * Ejemplo de integración con API REST
 */
interface RequestBody {
  question: string
  context?: unknown
  sessionId: string
}

interface Request {
  body: RequestBody
}

interface Response {
  status(code: number): Response
  json(data: unknown): void
}

export async function apiIntegrationExample(req: Request, res: Response) {
  try {
    const { question, context, sessionId } = req.body

    // Validate input
    if (!question || !sessionId) {
      return res.status(400).json({
        error: 'Missing required fields: question, sessionId',
      })
    }

    // Run debate
    const result = await runDynamicDebate({
      sessionId,
      question,
      context: context || { sources: [] },
      onQualityCheck: async (quality) => {
        // Could emit WebSocket event here
        console.log(`Quality check: ${quality.score}`)
      },
    })

    // Return result
    return res.json({
      success: true,
      data: {
        sessionId: result.sessionId,
        status: result.status,
        rounds: result.totalRounds,
        cost: result.totalCostUsd,
        consensus: result.consensusScore,
        topOptions: result.finalRanking.slice(0, 3),
      },
    })
  } catch (error) {
    console.error('Debate error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

// ============================================================================
// EXAMPLE 8: Webhook Integration
// ============================================================================

/**
 * Ejemplo de integración con webhooks
 */
export async function webhookIntegrationExample(webhookUrl: string) {
  const result = await runDynamicDebate({
    sessionId: 'session-webhook',
    question: '¿Debo lanzar en España o LATAM primero?',
    context: { sources: [] },
    onRoundComplete: async (round) => {
      // Send webhook after each round
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'round_complete',
          round: round.round,
          messageCount: round.messages.length,
        }),
      })
    },
  })

  // Send final webhook
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'debate_complete',
      sessionId: result.sessionId,
      rounds: result.totalRounds,
      cost: result.totalCostUsd,
    }),
  })

  return result
}

// ============================================================================
// EXAMPLE 9: React Integration
// ============================================================================

/**
 * Ejemplo de integración con React
 */
export function useDebate() {
  // This would be a React hook
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState(null)
  const [quality, setQuality] = React.useState<number[]>([])
  const [interventions, setInterventions] = React.useState<string[]>([])

  const runDebate = async (question: string) => {
    setLoading(true)
    try {
      const debateResult = await runDynamicDebate({
        sessionId: `session-${Date.now()}`,
        question,
        context: { sources: [] },
        onQualityCheck: async (q) => {
          setQuality((prev) => [...prev, q.score])
        },
        onIntervention: async (i) => {
          setInterventions((prev) => [...prev, i.type])
        },
      })
      setResult(debateResult)
    } finally {
      setLoading(false)
    }
  }

  return { loading, result, quality, interventions, runDebate }
}

// ============================================================================
// EXAMPLE 10: Batch Processing
// ============================================================================

/**
 * Ejemplo de procesamiento por lotes
 */
export async function batchProcessingExample() {
  const questions = [
    '¿Debo lanzar Wallie a 29€, 49€ o 79€?',
    '¿Cómo posicionar Wallie en el mercado?',
    '¿Qué feature construir primero?',
  ]

  const results = []

  for (const question of questions) {
    console.log(`\nProcessing: ${question}`)

    const result = await runDynamicDebate({
      sessionId: `batch-${Date.now()}`,
      question,
      context: { sources: [] },
    })

    results.push({
      question,
      topOption: result.finalRanking[0],
      consensus: result.consensusScore,
      cost: result.totalCostUsd,
    })

    console.log(`✓ Completed (${result.totalRounds} rounds, $${result.totalCostUsd})`)
  }

  // Summary
  console.log('\n=== Batch Summary ===')
  const totalCost = results.reduce((sum, r) => sum + r.cost, 0)
  console.log(`Total questions: ${results.length}`)
  console.log(`Total cost: $${totalCost.toFixed(3)}`)

  return results
}
