/**
 * Rate Limiting for Forum
 *
 * Prevents abuse and controls costs by limiting debate creation
 */

interface RateLimitConfig {
  maxDebatesPerHour: number
  maxDebatesPerDay: number
  maxConcurrentDebates: number
  maxCostPerDay: number // USD
}

export interface RateLimitStatus {
  allowed: boolean
  reason?: string
  retryAfter?: number // seconds
  current: {
    debatesThisHour: number
    debatesThisDay: number
    concurrentDebates: number
    costThisDay: number
  }
  limits: RateLimitConfig
}

/**
 * Default rate limits
 */
const DEFAULT_LIMITS: RateLimitConfig = {
  maxDebatesPerHour: 10,
  maxDebatesPerDay: 50,
  maxConcurrentDebates: 3,
  maxCostPerDay: 10.0, // $10/day
}

/**
 * Premium rate limits (for paid users)
 */
const PREMIUM_LIMITS: RateLimitConfig = {
  maxDebatesPerHour: 50,
  maxDebatesPerDay: 500,
  maxConcurrentDebates: 10,
  maxCostPerDay: 100.0, // $100/day
}

/**
 * In-memory rate limit store (in production, use Redis)
 */
const rateLimitStore = new Map<
  string,
  {
    debatesThisHour: { timestamp: number; count: number }
    debatesThisDay: { timestamp: number; count: number }
    concurrentDebates: number
    costThisDay: { timestamp: number; cost: number }
  }
>()

/**
 * Check if user can create a new debate
 */
// eslint-disable-next-line @typescript-eslint/require-await -- Placeholder for future Redis/DB implementation
export async function checkRateLimit(
  userId: string,
  isPremium: boolean = false
): Promise<RateLimitStatus> {
  const limits = isPremium ? PREMIUM_LIMITS : DEFAULT_LIMITS
  const now = Date.now()

  // Get or create user rate limit data
  let userData = rateLimitStore.get(userId)
  if (!userData) {
    userData = {
      debatesThisHour: { timestamp: now, count: 0 },
      debatesThisDay: { timestamp: now, count: 0 },
      concurrentDebates: 0,
      costThisDay: { timestamp: now, cost: 0 },
    }
    rateLimitStore.set(userId, userData)
  }

  // Reset hourly counter if hour has passed
  if (now - userData.debatesThisHour.timestamp > 60 * 60 * 1000) {
    userData.debatesThisHour = { timestamp: now, count: 0 }
  }

  // Reset daily counter if day has passed
  if (now - userData.debatesThisDay.timestamp > 24 * 60 * 60 * 1000) {
    userData.debatesThisDay = { timestamp: now, count: 0 }
    userData.costThisDay = { timestamp: now, cost: 0 }
  }

  // Check limits
  const current = {
    debatesThisHour: userData.debatesThisHour.count,
    debatesThisDay: userData.debatesThisDay.count,
    concurrentDebates: userData.concurrentDebates,
    costThisDay: userData.costThisDay.cost,
  }

  // Check concurrent debates
  if (current.concurrentDebates >= limits.maxConcurrentDebates) {
    return {
      allowed: false,
      reason: `Máximo de ${limits.maxConcurrentDebates} debates concurrentes alcanzado. Espera a que termine alguno.`,
      current,
      limits,
    }
  }

  // Check hourly limit
  if (current.debatesThisHour >= limits.maxDebatesPerHour) {
    const retryAfter = Math.ceil(
      (60 * 60 * 1000 - (now - userData.debatesThisHour.timestamp)) / 1000
    )
    return {
      allowed: false,
      reason: `Límite de ${limits.maxDebatesPerHour} debates por hora alcanzado.`,
      retryAfter,
      current,
      limits,
    }
  }

  // Check daily limit
  if (current.debatesThisDay >= limits.maxDebatesPerDay) {
    const retryAfter = Math.ceil(
      (24 * 60 * 60 * 1000 - (now - userData.debatesThisDay.timestamp)) / 1000
    )
    return {
      allowed: false,
      reason: `Límite de ${limits.maxDebatesPerDay} debates por día alcanzado.`,
      retryAfter,
      current,
      limits,
    }
  }

  // Check daily cost limit
  if (current.costThisDay >= limits.maxCostPerDay) {
    const retryAfter = Math.ceil(
      (24 * 60 * 60 * 1000 - (now - userData.costThisDay.timestamp)) / 1000
    )
    return {
      allowed: false,
      reason: `Límite de $${limits.maxCostPerDay} en costos por día alcanzado.`,
      retryAfter,
      current,
      limits,
    }
  }

  // All checks passed
  return {
    allowed: true,
    current,
    limits,
  }
}

