/**
 * Retry Logic with Exponential Backoff and Jitter
 *
 * Implements smart retry strategies for AI API calls with:
 * - Exponential backoff
 * - Random jitter to avoid thundering herd
 * - Respect for Retry-After headers
 * - Configurable retry policies
 */

export interface RetryConfig {
  maxRetries: number
  initialDelay: number // ms
  maxDelay: number // ms
  backoffMultiplier: number
  jitter: boolean // Add random variation to delay
  retryableStatusCodes?: number[]
  retryableErrors?: string[]
}

export interface RetryContext {
  attempt: number
  maxRetries: number
  lastError?: Error
  totalDelay: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelay: 1000, // 1s
  maxDelay: 64000, // 64s
  backoffMultiplier: 2,
  jitter: true,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNREFUSED',
    'rate_limit_exceeded',
    'quota_exceeded',
  ],
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: Error, config: RetryConfig): boolean {
  // Check error message
  const errorMessage = error.message.toLowerCase()
  const retryableErrors = config.retryableErrors ?? DEFAULT_RETRY_CONFIG.retryableErrors!
  if (retryableErrors.some((msg) => errorMessage.includes(msg.toLowerCase()))) {
    return true
  }

  // Check status code (for HTTP errors)
  const statusCode = (error as any).statusCode ?? (error as any).status
  if (statusCode && config.retryableStatusCodes?.includes(statusCode)) {
    return true
  }

  return false
}

/**
 * Extract Retry-After header from error (if available)
 */
function getRetryAfter(error: Error): number | null {
  const retryAfter =
    (error as any).response?.headers?.['retry-after'] ??
    (error as any).headers?.['retry-after']

  if (!retryAfter) return null

  // Retry-After can be seconds (number) or date (string)
  const parsed = parseInt(retryAfter, 10)
  if (!isNaN(parsed)) {
    return parsed * 1000 // Convert seconds to ms
  }

  // Try parsing as date
  const date = new Date(retryAfter)
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now())
  }

  return null
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const baseDelay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt)
  const cappedDelay = Math.min(baseDelay, config.maxDelay)

  if (!config.jitter) {
    return cappedDelay
  }

  // Add jitter: ±25% random variation
  const jitterRange = cappedDelay * 0.25
  const jitter = Math.random() * jitterRange * 2 - jitterRange
  return Math.max(0, cappedDelay + jitter)
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param config - Retry configuration
 * @returns Promise that resolves with function result
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error | null = null
  let totalDelay = 0

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry if max retries reached
      if (attempt >= fullConfig.maxRetries) {
        throw new RetryExhaustedError(
          `Max retries (${fullConfig.maxRetries}) exceeded`,
          lastError,
          { attempt, maxRetries: fullConfig.maxRetries, lastError, totalDelay }
        )
      }

      // Don't retry if error is not retryable
      if (!isRetryableError(lastError, fullConfig)) {
        throw lastError
      }

      // Calculate delay
      const retryAfter = getRetryAfter(lastError)
      const delay = retryAfter ?? calculateDelay(attempt, fullConfig)
      totalDelay += delay

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError!
}

/**
 * Custom error for when retries are exhausted
 */
export class RetryExhaustedError extends Error {
  constructor(
    message: string,
    public readonly lastError: Error,
    public readonly context: RetryContext
  ) {
    super(message)
    this.name = 'RetryExhaustedError'
  }
}

/**
 * Retry with custom retry predicate
 */
export async function retryWithPredicate<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: Error, attempt: number) => boolean,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error | null = null
  let totalDelay = 0

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt >= fullConfig.maxRetries || !shouldRetry(lastError, attempt)) {
        throw lastError
      }

      const delay = calculateDelay(attempt, fullConfig)
      totalDelay += delay
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

/**
 * Retry with timeout
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  timeout: number,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
  })

  return Promise.race([retryWithBackoff(fn, config), timeoutPromise])
}

/**
 * Batch retry - retry multiple functions with shared config
 */
export async function retryBatch<T>(
  fns: Array<() => Promise<T>>,
  config: Partial<RetryConfig> = {}
): Promise<T[]> {
  return Promise.all(fns.map((fn) => retryWithBackoff(fn, config)))
}
