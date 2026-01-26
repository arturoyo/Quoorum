export type {
  AIClient,
  AIConfig,
  AIMessage,
  AIProvider,
  AIResponse,
  AIStreamCallbacks,
  ConsensusResult,
  DeliberationContext,
  ExpertConfig,
  ExpertOpinion,
  GenerateOptions,
  ProviderFactory,
} from "./types";

export {
  anthropicProvider,
  createModel,
  deepseekProvider,
  getAllProviders,
  getDefaultModel,
  getProvider,
  getSupportedModels,
  googleProvider,
  groqProvider,
  openaiProvider,
} from "./providers/index";

export { getAIClient, resetAIClient } from "./client";

export {
  getFallbackChain,
  getNextFallback,
  FALLBACK_ORDER,
  type FallbackModel,
} from "./lib/fallback-config";

// Rate Limiting
export {
  TokenBucketRateLimiter,
  getRateLimiterManager,
  updateProviderLimits,
  type RateLimiterConfig,
} from "./lib/rate-limiter";

// Quota Monitoring
export {
  ProviderQuotaMonitor,
  getQuotaMonitor,
  updateProviderQuotaLimits,
  type QuotaLimits,
  type QuotaUsage,
  type QuotaAlert,
} from "./lib/quota-monitor";

// Retry Logic
export {
  retryWithBackoff,
  retryWithPredicate,
  retryWithTimeout,
  retryBatch,
  RetryExhaustedError,
  type RetryConfig,
  type RetryContext,
} from "./lib/retry";

// Telemetry
export {
  calculateCost,
  trackAIRequest,
  trackQuotaAlert,
  getTelemetrySummary,
  getAllTelemetry,
  resetAllMetrics,
  estimateMonthlyCost,
  type AIRequestMetrics,
  type CostConfig,
} from "./lib/telemetry";

// JSON Utilities (for parsing AI responses)
export {
  cleanJsonResponse,
  parseAIJson,
  safeParseAIJson,
  parseAIJsonWithFallback,
} from "./lib/json-utils";
