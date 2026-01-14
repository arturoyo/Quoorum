/**
 * Forum System - Unified Integration Layer
 *
 * Connects all enterprise modules into a cohesive decision-making system:
 * Company Context → Templates → Debates → Insights → History → Risks → Follow-ups
 */

import type { CompanyContextStore} from './company-context';
import { createCompanyContext } from './company-context'
import type { DecisionHistory} from './decision-history';
import { createDecisionHistory, type Decision, type DecisionOutcome, type DecisionCategory } from './decision-history'
import type { TemplateEngine} from './debate-templates';
import { createTemplateEngine } from './debate-templates'
import type { TeamPulse} from './team-pulse';
import { createTeamPulse, type TeamMember, type PollResults } from './team-pulse'
import type { RiskDashboard} from './risk-dashboard';
import { createRiskDashboard, type Risk } from './risk-dashboard'
import type { FollowUpTracker} from './follow-up-tracker';
import { createFollowUpTracker, type FollowUp } from './follow-up-tracker'
import type { AIDebateEngine} from './ai-debate-engine';
import { createDebateEngine, createMockDebateEngine, MockAIProvider } from './ai-debate-engine'
import { generateExecutiveSummary, simulateBoardAdvisors } from './executive-insights'
import { selectStrategy } from './strategy-selector'
import { DebateArena, type DebateEntry, type ComparisonResult, type MetaDebateResult } from './debate-arena'
import { MentorEngine, type MentorType, type MentorAdvice, getMockMentorAdvice } from './mentor-modes'
import { toMermaid, toAsciiTree, toVisualizationJson } from './visualization'
import type { AIProvider, AISubDebateResult, DebateContext } from './ai-debate-types'
import type { ExecutiveSummary, BoardVote } from './executive-types'
import type { SubDebate, DebateStructure, PatternType, OrchestrationConfig, StrategyAnalysis } from './types'
import { DEFAULT_ORCHESTRATION_CONFIG } from './types'

// ============================================================================
// TYPES
// ============================================================================

export interface QuoorumSystemConfig {
  aiProvider?: AIProvider
  teamMembers?: TeamMember[]
  companyContext?: CompanyContextStore
}

export interface DecisionConfig {
  question: string
  context?: string
  category?: DecisionCategory
  options?: string[]
  includeTeamVote?: boolean
  includeBoardSimulation?: boolean
  autoScheduleFollowUp?: boolean
  templateId?: string
  templateVariables?: Record<string, string>
}

export interface DecisionResult {
  id: string
  question: string
  debate: AISubDebateResult
  insights: ExecutiveSummary
  boardVote?: BoardVote
  teamVote?: PollResults
  risks: Risk[]
  followUps: FollowUp[]
  decision: Decision
  timestamp: Date
}

export interface ForumStats {
  totalDecisions: number
  decisionsThisMonth: number
  openFollowUps: number
  criticalRisks: number
  teamParticipation: number
  averageConfidence: number
}

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

export interface PatternRecommendation {
  pattern: PatternType
  confidence: number
  reasoning: string
  alternatives: PatternType[]
}

// ============================================================================
// FORUM SYSTEM
// ============================================================================

export class QuoorumSystem {
  private context: CompanyContextStore
  private templates: TemplateEngine
  private teamPulse: TeamPulse
  private history: DecisionHistory
  private risks: RiskDashboard
  private followUps: FollowUpTracker
  private debateEngine: AIDebateEngine
  private arena: DebateArena
  private mentorEngine: MentorEngine
  private provider: AIProvider
  private orchestrationConfig: OrchestrationConfig

