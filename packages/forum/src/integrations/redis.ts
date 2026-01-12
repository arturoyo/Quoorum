/**
 * Redis Integration
 *
 * Advanced caching with Redis
 */

import { createClient, type RedisClientType } from 'redis'
import { forumLogger } from '../logger'
import type { DebateResult } from '../types'

// ============================================================================
// CONFIGURATION
// ============================================================================

const REDIS_URL = process.env['REDIS_URL'] || 'redis://localhost:6379'
const CACHE_PREFIX = 'forum:'

let redisClient: RedisClientType | null = null
let isConnected = false

// ============================================================================
// INITIALIZATION
// ============================================================================

export async function initRedis(): Promise<RedisClientType | null> {
  if (redisClient && isConnected) {
    return redisClient
  }

  try {
    redisClient = createClient({
      url: REDIS_URL,
    })

    redisClient.on('error', (err: Error) => {
      forumLogger.error('Redis client error', err, {})
      isConnected = false
    })

    redisClient.on('connect', () => {
      forumLogger.info('Redis connected', {})
      isConnected = true
    })

    await redisClient.connect()
    return redisClient
  } catch (error) {
    forumLogger.warn('Redis not available, using in-memory cache', { error: String(error) })
    return null
  }
}

export async function disconnectRedis() {
  if (redisClient && isConnected) {
    await redisClient.quit()
    isConnected = false
  }
}

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redisClient || !isConnected) {
    await initRedis()
    if (!redisClient) return null
  }

  try {
    const value = await redisClient.get(`${CACHE_PREFIX}${key}`)
    if (!value) return null

    return JSON.parse(value) as T
  } catch (error) {
    forumLogger.error(
      'Redis get error',
      error instanceof Error ? error : new Error(String(error)),
      { key }
    )
    return null
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
  if (!redisClient || !isConnected) {
    await initRedis()
    if (!redisClient) return false
  }

  try {
    const serialized = JSON.stringify(value)
    const fullKey = `${CACHE_PREFIX}${key}`

    if (ttlSeconds) {
      await redisClient.setEx(fullKey, ttlSeconds, serialized)
    } else {
      await redisClient.set(fullKey, serialized)
    }

    return true
  } catch (error) {
    forumLogger.error(
      'Redis set error',
      error instanceof Error ? error : new Error(String(error)),
      { key }
    )
    return false
  }
}

export async function cacheDelete(key: string): Promise<boolean> {
  if (!redisClient || !isConnected) {
    await initRedis()
    if (!redisClient) return false
  }

  try {
    await redisClient.del(`${CACHE_PREFIX}${key}`)
    return true
  } catch (error) {
    forumLogger.error(
      'Redis delete error',
      error instanceof Error ? error : new Error(String(error)),
      { key }
    )
    return false
  }
}

export async function cacheExists(key: string): Promise<boolean> {
  if (!redisClient || !isConnected) {
    await initRedis()
    if (!redisClient) return false
  }

  try {
    const exists = await redisClient.exists(`${CACHE_PREFIX}${key}`)
    return exists === 1
  } catch (error) {
    forumLogger.error(
      'Redis exists error',
      error instanceof Error ? error : new Error(String(error)),
      { key }
    )
    return false
  }
}

// ============================================================================
// DEBATE CACHING
// ============================================================================

const DEBATE_TTL = 60 * 60 // 1 hour
const DEBATE_LIST_TTL = 60 * 5 // 5 minutes
const SIMILAR_DEBATES_TTL = 60 * 30 // 30 minutes

export async function cacheDebate(debateId: string, debate: DebateResult): Promise<boolean> {
  return cacheSet(`debate:${debateId}`, debate, DEBATE_TTL)
}

export async function getCachedDebate(debateId: string): Promise<DebateResult | null> {
  return cacheGet(`debate:${debateId}`)
}

export async function cacheDebateList(userId: string, debates: DebateResult[]): Promise<boolean> {
  return cacheSet(`debates:user:${userId}`, debates, DEBATE_LIST_TTL)
}