/**
 * Increment debate counter when debate starts
 */
// eslint-disable-next-line @typescript-eslint/require-await -- Placeholder for future Redis/DB implementation
export async function incrementDebateCounter(userId: string): Promise<void> {
  const userData = rateLimitStore.get(userId)
  if (!userData) return

  userData.debatesThisHour.count++
  userData.debatesThisDay.count++
  userData.concurrentDebates++
}

/**
 * Decrement concurrent debates when debate completes
 */
// eslint-disable-next-line @typescript-eslint/require-await -- Placeholder for future Redis/DB implementation
export async function decrementConcurrentDebates(userId: string): Promise<void> {
  const userData = rateLimitStore.get(userId)
  if (!userData) return

  userData.concurrentDebates = Math.max(0, userData.concurrentDebates - 1)
}

/**
 * Add cost to daily total
 */
// eslint-disable-next-line @typescript-eslint/require-await -- Placeholder for future Redis/DB implementation
export async function addDebateCost(userId: string, cost: number): Promise<void> {
  const userData = rateLimitStore.get(userId)
  if (!userData) return

  userData.costThisDay.cost += cost
}

/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(
  userId: string,
  isPremium: boolean = false
): Promise<RateLimitStatus> {
  return checkRateLimit(userId, isPremium)
}

/**
 * Reset rate limits for user (admin only)
 */
// eslint-disable-next-line @typescript-eslint/require-await -- Placeholder for future Redis/DB implementation
export async function resetRateLimits(userId: string): Promise<void> {
  rateLimitStore.delete(userId)
}

/**
 * Get all users with rate limit data (admin only)
 */
// eslint-disable-next-line @typescript-eslint/require-await -- Placeholder for future Redis/DB implementation
export async function getAllRateLimitData(): Promise<
  Array<{
    userId: string
    data: {
      debatesThisHour: number
      debatesThisDay: number
      concurrentDebates: number
      costThisDay: number
    }
  }>
> {
  const result: Array<{
    userId: string
    data: {
      debatesThisHour: number
      debatesThisDay: number
      concurrentDebates: number
      costThisDay: number
    }
  }> = []

  for (const [userId, userData] of rateLimitStore.entries()) {
    result.push({
      userId,
      data: {
        debatesThisHour: userData.debatesThisHour.count,
        debatesThisDay: userData.debatesThisDay.count,
        concurrentDebates: userData.concurrentDebates,
        costThisDay: userData.costThisDay.cost,
      },
    })
  }

  return result
}

/**
 * Redis-based rate limiting (for production)
 *
 * In production, replace the in-memory store with Redis:
 *
 * ```typescript
 * import Redis from 'ioredis'
 * const redis = new Redis(process.env.REDIS_URL)
 *
 * async function checkRateLimitRedis(userId: string): Promise<RateLimitStatus> {
 *   const hourKey = `rate:${userId}:hour:${Math.floor(Date.now() / (60 * 60 * 1000))}`
 *   const dayKey = `rate:${userId}:day:${Math.floor(Date.now() / (24 * 60 * 60 * 1000))}`
 *   const concurrentKey = `rate:${userId}:concurrent`
 *   const costKey = `rate:${userId}:cost:${Math.floor(Date.now() / (24 * 60 * 60 * 1000))}`
 *
 *   const [hourCount, dayCount, concurrent, cost] = await Promise.all([
 *     redis.incr(hourKey),
 *     redis.incr(dayKey),
 *     redis.get(concurrentKey),
 *     redis.get(costKey),
 *   ])
 *
 *   // Set expiry
 *   await redis.expire(hourKey, 60 * 60)
 *   await redis.expire(dayKey, 24 * 60 * 60)
 *   await redis.expire(costKey, 24 * 60 * 60)
 *
 *   // Check limits...
 * }
 * ```
 */
