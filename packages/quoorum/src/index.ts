/**
 * @quoorum/quoorum
 *
 * Sistema de deliberacion multi-agente para decisiones estrategicas
 */

// Types
export type {
  AgentRole,
  AIProviderType,
  AgentConfig,
  SessionStatus,
  CreateSessionInput,
  DebateMessage,
  RankedOption,
  ConsensusResult,
  ContextSourceType,
  ContextSource,
  LoadedContext,
  DebateRound,
  DebateResult,
} from './types'

export { CreateSessionSchema, RankedOptionSchema, ConsensusResultSchema } from './types'

// Agents
export {
  QUOORUM_AGENTS,
  AGENT_ORDER,
  getAgent,
  getAgentsByRole,
  getAllAgents,
  getAgentName,
  estimateAgentCost,
  estimateDebateCost,
} from './agents'

// Ultra-Optimized Language
export {
  ULTRA_OPTIMIZED_PROMPT,
  TRANSLATION_PROMPT,
  INPUT_COMPRESSION_PROMPT,
  estimateTokens,
  EMOJI_MAP,
  REVERSE_EMOJI_MAP,
  ROLE_EMOJI,
  getRoleEmoji,
  compressInput,
  decompressOutput,
} from './ultra-language'

// Runner (re-exported from separate file)
export { runDebate, executeRound, generateAgentResponse } from './runner'

// Dynamic Runner (with quality monitoring and meta-moderation)
export { runDebate as runDynamicDebate } from './runner-dynamic'
export type { RunDebateOptions as DynamicDebateOptions, CorporateContext } from './runner-dynamic'

// Dynamic Expert System
export { analyzeQuestion } from './question-analyzer'
export { matchExperts, validateMatching } from './expert-matcher'
export { matchExpertsWithAI } from './ai-expert-matcher'
export { matchDepartmentsWithAI } from './ai-department-matcher'
export { matchWorkersWithAI } from './ai-worker-matcher'
export { EXPERT_DATABASE, getExpertsByIds, getExpertsByExpertise, getAllExperts, getExpert } from './expert-database'
export { analyzeDebateQuality, detectPrematureConsensus, summarizeQuality } from './quality-monitor'
export {
  shouldIntervene,
  generateIntervention,
  generateMultipleInterventions,
  getInterventionFrequency,
  summarizeIntervention,
  wasInterventionEffective,
} from './meta-moderator'

// Cost Control (iMAD)
export { shouldStopDebate, getIMADConfigForTier, DEFAULT_IMAD_CONFIG } from './cost-control/imad'
export type { IMADConfig, IMADResult } from './cost-control/imad'

// Governance (Decision Evidence)
export {
  generateDecisionEvidence,
  verifyDebateIntegrity,
  exportEvidenceAsJSON,
  exportEvidenceAsCertificate,
} from './governance/decision-evidence'
export type { DecisionEvidence, AuditEvent, ComplianceMapping } from './governance/decision-evidence'

// Voting Systems
export {
  calculateQuadraticVote,
  calculatePointsVote,
  DEFAULT_QUADRATIC_VOTING_CONFIG,
} from './voting/quadratic-voting'
export type {
  QuadraticVote,
  QuadraticVotingConfig,
  QuadraticVotingResult,
} from './voting/quadratic-voting'

// Dynamic System Types
export type { QuestionAnalysis, KnowledgeArea, Topic } from './question-analyzer'
export type { ExpertProfile } from './expert-database'
export type { ExpertMatch, MatchingOptions } from './expert-matcher'
export type { AIExpertMatch, AIExpertMatchingOptions } from './ai-expert-matcher'
export type { AIDepartmentMatch, AIDepartmentMatchingOptions } from './ai-department-matcher'
export type { AIWorkerMatch, AIWorkerMatchingOptions } from './ai-worker-matcher'
export type { QualityAnalysis, QualityIssue, MonitoringOptions } from './quality-monitor'
export type { ModeratorIntervention, ModerationType } from './meta-moderator'

// Consensus (re-exported from separate file)
export { checkConsensus, rankOptions, calculateConsensusScore } from './consensus'

// Context Loader (re-exported from separate file)
export { loadContext, loadRepoContext, searchInternet } from './context-loader'

// Configuration
export { getConfig, updateConfig, resetConfig, validateConfig, applyPreset, CONFIG_PRESETS } from './config'
export type { ForumConfig } from './config'

// Helpers
export {
  getDebateMode,
  getRecommendedExperts,
  getPrimaryExperts,
  getCriticExpert,
  getQuestionInsights,
  validateQuestion,
  validateContext,
  formatCost,
  formatScore,
  formatComplexity,
} from './helpers'
export type {
  DebateModeInfo,
  ExpertPreview,
  CostEstimate,
  QuestionInsights,
  ValidationResult,
} from './helpers'