export async function getCachedDebateList(userId: string): Promise<DebateResult[] | null> {
  return cacheGet(`debates:user:${userId}`)
}

export async function cacheSimilarDebates(
  question: string,
  debates: DebateResult[]
): Promise<boolean> {
  const key = `similar:${hashString(question)}`
  return cacheSet(key, debates, SIMILAR_DEBATES_TTL)
}

export async function getCachedSimilarDebates(question: string): Promise<DebateResult[] | null> {
  const key = `similar:${hashString(question)}`
  return cacheGet(key)
}

export async function invalidateDebateCache(debateId: string): Promise<void> {
  await cacheDelete(`debate:${debateId}`)
}

export async function invalidateUserDebatesCache(userId: string): Promise<void> {
  await cacheDelete(`debates:user:${userId}`)
}

// ============================================================================
// ANALYTICS CACHING
// ============================================================================

const ANALYTICS_TTL = 60 * 15 // 15 minutes

export async function cacheAnalytics(userId: string, analytics: unknown): Promise<boolean> {
  return cacheSet(`analytics:${userId}`, analytics, ANALYTICS_TTL)
}

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- unknown is necessary for type safety
export async function getCachedAnalytics(userId: string): Promise<unknown | null> {
  return cacheGet(`analytics:${userId}`)
}

export async function invalidateAnalyticsCache(userId: string): Promise<void> {
  await cacheDelete(`analytics:${userId}`)
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export async function incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
  if (!redisClient || !isConnected) {
    await initRedis()
    if (!redisClient) return 0
  }

  try {
    const fullKey = `${CACHE_PREFIX}ratelimit:${key}`
    const count = await redisClient.incr(fullKey)

    // Set expiry on first increment
    if (count === 1) {
      await redisClient.expire(fullKey, windowSeconds)
    }

    return count
  } catch (error) {
    forumLogger.error(
      'Redis rate limit error',
      error instanceof Error ? error : new Error(String(error)),
      { key }
    )
    return 0
  }
}

export async function getRateLimit(key: string): Promise<number> {
  if (!redisClient || !isConnected) {
    await initRedis()
    if (!redisClient) return 0
  }

  try {
    const fullKey = `${CACHE_PREFIX}ratelimit:${key}`
    const value = await redisClient.get(fullKey)
    return value ? parseInt(value, 10) : 0
  } catch (error) {
    forumLogger.error(
      'Redis get rate limit error',
      error instanceof Error ? error : new Error(String(error)),
      { key }
    )
    return 0
  }
}