  constructor(config: QuoorumSystemConfig) {
    this.orchestrationConfig = { ...DEFAULT_ORCHESTRATION_CONFIG }
    this.provider = config.aiProvider ?? new MockAIProvider()
    this.context = config.companyContext ?? createCompanyContext()
    this.templates = createTemplateEngine()
    this.teamPulse = createTeamPulse()
    this.history = createDecisionHistory()
    this.risks = createRiskDashboard()
    this.followUps = createFollowUpTracker()
    this.debateEngine = config.aiProvider
      ? createDebateEngine(config.aiProvider)
      : createMockDebateEngine()
    this.arena = new DebateArena(this.provider)
    this.mentorEngine = new MentorEngine(this.provider)

    // Add team members if provided
    if (config.teamMembers) {
      for (const member of config.teamMembers) {
        this.teamPulse.addMember(member)
      }
    }
  }

  // ==========================================================================
  // MAIN DECISION FLOW
  // ==========================================================================

  /**
   * Run a complete decision process
   * This is the main entry point that connects all modules
   */
  async runDecision(config: DecisionConfig): Promise<DecisionResult> {
    const startTime = Date.now()
    const decisionId = `decision-${startTime}-${Math.random().toString(36).slice(2, 6)}`

    // 1. Prepare question with company context
    const enrichedQuestion = this.enrichQuestionWithContext(config.question)

    // 2. If using template, fill it
    let finalQuestion = enrichedQuestion
    if (config.templateId) {
      const filled = this.templates.fill(config.templateId, config.templateVariables ?? {})
      if (filled) {
        finalQuestion = filled.question
      }
    }

    // 3. Get team input if requested
    let teamVote: PollResults | undefined
    if (config.includeTeamVote && this.teamPulse.getMembers().length > 0) {
      teamVote = this.collectTeamInput(finalQuestion, config.options)
    }

    // 4. Run the AI debate
    const debate = await this.runDebate(finalQuestion, config.context)

    // 5. Generate executive insights
    const strategyAnalysis = await selectStrategy(finalQuestion)
    const insights = generateExecutiveSummary(finalQuestion, strategyAnalysis, debate)

    // 6. Simulate board advisors if requested
    let boardVote: BoardVote | undefined
    if (config.includeBoardSimulation) {
      boardVote = simulateBoardAdvisors(finalQuestion, strategyAnalysis)
    }

    // 7. Save to decision history
    const decision = this.history.addDecision({
      question: finalQuestion,
      category: config.category ?? this.inferCategory(finalQuestion),
      conclusion: debate.conclusion ?? 'Pendiente de conclusión',
      confidence: insights.confidence.score,
    })

    // 8. Extract and track risks
    const newRisks = this.extractAndTrackRisks(insights, decision.id)

    // 9. Schedule follow-ups if requested
    const followUpsList: FollowUp[] = []
    if (config.autoScheduleFollowUp) {
      const scheduled = this.followUps.scheduleReviewCycle(decision.id)
      followUpsList.push(...scheduled)
    }

    return {
      id: decisionId,
      question: finalQuestion,
      debate,
      insights,
      boardVote,
      teamVote,
      risks: newRisks,
      followUps: followUpsList,
      decision,
      timestamp: new Date(),
    }
  }

  /**
   * Run decision from a template - convenience method
   */
  async runFromTemplate(
    templateId: string,
    variables: Record<string, string>,
    options?: Partial<DecisionConfig>
  ): Promise<DecisionResult> {
    const template = this.templates.fill(templateId, variables)
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }

