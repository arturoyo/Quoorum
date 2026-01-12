/**
 * Orchestrator Executive Extensions
 *
 * CEO-level features for the DebateOrchestrator.
 */

import { selectStrategy } from './strategy-selector'
import {
  generateExecutiveSummary,
  simulateBoardAdvisors,
  type ExecutiveSummary,
  type BoardVote,
} from './executive-insights'
import type { PatternType, OrchestrationConfig } from './types'
import { DEFAULT_ORCHESTRATION_CONFIG } from './types'

// ============================================================================
// EXECUTIVE ORCHESTRATOR
// ============================================================================

/**
 * Executive-level orchestrator with CEO-focused features
 */
export class ExecutiveOrchestrator {
  private config: OrchestrationConfig

  constructor(config: Partial<OrchestrationConfig> = {}) {
    this.config = { ...DEFAULT_ORCHESTRATION_CONFIG, ...config }
  }

  /**
   * Generate full executive summary for a question
   */
  async getExecutiveSummary(
    question: string,
    pattern?: PatternType
  ): Promise<ExecutiveSummary> {
    const configOverride = pattern
      ? { ...this.config, patternMode: 'manual' as const, preferredPattern: pattern }
      : this.config

    const analysis = await selectStrategy(question, configOverride)
    return generateExecutiveSummary(question, analysis)
  }

  /**
   * Simulate AI Board of Advisors deliberation
   */
  async getBoardDeliberation(
    question: string,
    pattern?: PatternType
  ): Promise<BoardVote> {
    const configOverride = pattern
      ? { ...this.config, patternMode: 'manual' as const, preferredPattern: pattern }
      : this.config

    const analysis = await selectStrategy(question, configOverride)
    return simulateBoardAdvisors(question, analysis)
  }

  /**
   * Get complete executive briefing (summary + board + visualization)
   */
  async getExecutiveBriefing(
    question: string,
    pattern?: PatternType
  ): Promise<ExecutiveBriefing> {
    const configOverride = pattern
      ? { ...this.config, patternMode: 'manual' as const, preferredPattern: pattern }
      : this.config

    const analysis = await selectStrategy(question, configOverride)

    const [summary, board] = await Promise.all([
      Promise.resolve(generateExecutiveSummary(question, analysis)),
      Promise.resolve(simulateBoardAdvisors(question, analysis)),
    ])

    return {
      question,
      pattern: analysis.recommendedPattern,
      summary,
      board,
      onePager: generateOnePager(question, summary, board),
      generatedAt: new Date().toISOString(),
    }
  }

  /**
   * Generate decision scorecard
   */
  async getDecisionScorecard(question: string): Promise<DecisionScorecard> {
    const analysis = await selectStrategy(question, this.config)
    const summary = generateExecutiveSummary(question, analysis)

    return {
      question,
      overallScore: calculateOverallScore(summary),
      dimensions: [
        { name: 'Confianza', score: summary.confidence.score, weight: 0.25 },
        { name: 'Reversibilidad', score: summary.reversibility.score, weight: 0.15 },
        { name: 'Oportunidad', score: calculateOppScore(summary.opportunities), weight: 0.25 },
        { name: 'Riesgo (inverso)', score: 100 - calculateRiskScore(summary.risks), weight: 0.20 },
        { name: 'Urgencia', score: calculateUrgencyScore(summary.costOfDelay), weight: 0.15 },
      ],
      recommendation: summary.recommendation,
      verdict: getVerdict(calculateOverallScore(summary)),
    }
  }

