/**
 * Advanced Rate Limiting
 * 
 * Granular rate limiting with multiple tiers and strategies
 */

import { RedisCache } from './integrations/redis'

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitConfig {
  maxRequests: number
  windowSeconds: number
  strategy: 'fixed' | 'sliding' | 'token-bucket'
}

export interface RateLimitTier {
  name: string
  limits: {
    debatesPerDay: number
    debatesPerHour: number
    roundsPerDebate: number
    maxConcurrentDebates: number
    maxCostPerDay: number // USD
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  retryAfter?: number // seconds
}

// ============================================================================
// TIER DEFINITIONS
// ============================================================================

const FREE_TIER: RateLimitTier = {
  name: 'Free',
  limits: {
    debatesPerDay: 3,
    debatesPerHour: 2,
    roundsPerDebate: 5,
    maxConcurrentDebates: 1,
    maxCostPerDay: 1.0,
  },
}

export const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  free: FREE_TIER,
  starter: {
    name: 'Starter',
    limits: {
      debatesPerDay: 10,
      debatesPerHour: 5,
      roundsPerDebate: 10,
      maxConcurrentDebates: 2,
      maxCostPerDay: 5.0,
    },
  },
  pro: {
    name: 'Pro',
    limits: {
      debatesPerDay: 50,
      debatesPerHour: 20,
      roundsPerDebate: 15,
      maxConcurrentDebates: 5,
      maxCostPerDay: 20.0,
    },
  },
  enterprise: {
    name: 'Enterprise',
    limits: {
      debatesPerDay: -1, // unlimited
      debatesPerHour: -1,
      roundsPerDebate: 20,
      maxConcurrentDebates: 10,
      maxCostPerDay: 100.0,
    },
  },
}

/** Get tier config with guaranteed fallback to free tier */
function getTierConfig(tier: string): RateLimitTier {
  return RATE_LIMIT_TIERS[tier] ?? FREE_TIER
}

// ============================================================================
// RATE LIMIT CHECKERS
// ============================================================================

export async function checkDebateCreationLimit(
  userId: string,
  tier: string = 'free'
): Promise<RateLimitResult> {
  const tierConfig = getTierConfig(tier)

  // Check hourly limit
  const hourlyKey = `debates:${userId}:hour`
  const hourlyCount = await RedisCache.getRateLimit(hourlyKey)

  if (
    tierConfig.limits.debatesPerHour !== -1 &&
    hourlyCount >= tierConfig.limits.debatesPerHour
  ) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: getNextHour(),
      retryAfter: getSecondsUntilNextHour(),
    }
  }

  // Check daily limit
  const dailyKey = `debates:${userId}:day`
  const dailyCount = await RedisCache.getRateLimit(dailyKey)

  if (
    tierConfig.limits.debatesPerDay !== -1 &&
    dailyCount >= tierConfig.limits.debatesPerDay
  ) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: getNextDay(),
      retryAfter: getSecondsUntilNextDay(),
    }
  }

  // Increment counters
  await RedisCache.incrementRateLimit(hourlyKey, 3600) // 1 hour
  await RedisCache.incrementRateLimit(dailyKey, 86400) // 24 hours

  return {
    allowed: true,
    remaining: Math.max(
      0,
      tierConfig.limits.debatesPerDay === -1
        ? 999
        : tierConfig.limits.debatesPerDay - dailyCount - 1
    ),
    resetAt: getNextDay(),
  }
}

export async function checkConcurrentDebatesLimit(
  userId: string,
  tier: string = 'free'
): Promise<RateLimitResult> {
  const tierConfig = getTierConfig(tier)

  const key = `concurrent:${userId}`
  const count = await RedisCache.getRateLimit(key)

  if (count >= tierConfig.limits.maxConcurrentDebates) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 60000), // 1 minute
      retryAfter: 60,
    }
  }

  return {
    allowed: true,
    remaining: tierConfig.limits.maxConcurrentDebates - count,
    resetAt: new Date(Date.now() + 60000),
  }
}

export async function checkCostLimit(
  userId: string,
  estimatedCost: number,
  tier: string = 'free'
): Promise<RateLimitResult> {
  const tierConfig = getTierConfig(tier)

  const key = `cost:${userId}:day`
  const currentCost = (await RedisCache.get<number>(key)) || 0

  if (currentCost + estimatedCost > tierConfig.limits.maxCostPerDay) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: getNextDay(),
      retryAfter: getSecondsUntilNextDay(),
    }
  }

  return {
    allowed: true,
    remaining: tierConfig.limits.maxCostPerDay - currentCost - estimatedCost,
    resetAt: getNextDay(),
  }
}

// ============================================================================
// TRACKING
// ============================================================================

export async function trackDebateStart(userId: string): Promise<void> {
  const key = `concurrent:${userId}`
  await RedisCache.incrementRateLimit(key, 3600) // 1 hour expiry
}

