/**
 * Caching System - Optimize costs and performance
 *
 * Caches expert responses, embeddings, and debate results
 * to reduce API calls and improve response times.
 */

export interface CacheEntry<T> {
  key: string
  value: T
  expiresAt: Date
  hitCount: number
  costSaved: number // USD
}

export interface CacheStats {
  totalHits: number
  totalMisses: number
  hitRate: number
  totalCostSaved: number
  entriesCount: number
}

/**
 * In-memory cache (would be Redis in production)
 */
const cache = new Map<string, CacheEntry<unknown>>()

/**
 * Generate cache key for a debate question
 */
export function generateCacheKey(question: string, context?: unknown): string {
  const normalized = question.toLowerCase().trim()
  const contextHash = context ? JSON.stringify(context) : ''
  return `debate:${normalized}:${contextHash}`
}

/**
 * Get cached debate result
 */
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- unknown is necessary for type safety
export function getCachedDebate(question: string, context?: unknown): unknown | null {
  const key = generateCacheKey(question, context)
  const entry = cache.get(key)

  if (!entry) return null

  // Check expiration
  if (new Date() > entry.expiresAt) {
    cache.delete(key)
    return null
  }

  // Update hit count
  entry.hitCount++

  return entry.value
}

/**
 * Cache debate result
 */
export function cacheDebate(
  question: string,
  result: unknown,
  context?: unknown,
  ttlHours: number = 24
): void {
  const key = generateCacheKey(question, context)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + ttlHours)

  cache.set(key, {
    key,
    value: result,
    expiresAt,
    hitCount: 0,
    costSaved: 0,
  })
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  let totalHits = 0
  let totalCostSaved = 0

  for (const entry of cache.values()) {
    totalHits += entry.hitCount
    totalCostSaved += entry.costSaved
  }

  const totalMisses = 0 // Would track this separately
  const hitRate = totalHits / (totalHits + totalMisses || 1)

  return {
    totalHits,
    totalMisses,
    hitRate,
    totalCostSaved,
    entriesCount: cache.size,
  }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): number {
  const now = new Date()
  let cleared = 0

  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key)
      cleared++
    }
  }

  return cleared
}

/**
 * Invalidate cache for a specific question
 */
export function invalidateCache(question: string, context?: unknown): void {
  const key = generateCacheKey(question, context)
  cache.delete(key)
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  cache.clear()
}

/**
 * Cache expert response for reuse
 */
export function cacheExpertResponse(
  expertId: string,
  question: string,
  response: string,
  ttlHours: number = 168 // 1 week
): void {
  const key = `expert:${expertId}:${question.toLowerCase().trim()}`
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + ttlHours)

  cache.set(key, {
    key,
    value: response,
    expiresAt,
    hitCount: 0,
    costSaved: 0,
  })
}

/**
 * Get cached expert response
 */
export function getCachedExpertResponse(expertId: string, question: string): string | null {
  const key = `expert:${expertId}:${question.toLowerCase().trim()}`
  const entry = cache.get(key)

  if (!entry || new Date() > entry.expiresAt) {
    return null
  }

  entry.hitCount++
  entry.costSaved += 0.01 // Approximate cost saved per hit

  return entry.value as string
}

/**
 * Cache question embedding
 */
export function cacheEmbedding(
  text: string,
  embedding: number[],
  ttlHours: number = 720 // 30 days
): void {
  const key = `embedding:${text.toLowerCase().trim()}`
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + ttlHours)

  cache.set(key, {
    key,
    value: embedding,
    expiresAt,
    hitCount: 0,
    costSaved: 0,
  })
}

/**
 * Get cached embedding
 */
export function getCachedEmbedding(text: string): number[] | null {
  const key = `embedding:${text.toLowerCase().trim()}`
  const entry = cache.get(key)

  if (!entry || new Date() > entry.expiresAt) {
    return null
  }

  entry.hitCount++
  entry.costSaved += 0.0001 // Embedding cost saved

  return entry.value as number[]
}

/**
 * Preload cache with common questions
 */
export function preloadCommonQuestions(_questions: string[]): void {
  // This would run common questions through the system
  // and cache the results for instant access

  // Preloading common questions (would log via logger in production)

  // Placeholder - would actually run debates
  for (const _question of _questions) {
    // await runDebate(_question)
  }
}

/**
 * Get cache recommendations
 */
export function getCacheRecommendations(): string[] {
  const stats = getCacheStats()
  const recommendations: string[] = []

  if (stats.hitRate < 0.3) {
    recommendations.push('Low cache hit rate. Consider preloading common questions.')
  }

  if (stats.entriesCount > 1000) {
    recommendations.push('Cache size is large. Consider reducing TTL or clearing old entries.')
  }

  if (stats.totalCostSaved > 10) {
    recommendations.push(`Cache has saved $${stats.totalCostSaved.toFixed(2)}. Great job!`)
  }

  return recommendations
}
