/**
 * Quality Benchmarking System
 * Compares context quality against historical successful debates
 */

import { getAIClient, parseAIJson } from '@quoorum/ai'
import { logger } from './logger'

// ============================================================================
// TYPES
// ============================================================================

export interface BenchmarkComparison {
  percentile: number // 0-100
  tier: 'excellent' | 'good' | 'average' | 'needs-improvement'
  score: number
  avgScore: number
  topScore: number
}

export interface DimensionBenchmark {
  dimensionId: string
  dimensionName: string
  yourScore: number
  avgScore: number
  topScore: number
  gap: number
  improvement: string
}

export interface QualityBenchmarkOutput {
  overall: BenchmarkComparison
  dimensions: DimensionBenchmark[]
  recommendations: string[]
  estimatedSuccessRate: number // 0-100
  comparisonInsights: string[]
}

// ============================================================================
// MOCK HISTORICAL DATA
// ============================================================================

// TODO: Replace with real data from database when available
const HISTORICAL_BENCHMARKS = {
  overall: {
    avg: 65,
    p90: 85,
    p75: 75,
    p50: 65,
    p25: 50,
  },
  dimensions: {
    objective: { avg: 75, top: 95 },
    context: { avg: 60, top: 90 },
    constraints: { avg: 55, top: 85 },
    options: { avg: 70, top: 95 },
    criteria: { avg: 65, top: 90 },
    risks: { avg: 50, top: 80 },
    timeline: { avg: 45, top: 75 },
    stakeholders: { avg: 55, top: 85 },
  },
}

// ============================================================================
// BENCHMARKING ENGINE
// ============================================================================

export async function benchmarkContextQuality(
  overallScore: number,
  dimensions: Array<{ id: string; name: string; score: number }>
): Promise<QualityBenchmarkOutput> {
  // Calculate percentile
  const percentile = calculatePercentile(overallScore, HISTORICAL_BENCHMARKS.overall)

  // Determine tier
  const tier = getTier(percentile)

  // Benchmark dimensions
  const dimensionBenchmarks = dimensions.map((dim) => {
    const benchmark =
      HISTORICAL_BENCHMARKS.dimensions[dim.id as keyof typeof HISTORICAL_BENCHMARKS.dimensions] ||
      { avg: 60, top: 90 }

    const gap = benchmark.top - dim.score

    return {
      dimensionId: dim.id,
      dimensionName: dim.name,
      yourScore: dim.score,
      avgScore: benchmark.avg,
      topScore: benchmark.top,
      gap,
      improvement: generateImprovementSuggestion(dim.name, gap),
    }
  })

  // Generate AI-powered insights
  const insights = await generateComparisonInsights(
    overallScore,
    percentile,
    dimensionBenchmarks
  )

  // Estimate success rate
  const estimatedSuccessRate = estimateSuccessRate(overallScore, dimensionBenchmarks)

  return {
    overall: {
      percentile,
      tier,
      score: overallScore,
      avgScore: HISTORICAL_BENCHMARKS.overall.avg,
      topScore: HISTORICAL_BENCHMARKS.overall.p90,
    },
    dimensions: dimensionBenchmarks,
    recommendations: generateRecommendations(dimensionBenchmarks),
    estimatedSuccessRate,
    comparisonInsights: insights,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculatePercentile(
  score: number,
  benchmarks: { p90: number; p75: number; p50: number; p25: number }
): number {
  if (score >= benchmarks.p90) return 90 + ((score - benchmarks.p90) / (100 - benchmarks.p90)) * 10
  if (score >= benchmarks.p75) return 75 + ((score - benchmarks.p75) / (benchmarks.p90 - benchmarks.p75)) * 15
  if (score >= benchmarks.p50) return 50 + ((score - benchmarks.p50) / (benchmarks.p75 - benchmarks.p50)) * 25
  if (score >= benchmarks.p25) return 25 + ((score - benchmarks.p25) / (benchmarks.p50 - benchmarks.p25)) * 25
  return (score / benchmarks.p25) * 25
}

function getTier(percentile: number): 'excellent' | 'good' | 'average' | 'needs-improvement' {
  if (percentile >= 75) return 'excellent'
  if (percentile >= 50) return 'good'
  if (percentile >= 25) return 'average'
  return 'needs-improvement'
}

function generateImprovementSuggestion(_dimensionName: string, gap: number): string {
  if (gap <= 5) return 'Excelente, mantén este nivel'
  if (gap <= 15) return `+${gap} puntos para alcanzar el top 10%`
  if (gap <= 30) return `+${gap} puntos para alcanzar el top 10% - Añade más detalle`
  return `+${gap} puntos para alcanzar el top 10% - Dimensión crítica a mejorar`
}

function generateRecommendations(benchmarks: DimensionBenchmark[]): string[] {
  const recommendations: string[] = []

  // Find biggest gaps
  const sortedByGap = [...benchmarks].sort((a, b) => b.gap - a.gap)

  // Top 3 gaps
  sortedByGap.slice(0, 3).forEach((dim) => {
    if (dim.gap > 20) {
      recommendations.push(
        `Mejorar "${dim.dimensionName}": actualmente ${dim.yourScore}%, el top 10% tiene ${dim.topScore}%`
      )
    }
  })

  // Excellence areas
  const excellent = benchmarks.filter((d) => d.yourScore >= d.topScore - 5)
  if (excellent.length > 0) {
    recommendations.push(
      `Áreas excelentes: ${excellent.map((d) => d.dimensionName).join(', ')}`
    )
  }

  return recommendations
}

function estimateSuccessRate(
  overallScore: number,
  dimensions: DimensionBenchmark[]
): number {
  // Base success rate on score
  let successRate = overallScore

  // Penalty for critical gaps
  const criticalGaps = dimensions.filter((d) => d.gap > 30).length
  successRate -= criticalGaps * 10

  // Bonus for balance
  const avgGap = dimensions.reduce((sum, d) => sum + d.gap, 0) / dimensions.length
  if (avgGap < 10) successRate += 10

  return Math.max(0, Math.min(100, successRate))
}

async function generateComparisonInsights(
  overallScore: number,
  percentile: number,
  dimensions: DimensionBenchmark[]
): Promise<string[]> {
  const aiClient = getAIClient()

  const dimensionsSummary = dimensions
    .map(
      (d) =>
        `${d.dimensionName}: Tu ${d.yourScore}% vs Promedio ${d.avgScore}% vs Top ${d.topScore}%`
    )
    .join('\n')

  const prompt = `Quality Benchmarking Analysis:

Overall Score: ${overallScore}% (Percentile ${Math.round(percentile)})

Dimensions Comparison:
${dimensionsSummary}

Generate 3-5 actionable insights comparing this context to successful debates.

Focus on:
- What makes this context strong/weak
- Specific improvements to reach top 10%
- Patterns from high-performing debates

Output as JSON array of strings:
["Insight 1", "Insight 2", "Insight 3"]`

  try {
    const response = await aiClient.generate(prompt, {
      modelId: 'gemini-2.0-flash',
      systemPrompt:
        'You are a quality analyst. Provide specific, actionable insights. Output ONLY valid JSON.',
      temperature: 0.4,
      maxTokens: 1500,
    })

    return parseAIJson<string[]>(response.text)
  } catch (error) {
    logger.error('[Quality Benchmark] Insights generation failed:', error instanceof Error ? error : undefined)
    return [
      `Tu contexto está en el percentil ${Math.round(percentile)}`,
      'Enfócate en las dimensiones con mayor brecha',
      'Los debates exitosos tienen contexto balanceado',
    ]
  }
}
