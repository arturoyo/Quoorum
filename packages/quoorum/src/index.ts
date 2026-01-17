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
  estimateTokens,
  EMOJI_MAP,
  REVERSE_EMOJI_MAP,
  ROLE_EMOJI,
  getRoleEmoji,
} from './ultra-language'

// Runner (re-exported from separate file)
export { runDebate, executeRound, generateAgentResponse } from './runner'

// Dynamic Runner (with quality monitoring and meta-moderation)
export { runDebate as runDynamicDebate } from './runner-dynamic'
export type { RunDebateOptions as DynamicDebateOptions } from './runner-dynamic'

// Dynamic Expert System
export { analyzeQuestion } from './question-analyzer'
export { matchExperts, validateMatching } from './expert-matcher'
export { EXPERT_DATABASE, getExpertsByIds, getExpertsByExpertise } from './expert-database'
export { analyzeDebateQuality, detectPrematureConsensus, summarizeQuality } from './quality-monitor'
export {
  shouldIntervene,
  generateIntervention,
  generateMultipleInterventions,
  getInterventionFrequency,
  summarizeIntervention,
  wasInterventionEffective,
} from './meta-moderator'

// Dynamic System Types
export type { QuestionAnalysis, KnowledgeArea, Topic } from './question-analyzer'
export type { ExpertProfile } from './expert-database'
export type { ExpertMatch, MatchingOptions } from './expert-matcher'
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
// TODO: Temporarily commented out due to html-pdf-node causing build issues in Next.js
// This uses puppeteer and other Node-only dependencies that cannot be bundled for the browser
// Import directly from '@quoorum/quoorum/pdf-export' when needed in server-only contexts
// export { generateDebatePDF, generateDebateMarkdown } from './pdf-export'
// export type { PDFExportOptions } from './pdf-export'

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
  getCreditBalance,
  hasSufficientCredits,
} from './billing/credit-transactions'
export type { CreditDeductionResult, CreditRefundResult } from './billing/credit-transactions'

export { convertUsdToCredits, trackCredits, CREDIT_MULTIPLIER, USD_PER_CREDIT } from './analytics/cost'