  /**
   * Quick executive snapshot
   */
  async getSnapshot(question: string): Promise<ExecutiveSnapshot> {
    const analysis = await selectStrategy(question, this.config)
    const summary = generateExecutiveSummary(question, analysis)
    const board = simulateBoardAdvisors(question, analysis)

    return {
      headline: summary.headline,
      confidence: `${summary.confidence.score}% (${summary.confidence.level})`,
      boardConsensus: board.consensus,
      topRisk: summary.risks[0]?.description || 'Ninguno identificado',
      topOpportunity: summary.opportunities[0]?.description || 'Ninguna identificada',
      urgency: summary.costOfDelay.urgencyLevel,
      reversibility: summary.reversibility.level,
      verdict: getVerdict(summary.confidence.score),
    }
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface ExecutiveBriefing {
  question: string
  pattern: PatternType
  summary: ExecutiveSummary
  board: BoardVote
  onePager: string
  generatedAt: string
}

export interface DecisionScorecard {
  question: string
  overallScore: number
  dimensions: Array<{ name: string; score: number; weight: number }>
  recommendation: string
  verdict: 'proceed' | 'proceed_with_caution' | 'reconsider' | 'reject'
}

export interface ExecutiveSnapshot {
  headline: string
  confidence: string
  boardConsensus: string
  topRisk: string
  topOpportunity: string
  urgency: string
  reversibility: string
  verdict: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateOnePager(question: string, summary: ExecutiveSummary, board: BoardVote): string {
  const lines: string[] = []

  lines.push('═'.repeat(60))
  lines.push('EXECUTIVE BRIEFING - ONE PAGER')
  lines.push('═'.repeat(60))
  lines.push('')
  lines.push(`📋 DECISIÓN: ${question}`)
  lines.push('')
  lines.push('─'.repeat(60))
  lines.push('💡 RECOMENDACIÓN')
  lines.push('─'.repeat(60))
  lines.push(summary.recommendation)
  lines.push('')
  lines.push(`Confianza: ${summary.confidence.score}% (${summary.confidence.level})`)
  lines.push(`Reversibilidad: ${summary.reversibility.level}`)
  lines.push(`Urgencia: ${summary.costOfDelay.urgencyLevel}`)
  lines.push('')
  lines.push('─'.repeat(60))
  lines.push('🎯 INSIGHTS CLAVE')
  lines.push('─'.repeat(60))
  summary.keyInsights.forEach((insight, i) => {
    lines.push(`${i + 1}. ${insight}`)
  })
  lines.push('')
  lines.push('─'.repeat(60))
  lines.push('⚠️ RIESGOS PRINCIPALES')
  lines.push('─'.repeat(60))
  summary.risks.slice(0, 3).forEach(risk => {
    lines.push(`• [${risk.severity.toUpperCase()}] ${risk.description}`)
    lines.push(`  Mitigación: ${risk.mitigation}`)
  })
  lines.push('')
  lines.push('─'.repeat(60))
  lines.push('🚀 OPORTUNIDADES')
  lines.push('─'.repeat(60))
  summary.opportunities.slice(0, 2).forEach(opp => {
    lines.push(`• [${opp.impact.toUpperCase()}] ${opp.description}`)
    lines.push(`  Timeframe: ${opp.timeframe}`)
  })
  lines.push('')
  lines.push('─'.repeat(60))
  lines.push('👥 CONSEJO DE ASESORES')
  lines.push('─'.repeat(60))
  lines.push(`Consenso: ${board.consensus.toUpperCase()}`)
  board.advisors.slice(0, 4).forEach(advisor => {
    const voteIcon = advisor.vote === 'approve' ? '✅' :
                     advisor.vote === 'reject' ? '❌' :
                     advisor.vote === 'abstain' ? '⚪' : '❓'
    lines.push(`${voteIcon} ${advisor.name}: ${advisor.perspective}`)
  })
  lines.push('')
  lines.push('─'.repeat(60))
  lines.push('📝 PRÓXIMOS PASOS')
  lines.push('─'.repeat(60))
  summary.nextSteps.forEach(step => lines.push(step))
  lines.push('')
  lines.push('═'.repeat(60))
  lines.push(`Generado: ${summary.generatedAt}`)
  lines.push('═'.repeat(60))

  return lines.join('\n')
}

function calculateOverallScore(summary: ExecutiveSummary): number {
  const confidence = summary.confidence.score * 0.3
  const reversibility = summary.reversibility.score * 0.15
  const oppScore = calculateOppScore(summary.opportunities) * 0.25
  const riskScore = (100 - calculateRiskScore(summary.risks)) * 0.2
  const urgencyScore = calculateUrgencyScore(summary.costOfDelay) * 0.1

  return Math.round(confidence + reversibility + oppScore + riskScore + urgencyScore)
}

function calculateOppScore(opportunities: ExecutiveSummary['opportunities']): number {
  if (opportunities.length === 0) return 50
  const impactScores = { low: 25, medium: 50, high: 75, transformative: 100 }
  const avg = opportunities.reduce((s, o) => s + impactScores[o.impact], 0) / opportunities.length
  return Math.round(avg)
}

function calculateRiskScore(risks: ExecutiveSummary['risks']): number {
  if (risks.length === 0) return 0
  const severityScores = { low: 15, medium: 35, high: 65, critical: 90 }
  const avg = risks.reduce((s, r) => s + severityScores[r.severity] * r.probability, 0) / risks.length
  return Math.round(avg)
}

function calculateUrgencyScore(costOfDelay: ExecutiveSummary['costOfDelay']): number {
  const scores = { low: 30, medium: 50, high: 75, critical: 95 }
  return scores[costOfDelay.urgencyLevel]
}

function getVerdict(score: number): DecisionScorecard['verdict'] {
  if (score >= 75) return 'proceed'
  if (score >= 55) return 'proceed_with_caution'
  if (score >= 35) return 'reconsider'
  return 'reject'
}

/**
 * Create an executive orchestrator
 */
export function createExecutiveOrchestrator(
  config?: Partial<OrchestrationConfig>
): ExecutiveOrchestrator {
  return new ExecutiveOrchestrator(config)
}
