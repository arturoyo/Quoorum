/**
 * Webhook Rate Limiting
 *
 * Protects webhook endpoints from spam and abuse
 * Max 100 requests per minute per IP
 */

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// In-memory rate limiting (production should use Redis/Upstash)
const ipRequestCounts = new Map<
  string,
  {
    count: number
    resetAt: number
  }
>()

const RATE_LIMIT = 100 // Max requests per window
const WINDOW_MS = 60 * 1000 // 1 minute

/**
 * Check rate limit for webhook endpoint
 *
 * @param ip - Client IP address
 * @returns Rate limit result
 */
export async function checkWebhookRateLimit(ip: string): Promise<RateLimitResult> {
  const now = Date.now()

  // Get or initialize counter for this IP
  let ipData = ipRequestCounts.get(ip)

  if (!ipData || now > ipData.resetAt) {
    // Initialize new window
    ipData = {
      count: 0,
      resetAt: now + WINDOW_MS,
    }
    ipRequestCounts.set(ip, ipData)
  }

  // Increment request count
  ipData.count++

  const remaining = Math.max(0, RATE_LIMIT - ipData.count)
  const success = ipData.count <= RATE_LIMIT

  // Cleanup old entries (prevent memory leak)
  cleanupExpiredEntries(now)

  return {
    success,
    limit: RATE_LIMIT,
    remaining,
    reset: ipData.resetAt,
  }
}

/**
 * Remove expired entries from memory
 */
function cleanupExpiredEntries(now: number) {
  // Only cleanup every 100 checks to avoid performance impact
  if (Math.random() > 0.01) return

  for (const [ip, data] of ipRequestCounts.entries()) {
    if (now > data.resetAt) {
      ipRequestCounts.delete(ip)
    }
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.reset / 1000)), // Unix timestamp
    'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)), // Seconds
  }
}

/**
 * Extract client IP from request
 * Supports Vercel, Cloudflare, and standard headers
 */
export function getClientIp(headers: Headers): string {
  // Try Vercel headers first
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  // Try Cloudflare
  const cfConnectingIp = headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Try X-Real-IP
  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback
  return 'unknown'
}

/**
 * Reset rate limit for an IP (useful for testing)
 */
export function resetRateLimit(ip: string): void {
  ipRequestCounts.delete(ip)
}

/**
 * Get current rate limit status for an IP
 */
export function getRateLimitStatus(ip: string): {
  requests: number
  limit: number
  resetAt: number
} | null {
  const data = ipRequestCounts.get(ip)
  if (!data) return null

  return {
    requests: data.count,
    limit: RATE_LIMIT,
    resetAt: data.resetAt,
  }
}
