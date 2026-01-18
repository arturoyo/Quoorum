/**
 * Debate Orchestration Adapter
 * 
 * Adapts DebateSequence (orchestration) to DebateResult (core runner format)
 * for seamless integration between orchestration patterns and the existing UI
 */

import type { DebateSequence, PatternType, DebateResult, DebateRound, RankedOption } from '@quoorum/quoorum'

/**
 * Convert DebateSequence (orchestration format) to DebateResult (core format)
 * This allows orchestrated debates (tournament, adversarial, ensemble, etc.) 
 * to work seamlessly with the existing UI that expects DebateResult
 */
export function debateSequenceToResult(
  sequence: DebateSequence,
  sessionId: string
): DebateResult {
  // Extract all rounds from all phases
  // For orchestrated debates, we combine all rounds from all sub-debates
  const allRounds: DebateRound[] = []
  let roundNumber = 1

  for (const phaseResult of sequence.results) {
    for (const debateResult of phaseResult.debateResults) {
      // Each SubDebateResult represents a complete debate
      // We create rounds from the ranking/options
      if (debateResult.ranking && debateResult.ranking.length > 0) {
        // Create a round from the top options of this sub-debate
        const round: DebateRound = {
          round: roundNumber++,
          messages: debateResult.ranking.slice(0, 3).map((r, idx) => ({
            id: `msg-${debateResult.debateId}-${idx}`,
            sessionId: `${sessionId}-${debateResult.debateId}`,
            round: roundNumber - 1,
            agentKey: `phase-${phaseResult.phaseId}-debate-${debateResult.debateId}`,
            agentName: `Sub-debate: ${debateResult.debateId.substring(0, 8)}`,
            content: `${r.option} (${Math.round(r.score * 100)}%): ${r.reasoning || ''}`,
            isCompressed: false,
            tokensUsed: 0,
            costUsd: 0,
            createdAt: new Date(),
          })),
          consensusCheck: {
            hasConsensus: debateResult.consensusScore >= 0.7,
            consensusScore: debateResult.consensusScore,
            topOptions: debateResult.ranking.slice(0, 3).map((r) => ({
              option: r.option,
              successRate: r.score * 100,
              score: r.score * 100,
              pros: [],
              cons: [],
              supporters: [],
              confidence: r.confidence,
              reasoning: r.reasoning,
            })),
            shouldContinue: debateResult.consensusScore < 0.7,
            reasoning: `Consenso: ${(debateResult.consensusScore * 100).toFixed(0)}%`,
          },
        }
        allRounds.push(round)
      }
    }
  }

  // Extract final ranking from finalConclusion or best result
  const finalRanking: RankedOption[] = []
  
  if (sequence.finalConclusion) {
    // Use finalConclusion recommendation
    finalRanking.push({
      option: sequence.finalConclusion.recommendation,
      successRate: sequence.finalConclusion.confidence * 100,
      score: sequence.finalConclusion.confidence * 100,
      pros: sequence.finalConclusion.keyInsights || [],
      cons: [],
      supporters: [],
      confidence: sequence.finalConclusion.confidence,
      reasoning: sequence.finalConclusion.summary,
    })
  } else if (sequence.results.length > 0) {
    // Use best result from last phase
    const lastPhase = sequence.results[sequence.results.length - 1]
    if (lastPhase?.debateResults.length > 0) {
      const bestDebate = lastPhase.debateResults.reduce((best, r) =>
        r.consensusScore > best.consensusScore ? r : best
      )
      finalRanking.push(...(bestDebate.ranking.map((r) => ({
        option: r.option,
        successRate: r.score * 100,
        score: r.score * 100,
        pros: [],
        cons: [],
        supporters: [],
        confidence: r.confidence,
        reasoning: r.reasoning,
      })) || []))
    }
  }

  // Calculate consensus score from finalConclusion or average
  const consensusScore = sequence.finalConclusion?.confidence ?? 
    (sequence.results.length > 0
      ? sequence.results.reduce((sum, pr) => 
          sum + pr.debateResults.reduce((s, dr) => s + dr.consensusScore, 0) / pr.debateResults.length, 
          0
        ) / sequence.results.length
      : 0.5)

  return {
    sessionId,
    status: sequence.status === 'completed' ? 'completed' : sequence.status === 'failed' ? 'failed' : 'running',
    rounds: allRounds,
    finalRanking,
    ranking: finalRanking, // Alias
    totalCostUsd: sequence.totalCost,
    totalRounds: allRounds.length,
    consensusScore,
    consensus: consensusScore, // Alias
    question: sequence.mainQuestion,
    experts: undefined, // Orchestrated debates don't expose individual experts
  }
}
