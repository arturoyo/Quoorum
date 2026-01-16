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
} from "./types.js";

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
} from "./providers/index.js";

export { getAIClient, resetAIClient } from "./client.js";

export {
  getFallbackChain,
  getNextFallback,
  FALLBACK_ORDER,
  type FallbackModel,
} from "./lib/fallback-config.js";

// Rate Limiting
export {
  TokenBucketRateLimiter,
  getRateLimiterManager,
  updateProviderLimits,
  type RateLimiterConfig,
} from "./lib/rate-limiter.js";

// Quota Monitoring
export {
  ProviderQuotaMonitor,
  getQuotaMonitor,
  updateProviderQuotaLimits,
  type QuotaLimits,
  type QuotaUsage,
  type QuotaAlert,
} from "./lib/quota-monitor.js";

// Retry Logic
export {
  retryWithBackoff,
  retryWithPredicate,
  retryWithTimeout,
  retryBatch,
  RetryExhaustedError,
  type RetryConfig,
  type RetryContext,
} from "./lib/retry.js";

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
} from "./lib/telemetry.js";