export async function trackDebateEnd(userId: string): Promise<void> {
  const key = `concurrent:${userId}`
  const count = await RedisCache.getRateLimit(key)
  if (count > 0) {
    await RedisCache.set(key, count - 1, 3600)
  }
}

export async function trackDebateCost(userId: string, cost: number): Promise<void> {
  const key = `cost:${userId}:day`
  const currentCost = (await RedisCache.get<number>(key)) || 0
  await RedisCache.set(key, currentCost + cost, 86400) // 24 hours
}

// ============================================================================
// SLIDING WINDOW RATE LIMITER
// ============================================================================

export async function checkSlidingWindowLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStart = now - windowSeconds * 1000

  // In Redis, would use sorted set with timestamps
  // For now, use simple counter with sliding window logic
  const fullKey = `sliding:${key}`
  const timestamps = (await RedisCache.get<number[]>(fullKey)) || []

  // Remove old timestamps
  const validTimestamps = timestamps.filter(ts => ts > windowStart)

  if (validTimestamps.length >= maxRequests) {
    const oldestTimestamp = validTimestamps[0]!
    const resetAt = new Date(oldestTimestamp + windowSeconds * 1000)
    const retryAfter = Math.ceil((resetAt.getTime() - now) / 1000)

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter,
    }
  }

  // Add current timestamp
  validTimestamps.push(now)
  await RedisCache.set(fullKey, validTimestamps, windowSeconds)

  return {
    allowed: true,
    remaining: maxRequests - validTimestamps.length,
    resetAt: new Date(now + windowSeconds * 1000),
  }
}

// ============================================================================
// TOKEN BUCKET RATE LIMITER
// ============================================================================

interface TokenBucket {
  tokens: number
  lastRefill: number
}

export async function checkTokenBucketLimit(
  key: string,
  maxTokens: number,
  refillRate: number, // tokens per second
  tokensRequired: number = 1
): Promise<RateLimitResult> {
  const fullKey = `bucket:${key}`
  const bucket = (await RedisCache.get<TokenBucket>(fullKey)) || {
    tokens: maxTokens,
    lastRefill: Date.now(),
  }

  const now = Date.now()
  const timeSinceRefill = (now - bucket.lastRefill) / 1000
  const tokensToAdd = Math.floor(timeSinceRefill * refillRate)

  bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd)
  bucket.lastRefill = now

  if (bucket.tokens < tokensRequired) {
    const tokensNeeded = tokensRequired - bucket.tokens
    const secondsToWait = Math.ceil(tokensNeeded / refillRate)

    return {
      allowed: false,
      remaining: bucket.tokens,
      resetAt: new Date(now + secondsToWait * 1000),
      retryAfter: secondsToWait,
    }
  }

  bucket.tokens -= tokensRequired
  await RedisCache.set(fullKey, bucket, 3600) // 1 hour expiry

  return {
    allowed: true,
    remaining: bucket.tokens,
    resetAt: new Date(now + 3600 * 1000),
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function getNextHour(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0)
}

function getNextDay(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
}

function getSecondsUntilNextHour(): number {
  const now = Date.now()
  const nextHour = getNextHour().getTime()
  return Math.ceil((nextHour - now) / 1000)
}

function getSecondsUntilNextDay(): number {
  const now = Date.now()
  const nextDay = getNextDay().getTime()
  return Math.ceil((nextDay - now) / 1000)
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

export async function getUserRateLimitStatus(
  userId: string,
  tier: string = 'free'
): Promise<{
  tier: string
  debatesUsed: { hour: number; day: number }
  costUsed: number
  concurrent: number
  limits: RateLimitTier['limits']
}> {
  const tierConfig = getTierConfig(tier)

  const hourlyCount = await RedisCache.getRateLimit(`debates:${userId}:hour`)
  const dailyCount = await RedisCache.getRateLimit(`debates:${userId}:day`)
  const costUsed = (await RedisCache.get<number>(`cost:${userId}:day`)) || 0
  const concurrent = await RedisCache.getRateLimit(`concurrent:${userId}`)

  return {
    tier,
    debatesUsed: {
      hour: hourlyCount,
      day: dailyCount,
    },
    costUsed,
    concurrent,
    limits: tierConfig.limits,
  }
}

export async function resetUserRateLimits(userId: string): Promise<void> {
  await RedisCache.delete(`debates:${userId}:hour`)
  await RedisCache.delete(`debates:${userId}:day`)
  await RedisCache.delete(`cost:${userId}:day`)
  await RedisCache.delete(`concurrent:${userId}`)
}

export async function grantExtraDebates(
  userId: string,
  count: number,
  expiryHours: number = 24
): Promise<void> {
  const key = `extra:${userId}`
  const current = (await RedisCache.get<number>(key)) || 0
  await RedisCache.set(key, current + count, expiryHours * 3600)
}

export async function getExtraDebates(userId: string): Promise<number> {
  const key = `extra:${userId}`
  return (await RedisCache.get<number>(key)) || 0
}