export async function resetRateLimit(key: string): Promise<boolean> {
  return cacheDelete(`ratelimit:${key}`)
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

const SESSION_TTL = 60 * 60 * 24 // 24 hours

export async function cacheSession(sessionId: string, data: unknown): Promise<boolean> {
  return cacheSet(`session:${sessionId}`, data, SESSION_TTL)
}

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- unknown is necessary for type safety
export async function getCachedSession(sessionId: string): Promise<unknown | null> {
  return cacheGet(`session:${sessionId}`)
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  return cacheDelete(`session:${sessionId}`)
}

// ============================================================================
// LOCK MANAGEMENT
// ============================================================================

export async function acquireLock(key: string, ttlSeconds: number = 30): Promise<boolean> {
  if (!redisClient || !isConnected) {
    await initRedis()
    if (!redisClient) return false
  }

  try {
    const fullKey = `${CACHE_PREFIX}lock:${key}`
    const result = await redisClient.set(fullKey, '1', {
      NX: true, // Only set if not exists
      EX: ttlSeconds,
    })
    return result === 'OK'
  } catch (error) {
    forumLogger.error(
      'Redis acquire lock error',
      error instanceof Error ? error : new Error(String(error)),
      { key }
    )
    return false
  }
}

export async function releaseLock(key: string): Promise<boolean> {
  return cacheDelete(`lock:${key}`)
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export async function cacheMultiGet<T>(keys: string[]): Promise<Map<string, T>> {
  if (!redisClient || !isConnected) {
    await initRedis()
    if (!redisClient) return new Map()
  }

  try {
    const fullKeys = keys.map((k) => `${CACHE_PREFIX}${k}`)
    const values = await redisClient.mGet(fullKeys)

    const result = new Map<string, T>()
    keys.forEach((key, i) => {
      const value = values[i]
      if (value) {
        try {
          result.set(key, JSON.parse(value) as T)
        } catch (parseError) {
          forumLogger.error(
            'Failed to parse cached value',
            parseError instanceof Error ? parseError : new Error(String(parseError)),
            { key }
          )
        }
      }
    })

    return result
  } catch (error) {
    forumLogger.error(
      'Redis multi-get error',
      error instanceof Error ? error : new Error(String(error)),
      { keyCount: keys.length }
    )
    return new Map()
  }
}

export async function cacheMultiSet<T>(
  entries: Map<string, T>,
  ttlSeconds?: number
): Promise<boolean> {
  if (!redisClient || !isConnected) {
    await initRedis()
    if (!redisClient) return false
  }

  try {
    const pipeline = redisClient.multi()

    for (const [key, value] of entries) {
      const fullKey = `${CACHE_PREFIX}${key}`
      const serialized = JSON.stringify(value)

      if (ttlSeconds) {
        pipeline.setEx(fullKey, ttlSeconds, serialized)
      } else {
        pipeline.set(fullKey, serialized)
      }
    }

    await pipeline.exec()
    return true
  } catch (error) {
    forumLogger.error(
      'Redis multi-set error',
      error instanceof Error ? error : new Error(String(error)),
      { entryCount: entries.size }
    )
    return false
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

export async function clearCache(pattern?: string): Promise<number> {
  if (!redisClient || !isConnected) {
    await initRedis()
    if (!redisClient) return 0
  }

  try {
    const searchPattern = pattern ? `${CACHE_PREFIX}${pattern}` : `${CACHE_PREFIX}*`

    const keys = await redisClient.keys(searchPattern)
    if (keys.length === 0) return 0

    await redisClient.del(keys)
    return keys.length
  } catch (error) {
    forumLogger.error(
      'Redis clear cache error',
      error instanceof Error ? error : new Error(String(error)),
      { pattern }
    )
    return 0
  }
}

export async function getCacheStats(): Promise<{
  connected: boolean
  keys: number
  memory: string
}> {
  if (!redisClient || !isConnected) {
    return { connected: false, keys: 0, memory: '0' }
  }

  try {
    const keys = await redisClient.keys(`${CACHE_PREFIX}*`)
    const info = await redisClient.info('memory')
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/)
    const memory = memoryMatch?.[1] ?? '0'

    return {
      connected: true,
      keys: keys.length,
      memory,
    }
  } catch (error) {
    forumLogger.error(
      'Redis stats error',
      error instanceof Error ? error : new Error(String(error)),
      {}
    )
    return { connected: false, keys: 0, memory: '0' }
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const RedisCache = {
  init: initRedis,
  disconnect: disconnectRedis,
  get: cacheGet,
  set: cacheSet,
  delete: cacheDelete,
  exists: cacheExists,
  clear: clearCache,
  stats: getCacheStats,

  // Debate operations
  cacheDebate,
  getCachedDebate,
  cacheDebateList,
  getCachedDebateList,
  cacheSimilarDebates,
  getCachedSimilarDebates,
  invalidateDebateCache,
  invalidateUserDebatesCache,

  // Analytics
  cacheAnalytics,
  getCachedAnalytics,
  invalidateAnalyticsCache,

  // Rate limiting
  incrementRateLimit,
  getRateLimit,
  resetRateLimit,

  // Session
  cacheSession,
  getCachedSession,
  deleteSession,

  // Lock
  acquireLock,
  releaseLock,

  // Batch
  multiGet: cacheMultiGet,
  multiSet: cacheMultiSet,
}