// Validation
export {
  validateQuestionStrict,
  validateContextStrict,
  validateSessionId,
  validateRunDebateInput,
  sanitizeQuestion,
  sanitizeContext,
  ValidationError,
} from './validation'

// Logger
export { quoorumLogger, QuoorumLogger } from './logger'
export { quoorumLogger as logger } from './logger' // Alias para compatibilidad

// Metrics
export { metrics, Timer, measure, measureSync, generateReport } from './metrics'
export type { Metric, MetricHandler } from './metrics'

// Enhancements
export {
  generateAutoSummary,
  formatSummary,
  analyzeSentiment,
  calculateConfidenceScores,
  calculateBadges,
  generateLeaderboard,
  predictOutcome,
  scoreQuestionQuality,
  generateFollowUpQuestions,
} from './enhancements'
export type {
  DebateSummary,
  SentimentAnalysis,
  ConfidenceScore,
  Badge,
  BadgeType,
  ExpertStats,
  OutcomePrediction,
  QuestionQuality,
} from './enhancements'

// ============================================================================
// VISUALIZATIONS & INTERACTIVE FEATURES
// ============================================================================

export { visualizations } from './visualizations'
export { interactive } from './interactive'

// ============================================================================
// OMG FEATURES (EPIC ADDITIONS)
// ============================================================================

export { omgVisuals } from './omg-visuals'
export { omgAI } from './omg-ai'
export { omgSocial } from './omg-social'
export { omgAnalytics } from './omg-analytics'

// ============================================================================
// LEARNING SYSTEM & OPTIMIZATION
// ============================================================================

// Learning System
export {
  updateExpertPerformance,
  getExpertPerformance,
  getLearningInsights,
  calculateChemistry,
  recommendExpertCombination,
  adjustMatchingScores,
  identifySpecializations,
  analyzeABTest,
} from './learning-system'
export type {
  ExpertPerformanceMetrics,
  LearningInsights,
  ABTestConfig,
} from './learning-system'

// Question Similarity
export {
  findSimilarDebates,
  generateQuestionEmbedding,
  cosineSimilarity,
  extractTopics,
  recommendDebates,
} from './question-similarity'
export type { SimilarDebate } from './question-similarity'

// Caching
export {
  generateCacheKey,
  getCachedDebate,
  cacheDebate,
  getCacheStats,
  clearExpiredCache,
  invalidateCache,
  clearAllCache,
  cacheExpertResponse,
  getCachedExpertResponse,
  cacheEmbedding,
  getCachedEmbedding,
  preloadCommonQuestions,
  getCacheRecommendations,
} from './caching'
export type { CacheEntry, CacheStats } from './caching'

// WebSocket Server
export { QuoorumWebSocketServer, getWebSocketServer, broadcastDebateUpdate } from './websocket-server'
export { QuoorumWebSocketServer as ForumWebSocketServer } from './websocket-server' // Backwards compatibility
export type { DebateUpdate } from './websocket-server'

// PDF Export
export { generateDebatePDF, generateDebateMarkdown } from './pdf-export'
export type { PDFExportOptions } from './pdf-export'

// Argument Intelligence
export {
  buildArgumentTree,
  filterNodesByExpert,
  filterNodesByType,
  filterNodesByStrength,
} from './argument-intelligence'
export type { ArgumentNode, ArgumentEdge, ArgumentTree } from './argument-intelligence'

// Consensus Timeline
export { generateConsensusTimeline } from './visualizations/consensus-timeline'
export type { ConsensusPoint } from './visualizations/consensus-timeline'

// Advanced Export
export { exportDebate } from './export'
export type { ExportFormat, ExportOptions } from './export'

// Notifications
export {
  notifyDebateComplete,
  notifyQualityIssue,
  notifyIntervention,
} from './notifications'
export type {
  NotificationOptions,
  EmailNotificationData,
  InAppNotificationData,
  PushNotificationData,
} from './notifications'

// Templates
export {
  ALL_TEMPLATES,
  SAAS_TEMPLATES,
  STARTUP_TEMPLATES,
  ECOMMERCE_TEMPLATES,
  MARKETPLACE_TEMPLATES,
  CREATOR_TEMPLATES,
  getTemplatesByIndustry,
  getTemplatesByCategory,
  getTemplateById,
  searchTemplates,
  getAllIndustries,
  getAllCategories,
} from './templates'
export type { DebateTemplate } from './templates'

// Rate Limiting
export {
  checkRateLimit,
  incrementDebateCounter,
  decrementConcurrentDebates,
  addDebateCost,
  getRateLimitStatus,
  resetRateLimits,
  getAllRateLimitData,
} from './rate-limiting'
export type { RateLimitStatus } from './rate-limiting'

// ============================================================================
// ORCHESTRATION SYSTEM (Multi-Pattern Debates)
// ============================================================================

