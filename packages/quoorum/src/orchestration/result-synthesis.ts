/**
 * Result Synthesis
 *
 * Synthesizes results from multiple debates and generates conclusions.
 */

import type { SubDebateResult, DebateSequence, FinalConclusion } from './types'
import type { ExecutionContext } from './phase-executor'

// ============================================================================
// PHASE SYNTHESIS
// ============================================================================

/**
 * Synthesize results from multiple debates in a phase
 */
// eslint-disable-next-line @typescript-eslint/require-await -- Synchronous synthesis, async for future AI enhancement
export async function synthesizePhaseResults(
  results: SubDebateResult[],
  _context: ExecutionContext
): Promise<string> {
  const summaries = results.map(
    (r) => `- ${r.question}: ${r.topOption} (Consenso: ${(r.consensusScore * 100).toFixed(0)}%)`
  )

  const bestResult = results.reduce(
    (best, r) => (r.consensusScore > best.consensusScore ? r : best),
    results[0]!
  )

  const synthesis = `Síntesis de ${results.length} debates:
${summaries.join('\n')}

Conclusión principal: ${bestResult.topOption} (${(bestResult.consensusScore * 100).toFixed(0)}% consenso)
${bestResult.ranking[0]?.reasoning ? `Razonamiento: ${bestResult.ranking[0].reasoning}` : ''}`

  return synthesis
}

// ============================================================================
// FINAL CONCLUSION
// ============================================================================

/**
 * Generate final conclusion from all phase results
 */
// eslint-disable-next-line @typescript-eslint/require-await -- Synchronous synthesis, async for future AI enhancement
export async function generateFinalConclusion(
  sequence: DebateSequence,
  _context: ExecutionContext
): Promise<FinalConclusion> {
  const allResults: SubDebateResult[] = []
  for (const phaseResult of sequence.results) {
    allResults.push(...phaseResult.debateResults)
  }

  if (allResults.length === 0) {
    return {
      summary: 'No se ejecutaron debates',
      recommendation: 'Sin recomendación',
      confidence: 0,
      keyInsights: [],
    }
  }

  if (allResults.length === 1) {
    const result = allResults[0]!
    return {
      summary: `Resultado: ${result.topOption}`,
      recommendation: result.topOption,
      confidence: result.consensusScore,
      keyInsights: [result.ranking[0]?.reasoning ?? ''].filter(Boolean),
    }
  }

  const avgConsensus = allResults.reduce((sum, r) => sum + r.consensusScore, 0) / allResults.length
  const avgQuality = allResults.reduce((sum, r) => sum + r.qualityScore, 0) / allResults.length
  const confidence = avgConsensus * 0.6 + (avgQuality * 0.4) / 100

  const sortedResults = [...allResults].sort((a, b) => b.consensusScore - a.consensusScore)
  const bestResult = sortedResults[0]!

  const keyInsights = allResults
    .filter((r) => r.consensusScore >= 0.7)
    .map((r) => r.ranking[0]?.reasoning)
    .filter((r): r is string => !!r)
    .slice(0, 5)

  const lowConsensus = allResults.filter((r) => r.consensusScore < 0.5)
  const dissenting =
    lowConsensus.length > 0
      ? `${lowConsensus.length} debate(s) con bajo consenso: ${lowConsensus.map((r) => r.question).join(', ')}`
      : undefined

  const summaryParts = [
    `Análisis de ${allResults.length} sub-debates completado.`,
    `Consenso promedio: ${(avgConsensus * 100).toFixed(0)}%.`,
    sortedResults.length > 1
      ? `Mejor resultado: "${bestResult.topOption}" con ${(bestResult.consensusScore * 100).toFixed(0)}% consenso.`
      : '',
  ].filter(Boolean)

  const nextSteps: string[] = []
  if (avgConsensus < 0.6) {
    nextSteps.push('Considerar profundizar en áreas con bajo consenso')
  }
  if (lowConsensus.length > 0) {
    nextSteps.push('Revisar debates con opiniones divergentes')
  }
  nextSteps.push('Validar recomendación con stakeholders clave')

  return {
    summary: summaryParts.join(' '),
    recommendation: bestResult.topOption,
    confidence,
    keyInsights,
    dissenting,
    nextSteps,
  }
}
