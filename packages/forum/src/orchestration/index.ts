/**
 * Orchestration Module
 *
 * Exports for the debate orchestration system.
 *
 * ⚠️ IMPORTANT: Use ForumSystem as the unified entry point for all features.
 * The legacy exports (DebateOrchestrator, ExecutiveOrchestrator) are deprecated
 * and will be removed in a future version.
 */

// ============================================================================
// UNIFIED API (RECOMMENDED) - Use ForumSystem for everything
// ============================================================================

// Forum System (Unified Integration Layer) - PRIMARY ENTRY POINT
export { ForumSystem, createForumSystem, createTestForumSystem } from './forum-system'
export type {
  ForumSystemConfig,
  DecisionConfig,
  DecisionResult,
  ForumStats,
  ExecutiveBriefing,
  DecisionScorecard,
  ExecutiveSnapshot,
  PatternRecommendation,
} from './forum-system'

// ============================================================================
// MODULES (All integrated into ForumSystem, but exposed for direct access)
// ============================================================================

// Company Context Store
export { CompanyContextStore, createCompanyContext, createStartupContext } from './company-context'
export type {
  CompanyProfile,
  CompanyMetrics,
  Competitor,
  MarketContext,
  StrategicContext,
  CompanyContext,
} from './company-context'

// Decision History
export { DecisionHistory, createDecisionHistory } from './decision-history'
export type {
  Decision,
  DecisionOutcome,
  DecisionWithOutcome,
  DecisionStats,
  DecisionStatus,
  DecisionCategory,
  DecisionSearchOptions,
} from './decision-history'

// Debate Templates
export { TemplateEngine, createTemplateEngine, DEBATE_TEMPLATES } from './debate-templates'
export type {
  DebateTemplate,
  FilledTemplate,
  TemplateCategory,
} from './debate-templates'

// Team Pulse (Voting)
export { TeamPulse, createTeamPulse } from './team-pulse'
export type {
  TeamMember,
  Vote,
  PollOption,
  TeamPoll,
  PollResults,
  TeamSentiment,
} from './team-pulse'

// Risk Dashboard
export { RiskDashboard, createRiskDashboard } from './risk-dashboard'
export type {
  Risk,
  RiskLevel,
  RiskCategory,
  RiskTrend,
  RiskSummary,
  RiskMatrix,
} from './risk-dashboard'

// Follow-up Tracker
export { FollowUpTracker, createFollowUpTracker } from './follow-up-tracker'
export type {
  FollowUp,
  FollowUpStatus,
  FollowUpType,
  FollowUpSchedule,
  FollowUpSummary,
  ReviewTemplate,
} from './follow-up-tracker'

// Debate Arena (Multi-debate comparison & meta-debates)
export { DebateArena, createDebateArena } from './debate-arena'
export type {
  DebateEntry,
  DebateGroup,
  ComparisonResult,
  ContradictionItem,
  MetaDebateResult,
} from './debate-arena'

// Mentor Modes (YC, VC, Bootstrapper, etc.)
export {
  MentorEngine,
  MENTOR_PROFILES,
  getMockMentorAdvice,
} from './mentor-modes'
export type {
  MentorType,
  MentorProfile,
  MentorAdvice,
} from './mentor-modes'

// ============================================================================
// AI INFRASTRUCTURE
// ============================================================================

// AI Debate Engine (LLM-powered debates)
export {
  AIDebateEngine,
  createDebateEngine,
  createMockDebateEngine,
  DEFAULT_PERSONAS,
  MockAIProvider,
} from './ai-debate-engine'
export type {
  AIProvider,
  GenerateOptions,
  DebateContext,
  DebaterPersona,
  DevilsAdvocateResult,
  PreMortemResult,
  GutCheckResult,
} from './ai-debate-engine'

// AI Providers (LiteLLM, OpenAI, Anthropic, Gemini, Groq)
export {
  LiteLLMProvider,
  OpenAIProvider,
  AnthropicProvider,
  GeminiProvider,
  GroqProvider,
  createProvider,
  getDefaultProvider,
  hasRealProvider,
} from './ai-providers'
export type { ProviderType } from './ai-providers'

// ============================================================================
// INTERNAL UTILITIES (Exposed for advanced use cases)
// ============================================================================

// Strategy selection
export { selectStrategy, detectSignals, getAvailablePatterns } from './strategy-selector'

// Flow execution
export { executeStructure, estimateCost, estimateTime, cancelSequence } from './flow-executor'

// Visualization
export { toMermaid, toAsciiTree, toVisualizationJson } from './visualization'

// Executive Insights (used internally by ForumSystem)
export {
  generateExecutiveSummary,
  simulateBoardAdvisors,
} from './executive-insights'
export type {
  ExecutiveSummary,
  ConfidenceScore,
  RiskItem,
  OpportunityItem,
  StakeholderImpact,
  CostOfDelay,
  ReversibilityScore,
  BoardAdvisor,
  BoardVote,
  AdvisorRole,
} from './executive-insights'

// Types
export type {
  PatternType,
  StrategyAnalysis,
  QuerySignal,
  SignalType,
  DebateStructure,
  DebatePhase,
  SubDebate,
  SubDebateResult,
  PhaseResult,
  DebateSequence,
  FinalConclusion,
  OrchestrationConfig,
  OrchestrationCallbacks,
  BranchCondition,
  RankedOption,
  SequenceStatus,
} from './types'

export { DEFAULT_ORCHESTRATION_CONFIG } from './types'

// ============================================================================
// DEPRECATED EXPORTS - Will be removed in next major version
// Use ForumSystem instead for all these features
// ============================================================================

/**
 * @deprecated Use ForumSystem.analyzeQuestion() instead
 */
export { analyzeQuestion } from './debate-sequence'

/**
 * @deprecated Use createForumSystem() and forum.runDecision() instead
 */
export { runOrchestrated } from './debate-sequence'

/**
 * @deprecated Use ForumSystem.recommendPattern() instead
 */
export { recommendPattern } from './debate-sequence'

/**
 * @deprecated Use getAvailablePatterns() instead
 */
export { listPatterns } from './debate-sequence'

/**
 * @deprecated Use ForumSystem.setManualMode() instead
 */
export { manualModeConfig } from './debate-sequence'

/**
 * @deprecated Use ForumSystem.setAutoMode() instead
 */
export { autoModeConfig } from './debate-sequence'

/**
 * @deprecated Use ForumSystem.setCostLimits() instead
 */
export { costLimitedConfig } from './debate-sequence'

/**
 * @deprecated Use ForumSystem.setQualityThresholds() instead
 */
export { qualityConfig } from './debate-sequence'

// Callback helpers (still useful for debugging)
export { consoleCallbacks, collectingCallbacks } from './debate-sequence'

/**
 * @deprecated Use createForumSystem() instead
 * ForumSystem provides all DebateOrchestrator features plus:
 * - Company context integration
 * - Decision history tracking
 * - Team voting
 * - Risk dashboard
 * - Follow-up scheduling
 */
export { DebateOrchestrator, createOrchestrator } from './debate-sequence'

/**
 * @deprecated Use ForumSystem methods instead:
 * - getExecutiveSummary() → forum.getExecutiveSummary()
 * - getBoardDeliberation() → forum.getBoardDeliberation()
 * - getExecutiveBriefing() → forum.getExecutiveBriefing()
 * - getDecisionScorecard() → forum.getDecisionScorecard()
 * - getSnapshot() → forum.getSnapshot()
 */
export { ExecutiveOrchestrator, createExecutiveOrchestrator } from './orchestrator-executive'
