/**
 * Helper to retrieve system prompts from database
 * Falls back to hardcoded defaults if DB query fails
 */

import { db } from '@quoorum/db'
import { sql } from 'drizzle-orm'
import { logger } from './logger'

// Cache for prompts (5 minutes TTL)
const promptCache = new Map<string, { prompt: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get system prompt from DB or fallback to default
 * @param key Prompt key (e.g., 'debates.generateCriticalQuestions')
 * @param fallbackPrompt Default prompt to use if DB query fails
 * @returns The prompt text
 */
export async function getSystemPrompt(
  key: string,
  fallbackPrompt: string
): Promise<string> {
  // Check cache first
  const cached = promptCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.prompt
  }

  try {
    // Try to get from database
    const result = await db.execute(sql`
      SELECT prompt 
      FROM system_prompts 
      WHERE key = ${key} 
        AND is_active = true
      LIMIT 1
    `)

    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0] as Record<string, unknown>
      const prompt = typeof row.prompt === 'string' ? row.prompt : String(row.prompt || '')
      
      // Cache the result
      promptCache.set(key, {
        prompt,
        timestamp: Date.now(),
      })

      logger.debug('[getSystemPrompt] Using DB prompt', { key })
      return prompt
    }

    // If not found in DB, use fallback
    logger.warn('[getSystemPrompt] Prompt not found in DB, using fallback', { key })
    return fallbackPrompt
  } catch (error) {
    // On error, use fallback
    logger.error('[getSystemPrompt] Error fetching prompt from DB, using fallback', {
      key,
      error,
    })
    return fallbackPrompt
  }
}

/**
 * Clear prompt cache (useful after updates)
 */
export function clearPromptCache() {
  promptCache.clear()
  logger.info('[getSystemPrompt] Cache cleared')
}

/**
 * Clear specific prompt from cache
 */
export function clearPromptFromCache(key: string) {
  promptCache.delete(key)
  logger.debug('[getSystemPrompt] Cache cleared for key', { key })
}