export {
  // ========== UNIFIED API (RECOMMENDED) ==========
  // QuoorumSystem is the unified entry point for all orchestration features
  QuoorumSystem,
  createQuoorumSystem,
  createTestQuoorumSystem,
  // ========== LEGACY (DEPRECATED) ==========
  // Use QuoorumSystem instead - these will be removed in next major version
  DebateOrchestrator,
  createOrchestrator,
  runOrchestrated,
  recommendPattern,
  listPatterns,
  // Config helpers
  manualModeConfig,
  autoModeConfig,
  costLimitedConfig,
  qualityConfig,
  // Callback helpers
  consoleCallbacks,
  collectingCallbacks,
  // Strategy selection
  selectStrategy,
  getAvailablePatterns,
  detectSignals,
  // Flow execution
  executeStructure,
  estimateCost,
  estimateTime,
  cancelSequence,
  // Default config
  DEFAULT_ORCHESTRATION_CONFIG,
} from './orchestration'

export type {
  // QuoorumSystem types
  QuoorumSystemConfig,
  DecisionConfig,
  DecisionResult,
  ForumStats,
  ExecutiveBriefing,
  DecisionScorecard,
  ExecutiveSnapshot,
  PatternRecommendation,
  // Legacy types
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
  SequenceStatus,
} from './orchestration'

// ============================================================================
// BILLING & CREDIT SYSTEM
// ============================================================================

export {
  deductCredits,
  refundCredits,
  addCredits,
  getCreditBalance,
  hasSufficientCredits,
} from './billing/credit-transactions'
export type { CreditDeductionResult, CreditRefundResult, CreditAddResult } from './billing/credit-transactions'

export { convertUsdToCredits, trackCredits, CREDIT_MULTIPLIER, USD_PER_CREDIT } from './analytics/cost'
export {
  estimateContextPhaseCost,
  estimateExpertSelectionPhaseCost,
  estimateStrategyPhaseCost,
  estimateDebateExecutionCost,
  calculateTotalAccumulatedCost,
} from './analytics/phase-cost-estimator'
export type { PhaseCostConfig, PhaseCostEstimate } from './analytics/phase-cost-estimator'

// ============================================================================
// NARRATIVE SYSTEM (Theme Engine & Dynamic Identities)
// ============================================================================

export {
  // Theme Engine - Dynamic narrative identity assignment
  selectTheme,
  assignIdentity,
  assignDebateIdentities,
  // Theme Registry
  AVAILABLE_THEMES,
  getCharacterByRole,
} from './narrative/theme-engine'

export type {
  ThemeSelection,
  AssignedIdentity,
  NarrativeCharacter,
  NarrativeTheme,
} from './narrative/theme-engine'

// ============================================================================
// ROUTER ENGINE (Conditional Workflow System)
// ============================================================================

export {
  determineAgentOrder,
  detectDebateCondition,
  getActiveRuleDescription,
  DEBATE_ROUTER_CONFIG,
} from './router-engine'

export type {
  RouterCondition,
  RouterRule,
  RouterConfig,
} from './types'

// ============================================================================
// FINAL SYNTHESIS (Executive Summary Generator)
// ============================================================================

export {
  generateFinalSynthesis,
  extractSynthesisInsights,
  type FinalSynthesisResult,
} from './final-synthesis'

export type {
  FinalSynthesis,
  FinalSynthesisOption,
} from './types'

// ============================================================================
// CORPORATE INTELLIGENCE (Company Context System)
// ============================================================================

export {
  CompanyContextStore,
  createCompanyContext,
  createStartupContext,
  buildCorporateContext,
} from './orchestration/company-context'

export type {
  CompanyProfile,
  CompanyMetrics,
  Competitor,
  MarketContext,
  StrategicContext,
  CompanyContext,
  DepartmentContext,
  // Note: CorporateContext is exported from runner-dynamic.ts
} from './orchestration/company-context'

// ============================================================================
// SCENARIOS (Decision Playbooks - Escenarios de Oro)
// ============================================================================

export {
  applyScenario,
  appliedScenarioToRunOptions,
} from './scenarios/apply-scenario'

export {
  scenarioConfigSchema,
} from './scenarios/types'

export type {
  ScenarioConfig,
  ScenarioSegment,
  PromptVariable,
  SuccessMetric,
  AgentBehaviorOverride,
  TokenOptimization,
  AppliedScenario,
  ScenarioVariableValues,
} from './scenarios/types'

// ============================================================================
// PRICING SYSTEM (Profit Margin Calculations & Validation)
// ============================================================================

export {
  getApiCostCoveragePerCredit,
  calculateApiCost,
  calculateBreakEvenPoint,
  analyzeProfitMargin,
  analyzeAllTiers,
  validatePricingConfig,
  validateTierConfig,
  formatUsdFromCents,
  formatProfitMargin,
  generateImpactSummary,
} from './pricing/helpers'

export type {
  PricingConfig,
  TierConfig,
  ProfitMarginAnalysis,
  ValidationResult as PricingValidationResult,
} from './pricing/helpers'
