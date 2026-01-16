/**
 * Token Bucket Rate Limiter for AI API calls
 *
 * Prevents hitting API rate limits by enforcing local rate limiting
 * before making requests to AI providers.
 */

export interface RateLimiterConfig {
  rpm: number // Requests per minute
  tpm: number // Tokens per minute
  rpd?: number // Requests per day (optional)
}

export class TokenBucketRateLimiter {
  private tokens: number
  private requests: number
  private dailyRequests: number
  private lastRefill: number
  private lastDailyReset: number
  private readonly rpm: number
  private readonly tpm: number
  private readonly rpd?: number

  constructor(config: RateLimiterConfig) {
    this.rpm = config.rpm
    this.tpm = config.tpm
    this.rpd = config.rpd
    this.tokens = config.tpm
    this.requests = config.rpm
    this.dailyRequests = 0
    this.lastRefill = Date.now()
    this.lastDailyReset = Date.now()
  }

  /**
   * Wait until capacity is available for the request
   * @param estimatedTokens - Estimated tokens needed for the request
   */
  async waitForCapacity(estimatedTokens: number = 1000): Promise<void> {
    await this.refill()
    await this.checkDailyLimit()

    // Wait for token capacity
    while (this.tokens < estimatedTokens) {
      const waitTime = this.calculateTokenWaitTime(estimatedTokens)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
      await this.refill()
    }

    // Wait for request capacity
    while (this.requests < 1) {
      const waitTime = this.calculateRequestWaitTime()
      await new Promise((resolve) => setTimeout(resolve, waitTime))
      await this.refill()
    }

    // Consume capacity
    this.tokens -= estimatedTokens
    this.requests -= 1
    this.dailyRequests += 1
  }

  /**
   * Refill tokens and requests based on elapsed time
   */
  private async refill(): Promise<void> {
    const now = Date.now()
    const elapsed = now - this.lastRefill

    // Refill tokens (proportional to time elapsed)
    const tokensToAdd = (elapsed / 60000) * this.tpm
    this.tokens = Math.min(this.tokens + tokensToAdd, this.tpm)

    // Refill requests (proportional to time elapsed)
    const requestsToAdd = (elapsed / 60000) * this.rpm
    this.requests = Math.min(this.requests + requestsToAdd, this.rpm)

    this.lastRefill = now
  }

  /**
   * Check and reset daily limit if needed
   */
  private async checkDailyLimit(): Promise<void> {
    const now = Date.now()
    const dayElapsed = now - this.lastDailyReset

    // Reset daily counter after 24 hours
    if (dayElapsed >= 86400000) {
      // 24 hours in ms
      this.dailyRequests = 0
      this.lastDailyReset = now
    }

    // Wait if daily limit reached
    if (this.rpd && this.dailyRequests >= this.rpd) {
      const timeUntilReset = 86400000 - dayElapsed
      throw new Error(
        `Daily rate limit reached (${this.rpd} RPD). Resets in ${Math.ceil(timeUntilReset / 1000 / 60)} minutes.`
      )
    }
  }

  /**
   * Calculate wait time for token capacity
   */
  private calculateTokenWaitTime(needed: number): number {
    const deficit = needed - this.tokens
    const timePerToken = 60000 / this.tpm // ms per token
    return Math.ceil(deficit * timePerToken)
  }

  /**
   * Calculate wait time for request capacity
   */
  private calculateRequestWaitTime(): number {
    const timePerRequest = 60000 / this.rpm // ms per request
    return Math.ceil(timePerRequest)
  }

  /**
   * Get current status
   */
  getStatus(): {
    tokens: number
    requests: number
    dailyRequests: number
    rpm: number
    tpm: number
    rpd?: number
  } {
    return {
      tokens: Math.floor(this.tokens),
      requests: Math.floor(this.requests),
      dailyRequests: this.dailyRequests,
      rpm: this.rpm,
      tpm: this.tpm,
      rpd: this.rpd,
    }
  }

  /**
   * Reset all counters (for testing/debugging)
   */
  reset(): void {
    this.tokens = this.tpm
    this.requests = this.rpm
    this.dailyRequests = 0
    this.lastRefill = Date.now()
    this.lastDailyReset = Date.now()
  }
}

/**
 * Rate Limiter Manager - Singleton for managing multiple providers
 */
class RateLimiterManager {
  private limiters: Map<string, TokenBucketRateLimiter> = new Map()

  private readonly DEFAULT_LIMITS: Record<string, RateLimiterConfig> = {
    openai: { rpm: 3, tpm: 150_000, rpd: 200 },
    anthropic: { rpm: 5, tpm: 20_000, rpd: 50 },
    google: { rpm: 15, tpm: 1_000_000, rpd: 1_500 },
    groq: { rpm: 30, tpm: 14_400, rpd: 14_400 },
    deepseek: { rpm: 60, tpm: 100_000, rpd: 10_000 },
  }

  /**
   * Get or create a rate limiter for a provider
   */
  getOrCreate(provider: string, rpm?: number, tpm?: number, rpd?: number): TokenBucketRateLimiter {
    if (!this.limiters.has(provider)) {
      const defaults = this.DEFAULT_LIMITS[provider]
      const config: RateLimiterConfig = {
        rpm: rpm ?? defaults?.rpm ?? 10,
        tpm: tpm ?? defaults?.tpm ?? 100_000,
        rpd: rpd ?? defaults?.rpd,
      }
      this.limiters.set(provider, new TokenBucketRateLimiter(config))
    }
    return this.limiters.get(provider)!
  }

  /**
   * Get existing limiter
   */
  get(provider: string): TokenBucketRateLimiter | undefined {
    return this.limiters.get(provider)
  }

  /**
   * Update provider limits (when tier upgrades)
   */
  updateLimits(provider: string, rpm: number, tpm: number, rpd?: number): void {
    const config: RateLimiterConfig = { rpm, tpm, rpd }
    this.limiters.set(provider, new TokenBucketRateLimiter(config))
  }

  /**
   * Reset all limiters
   */
  resetAll(): void {
    this.limiters.forEach((limiter) => limiter.reset())
  }

  /**
   * Get status of all limiters
   */
  getAllStatus(): Record<string, ReturnType<TokenBucketRateLimiter['getStatus']>> {
    const status: Record<string, ReturnType<TokenBucketRateLimiter['getStatus']>> = {}
    this.limiters.forEach((limiter, provider) => {
      status[provider] = limiter.getStatus()
    })
    return status
  }
}

// Singleton instance
let managerInstance: RateLimiterManager | null = null

/**
 * Get the singleton rate limiter manager instance
 */
export function getRateLimiterManager(): RateLimiterManager {
  if (!managerInstance) {
    managerInstance = new RateLimiterManager()
  }
  return managerInstance
}

/**
 * Update provider limits (convenience function)
 */
export function updateProviderLimits(
  provider: string,
  rpm: number,
  tpm: number,
  rpd?: number
): void {
  const manager = getRateLimiterManager()
  manager.updateLimits(provider, rpm, tpm, rpd)
}