    return this.runDecision({
      question: template.question,
      templateId,
      templateVariables: variables,
      autoScheduleFollowUp: true,
      ...options,
    })
  }

  /**
   * Quick decision - minimal config, maximum automation
   */
  async quickDecision(question: string): Promise<DecisionResult> {
    return this.runDecision({
      question,
      includeBoardSimulation: true,
      autoScheduleFollowUp: true,
    })
  }

  // ==========================================================================
  // OUTCOME TRACKING
  // ==========================================================================

  /**
   * Record the outcome of a decision
   * This triggers risk updates and follow-up completions
   */
  recordOutcome(
    decisionId: string,
    outcome: Omit<DecisionOutcome, 'decisionId' | 'reviewedAt'>
  ): void {
    // 1. Update decision history
    this.history.recordOutcome({ ...outcome, decisionId })

    // 2. Update related risks based on outcome
    this.updateRisksFromOutcome(decisionId, outcome)

    // 3. Complete any pending follow-ups for this decision
    const pending = this.followUps.getPending().filter(f => f.decisionId === decisionId)
    for (const followUp of pending) {
      const outcomeStatus = outcome.status === 'successful' ? 'on_track' : 'needs_attention'
      this.followUps.complete(followUp.id, outcomeStatus)
    }

    // 4. If failed, extract lessons as new risks
    if (outcome.status === 'failed' && outcome.lessonsLearned) {
      const decisionsWithOutcome = this.history.getAll()
        .filter(d => d.id === decisionId)
      this.risks.extractFromDecisions(decisionsWithOutcome)
    }
  }

  // ==========================================================================
  // COMPONENT ACCESS
  // ==========================================================================

  /** Get company context store */
  getContext(): CompanyContextStore { return this.context }

  /** Get template engine */
  getTemplates(): TemplateEngine { return this.templates }

  /** Get team pulse system */
  getTeamPulse(): TeamPulse { return this.teamPulse }

  /** Get decision history */
  getHistory(): DecisionHistory { return this.history }

  /** Get risk dashboard */
  getRisks(): RiskDashboard { return this.risks }

  /** Get follow-up tracker */
  getFollowUps(): FollowUpTracker { return this.followUps }

  // ==========================================================================
  // DASHBOARD & STATS
  // ==========================================================================

  /** Get system-wide statistics */
  getStats(): ForumStats {
    const decisions = this.history.getAll()
    const now = new Date()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const decisionsThisMonth = decisions.filter(
      d => d.createdAt > monthAgo
    ).length

    const riskSummary = this.risks.getSummary()
    const followUpSummary = this.followUps.getSummary()

    // Calculate average confidence from decisions
    const avgConfidence = decisions.length > 0
      ? decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length
      : 0

    return {
      totalDecisions: decisions.length,
      decisionsThisMonth,
      openFollowUps: followUpSummary.pending + followUpSummary.overdue,
      criticalRisks: riskSummary.byLevel.critical,
      teamParticipation: this.teamPulse.getMembers().length,
      averageConfidence: avgConfidence,
    }
  }

  /** Get critical alerts requiring attention */
  getAlerts(): { type: string; message: string; severity: 'info' | 'warning' | 'critical' }[] {
    const alerts: { type: string; message: string; severity: 'info' | 'warning' | 'critical' }[] = []

    // Critical risks
    const criticalRisks = this.risks.getCriticalAlerts()
    for (const risk of criticalRisks) {
      alerts.push({
        type: 'risk',
        message: `Riesgo crítico: ${risk.title}`,
        severity: 'critical',
      })
    }

    // Overdue follow-ups
    const overdue = this.followUps.getOverdue()
    for (const followUp of overdue) {
      alerts.push({
        type: 'followup',
        message: `Revisión pendiente: ${followUp.title}`,
        severity: 'warning',
      })
    }

    // Pending follow-ups (due soon)
    const pending = this.followUps.getPending().slice(0, 3)
    for (const followUp of pending) {
      alerts.push({
        type: 'followup',
        message: `Próxima revisión: ${followUp.title}`,
        severity: 'info',
      })
    }

    return alerts.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 }
      return order[a.severity] - order[b.severity]
    })
  }

  /** Get similar past decisions for context */
  findSimilarDecisions(question: string, limit = 5): Decision[] {
    return this.history.findSimilar(question, limit)
  }

  /** Suggest template based on question */
  suggestTemplate(question: string): string | null {
    const suggestion = this.templates.suggest(question)
    return suggestion?.id ?? null
  }

  // ==========================================================================
  // DEBATE ARENA (Multi-decision comparison)
  // ==========================================================================

  /**
   * Compare multiple past decisions to find patterns and contradictions
   */
  async compareDecisions(decisionIds: string[]): Promise<ComparisonResult> {
    const decisions = this.history.getAll().filter(d => decisionIds.includes(d.id))
    if (decisions.length < 2) {
      throw new Error('Need at least 2 decisions to compare')
    }

    const entries: DebateEntry[] = decisions.map(d => ({
      id: d.id,
      question: d.question,
      conclusion: d.conclusion,
      confidence: d.confidence / 100,
      arguments: d.reasoning ? [d.reasoning] : [],
      timestamp: d.createdAt,
    }))

    return this.arena.compareDebates(entries)
  }

  /**
   * Run a meta-debate between competing decisions
   */
  async metaDebate(decisionIds: string[]): Promise<MetaDebateResult> {
    const decisions = this.history.getAll().filter(d => decisionIds.includes(d.id))
    if (decisions.length < 2) {
      throw new Error('Need at least 2 decisions for meta-debate')
    }

    const entries: DebateEntry[] = decisions.map(d => ({
      id: d.id,
      question: d.question,
      conclusion: d.conclusion,
      confidence: d.confidence / 100,
      arguments: d.reasoning ? [d.reasoning] : [],
      timestamp: d.createdAt,
    }))

    const context: DebateContext = {
      originalQuestion: decisions[0]?.question ?? 'Comparison',
      companyContext: this.context.getPromptContext(),
    }

    return this.arena.metaDebate(entries, context)
  }

  /**
   * Quick comparison of two decisions
   */
  async quickCompare(decisionId1: string, decisionId2: string): Promise<string> {
    const decisions = this.history.getAll().filter(d =>
      d.id === decisionId1 || d.id === decisionId2
    )
    if (decisions.length !== 2) {
      throw new Error('Both decisions must exist')
    }

    const [d1, d2] = decisions as [Decision, Decision]
    return this.arena.quickCompare(
      { id: d1.id, question: d1.question, conclusion: d1.conclusion, confidence: d1.confidence / 100, arguments: [], timestamp: d1.createdAt },
      { id: d2.id, question: d2.question, conclusion: d2.conclusion, confidence: d2.confidence / 100, arguments: [], timestamp: d2.createdAt }
    )
  }

  /** Get debate arena for advanced operations */
  getArena(): DebateArena { return this.arena }

  // ==========================================================================
  // MENTOR ADVICE
  // ==========================================================================

  /**
   * Get advice from a specific mentor type
   */
  async getMentorAdvice(question: string, mentorType: MentorType): Promise<MentorAdvice> {
    const context: DebateContext = {
      originalQuestion: question,
      companyContext: this.context.getPromptContext(),
    }
    return this.mentorEngine.getAdvice(question, mentorType, context)
  }

  /**
   * Get advice from all mentors (YC, VC, Bootstrap, Serial)
   */
  async getAllMentorAdvice(question: string): Promise<MentorAdvice[]> {
    const context: DebateContext = {
      originalQuestion: question,
      companyContext: this.context.getPromptContext(),
    }
    return this.mentorEngine.getAllMentorAdvice(question, context)
  }

  /**
   * Quick mock mentor advice (no API call)
   */
  getMockMentorAdvice(mentorType: MentorType): MentorAdvice {
    return getMockMentorAdvice(mentorType)
  }

  /** Get mentor engine for advanced operations */
  getMentorEngine(): MentorEngine { return this.mentorEngine }

  // ==========================================================================
  // VISUALIZATION
  // ==========================================================================

  /**
   * Generate a Mermaid diagram of a debate structure
   */
  async visualizeMermaid(question: string): Promise<string> {
    const analysis = await selectStrategy(question)
    return toMermaid(analysis.structure, analysis.recommendedPattern)
  }

  /**
   * Generate an ASCII tree of a debate structure
   */
  async visualizeAscii(question: string): Promise<string> {
    const analysis = await selectStrategy(question)
    return toAsciiTree(analysis.structure, analysis.recommendedPattern)
  }

  /**
   * Generate JSON for external visualization tools
   */
  async visualizeJson(question: string): Promise<ReturnType<typeof toVisualizationJson>> {
    const analysis = await selectStrategy(question)
    return toVisualizationJson(analysis.structure, analysis.recommendedPattern, question)
  }

  /**
   * Visualize a specific debate structure
   */
  visualizeStructure(
    structure: DebateStructure,
    pattern: PatternType,
    format: 'mermaid' | 'ascii' | 'json',
    question = 'Debate'
  ): string | ReturnType<typeof toVisualizationJson> {
    switch (format) {
      case 'mermaid':
        return toMermaid(structure, pattern)
      case 'ascii':
        return toAsciiTree(structure, pattern)
      case 'json':
        return toVisualizationJson(structure, pattern, question)
    }
  }

  // ==========================================================================
  // PATTERN ANALYSIS (from DebateOrchestrator)
  // ==========================================================================

  /**
   * Analyze a question and get strategy recommendation
   */
  async analyzeQuestion(question: string): Promise<StrategyAnalysis> {
    return selectStrategy(question, this.orchestrationConfig)
  }

  /**
   * Get pattern recommendation for a question
   */
  async recommendPattern(question: string): Promise<PatternRecommendation> {
    const analysis = await selectStrategy(question, this.orchestrationConfig)
    return {
      pattern: analysis.recommendedPattern,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      alternatives: analysis.alternativePatterns,
    }
  }

  // ==========================================================================
  // EXECUTIVE INSIGHTS (from ExecutiveOrchestrator)
  // ==========================================================================

  /**
   * Generate executive summary for a question
   */
  async getExecutiveSummary(
    question: string,
    pattern?: PatternType
  ): Promise<ExecutiveSummary> {
    const configOverride = pattern
      ? { ...this.orchestrationConfig, patternMode: 'manual' as const, preferredPattern: pattern }
      : this.orchestrationConfig

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
      ? { ...this.orchestrationConfig, patternMode: 'manual' as const, preferredPattern: pattern }
      : this.orchestrationConfig

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
      ? { ...this.orchestrationConfig, patternMode: 'manual' as const, preferredPattern: pattern }
      : this.orchestrationConfig

    const analysis = await selectStrategy(question, configOverride)

    const summary = generateExecutiveSummary(question, analysis)
    const board = simulateBoardAdvisors(question, analysis)

    return {
      question,
      pattern: analysis.recommendedPattern,
      summary,
      board,
      onePager: this.generateOnePager(question, summary, board),
      generatedAt: new Date().toISOString(),
    }
  }

  /**
   * Generate decision scorecard with weighted dimensions
   */
  async getDecisionScorecard(question: string): Promise<DecisionScorecard> {
    const analysis = await selectStrategy(question, this.orchestrationConfig)
    const summary = generateExecutiveSummary(question, analysis)

    const overallScore = this.calculateOverallScore(summary)

    return {
      question,
      overallScore,
      dimensions: [
        { name: 'Confianza', score: summary.confidence.score, weight: 0.25 },
        { name: 'Reversibilidad', score: summary.reversibility.score, weight: 0.15 },
        { name: 'Oportunidad', score: this.calculateOppScore(summary.opportunities), weight: 0.25 },
        { name: 'Riesgo (inverso)', score: 100 - this.calculateRiskScore(summary.risks), weight: 0.20 },
        { name: 'Urgencia', score: this.calculateUrgencyScore(summary.costOfDelay), weight: 0.15 },
      ],
      recommendation: summary.recommendation,
      verdict: this.getVerdict(overallScore),
    }
  }

  /**
   * Quick executive snapshot
   */
  async getSnapshot(question: string): Promise<ExecutiveSnapshot> {
    const analysis = await selectStrategy(question, this.orchestrationConfig)
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
      verdict: this.getVerdict(summary.confidence.score),
    }
  }

  // ==========================================================================
  // CONFIG HELPERS (from DebateOrchestrator)
  // ==========================================================================

  /**
   * Set manual mode with specific pattern
   */
  setManualMode(pattern: PatternType): this {
    this.orchestrationConfig = {
      ...this.orchestrationConfig,
      patternMode: 'manual',
      preferredPattern: pattern,
    }
    return this
  }

  /**
   * Set auto mode for pattern selection
   */
  setAutoMode(): this {
    this.orchestrationConfig = {
      ...this.orchestrationConfig,
      patternMode: 'auto',
      preferredPattern: undefined,
    }
    return this
  }

  /**
   * Set cost limits
   */
  setCostLimits(maxCost: number, warnAt?: number): this {
    this.orchestrationConfig = {
      ...this.orchestrationConfig,
      maxTotalCost: maxCost,
      warnAtCost: warnAt ?? maxCost * 0.7,
    }
    return this
  }

  /**
   * Set quality thresholds
   */
  setQualityThresholds(minQuality: number, maxIterations?: number): this {
    this.orchestrationConfig = {
      ...this.orchestrationConfig,
      minQualityThreshold: minQuality,
      maxIterations: maxIterations ?? 3,
    }
    return this
  }

  /**
   * Get current orchestration config
   */
  getOrchestrationConfig(): OrchestrationConfig {
    return { ...this.orchestrationConfig }
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private generateOnePager(question: string, summary: ExecutiveSummary, board: BoardVote): string {
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

  private calculateOverallScore(summary: ExecutiveSummary): number {
    const confidence = summary.confidence.score * 0.3
    const reversibility = summary.reversibility.score * 0.15
    const oppScore = this.calculateOppScore(summary.opportunities) * 0.25
    const riskScore = (100 - this.calculateRiskScore(summary.risks)) * 0.2
    const urgencyScore = this.calculateUrgencyScore(summary.costOfDelay) * 0.1

    return Math.round(confidence + reversibility + oppScore + riskScore + urgencyScore)
  }

  private calculateOppScore(opportunities: ExecutiveSummary['opportunities']): number {
    if (opportunities.length === 0) return 50
    const impactScores: Record<string, number> = { low: 25, medium: 50, high: 75, transformative: 100 }
    const avg = opportunities.reduce((s, o) => s + (impactScores[o.impact] ?? 50), 0) / opportunities.length
    return Math.round(avg)
  }

  private calculateRiskScore(risks: ExecutiveSummary['risks']): number {
    if (risks.length === 0) return 0
    const severityScores: Record<string, number> = { low: 15, medium: 35, high: 65, critical: 90 }
    const avg = risks.reduce((s, r) => s + (severityScores[r.severity] ?? 35) * r.probability, 0) / risks.length
    return Math.round(avg)
  }

  private calculateUrgencyScore(costOfDelay: ExecutiveSummary['costOfDelay']): number {
    const scores: Record<string, number> = { low: 30, medium: 50, high: 75, critical: 95 }
    return scores[costOfDelay.urgencyLevel] ?? 50
  }

  private getVerdict(score: number): DecisionScorecard['verdict'] {
    if (score >= 75) return 'proceed'
    if (score >= 55) return 'proceed_with_caution'
    if (score >= 35) return 'reconsider'
    return 'reject'
  }

  private enrichQuestionWithContext(question: string): string {
    const ctx = this.context.getContext()
    if (!ctx?.profile.name) return question

    // Add company context to the question
    const contextParts: string[] = []
    if (ctx.profile.stage) contextParts.push(`Etapa: ${ctx.profile.stage}`)
    if (ctx.profile.industry) contextParts.push(`Industria: ${ctx.profile.industry}`)
    if (ctx.metrics?.mrr) contextParts.push(`MRR: €${ctx.metrics.mrr.toLocaleString()}`)
    if (ctx.metrics?.customers) contextParts.push(`Clientes: ${ctx.metrics.customers}`)

    if (contextParts.length === 0) return question

    return `[Contexto: ${ctx.profile.name} - ${contextParts.join(', ')}]\n\n${question}`
  }

  private async runDebate(
    question: string,
    additionalContext?: string
  ): Promise<AISubDebateResult> {
    // Create a simple debate structure
    const debate: SubDebate = {
      id: `debate-${Date.now()}`,
      question,
      context: additionalContext,
      inheritContext: false,
      estimatedCost: 0.05,
      estimatedTimeMinutes: 5,
    }

    const context: DebateContext = {
      originalQuestion: question,
      companyContext: this.context.getPromptContext(),
    }

    // Run through AI debate engine
    return this.debateEngine.executeDebate(debate, context)
  }

  private collectTeamInput(
    question: string,
    options?: string[]
  ): PollResults {
    const pollOptions = options ?? ['Aprobar', 'Rechazar', 'Necesito más info']
    const poll = this.teamPulse.createPoll(question, pollOptions)

    // Return current results (in real use, would wait for votes)
    return this.teamPulse.getResults(poll.id)
  }

  private extractAndTrackRisks(insights: ExecutiveSummary, decisionId: string): Risk[] {
    const newRisks: Risk[] = []

    for (const riskItem of insights.risks) {
      const risk = this.risks.addRisk({
        title: riskItem.description.substring(0, 50),
        description: riskItem.description,
        category: 'strategic',
        level: riskItem.severity === 'high' ? 'high' : riskItem.severity === 'medium' ? 'medium' : 'low',
        probability: Math.round(riskItem.probability * 10),
        impact: riskItem.severity === 'high' ? 8 : riskItem.severity === 'medium' ? 5 : 3,
        status: 'identified',
        relatedDecisions: [decisionId],
        mitigations: riskItem.mitigation ? [riskItem.mitigation] : undefined,
      })
      newRisks.push(risk)
    }

    return newRisks
  }

  private updateRisksFromOutcome(
    decisionId: string,
    outcome: Omit<DecisionOutcome, 'decisionId' | 'reviewedAt'>
  ): void {
    // Find risks related to this decision
    const relatedRisks = this.risks.getAll().filter(
      r => r.relatedDecisions?.includes(decisionId)
    )

    for (const risk of relatedRisks) {
      if (outcome.status === 'successful') {
        // Reduce probability for successful outcomes
        this.risks.updateRisk(risk.id, {
          probability: Math.max(1, risk.probability - 2),
          status: risk.probability <= 3 ? 'resolved' : 'mitigating',
        })
      } else if (outcome.status === 'failed') {
        // Increase impact for failed outcomes
        this.risks.updateRisk(risk.id, {
          impact: Math.min(10, risk.impact + 2),
        })
      }
    }
  }

  private inferCategory(question: string): DecisionCategory {
    const q = question.toLowerCase()
    if (q.includes('contratar') || q.includes('equipo') || q.includes('talento')) return 'hiring'
    if (q.includes('precio') || q.includes('pricing')) return 'pricing'
    if (q.includes('marketing') || q.includes('campaña')) return 'marketing'
    if (q.includes('producto') || q.includes('feature')) return 'product'
    if (q.includes('inversión') || q.includes('funding')) return 'finance'
    if (q.includes('operacion') || q.includes('proceso')) return 'operations'
    return 'strategic'
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a fully configured Forum System
 */
export function createQuoorumSystem(config: QuoorumSystemConfig = {}): QuoorumSystem {
  return new QuoorumSystem(config)
}

/**
 * Create Forum System with mock AI for testing
 */
export function createTestQuoorumSystem(): QuoorumSystem {
  return new QuoorumSystem({
    teamMembers: [
      { id: 'ceo', name: 'CEO', role: 'CEO', weight: 3 },
      { id: 'cto', name: 'CTO', role: 'CTO', weight: 2 },
      { id: 'cfo', name: 'CFO', role: 'CFO', weight: 2 },
    ],
  })
}
