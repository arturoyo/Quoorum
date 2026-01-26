/**
 * Google Custom Search API Integration
 *
 * Alternative to Serper for web search using Google's official API
 * Requires: GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_CUSTOM_SEARCH_ENGINE_ID
 */

import { quoorumLogger } from '../logger'

// ============================================================================
// CONFIGURATION
// ============================================================================

const GOOGLE_API_KEY = process.env['GOOGLE_CUSTOM_SEARCH_API_KEY']
const GOOGLE_CSE_ID = process.env['GOOGLE_CUSTOM_SEARCH_ENGINE_ID']
const GOOGLE_BASE_URL = 'https://www.googleapis.com/customsearch/v1'

// ============================================================================
// TYPES
// ============================================================================

export interface GoogleSearchResult {
  title: string
  link: string
  snippet: string
  position: number
  date?: string
}

interface GoogleSearchResponse {
  items?: Array<{
    title: string
    link: string
    snippet: string
    displayLink: string
    formattedUrl: string
  }>
  searchInformation?: {
    totalResults: string
    searchTime: number
  }
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

export async function searchWeb(
  query: string,
  options: {
    num?: number
    location?: string
  } = {}
): Promise<GoogleSearchResult[]> {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    quoorumLogger.warn('Google Custom Search API not configured', {
      hasApiKey: !!GOOGLE_API_KEY,
      hasCseId: !!GOOGLE_CSE_ID,
    })
    return []
  }

  try {
    // Google Custom Search API limits: max 10 results per request
    const numResults = Math.min(options.num || 10, 10)
    
    const url = new URL(GOOGLE_BASE_URL)
    url.searchParams.set('key', GOOGLE_API_KEY)
    url.searchParams.set('cx', GOOGLE_CSE_ID)
    url.searchParams.set('q', query)
    url.searchParams.set('num', numResults.toString())
    
    // Location/region (gl parameter)
    if (options.location) {
      url.searchParams.set('gl', options.location)
    }

    const response = await fetch(url.toString())

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Google Custom Search API error: ${response.status} - ${errorText}`)
    }

    const data = (await response.json()) as GoogleSearchResponse

    if (!data.items || data.items.length === 0) {
      return []
    }

    return data.items.map((item, index) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet || '',
      position: index + 1,
    }))
  } catch (error) {
    quoorumLogger.error(
      'Failed to search with Google Custom Search API',
      error instanceof Error ? error : new Error(String(error)),
      { query, options }
    )
    return []
  }
}

// ============================================================================
// CACHE HELPERS
// ============================================================================

const searchCache = new Map<string, { results: GoogleSearchResult[]; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

export async function searchWebCached(
  query: string,
  options: { num?: number; location?: string } = {}
): Promise<GoogleSearchResult[]> {
  const cacheKey = `${query}-${options.num || 10}-${options.location || 'us'}`
  const cached = searchCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    quoorumLogger.debug('Using cached Google search results', { query, cacheKey })
    return cached.results
  }

  const results = await searchWeb(query, options)
  searchCache.set(cacheKey, { results, timestamp: Date.now() })

  return results
}

export function clearSearchCache() {
  searchCache.clear()
}

// ============================================================================
// EXPORT
// ============================================================================

export const GoogleSearchAPI = {
  searchWeb,
  searchWebCached,
  clearSearchCache,
  isConfigured: () => !!(GOOGLE_API_KEY && GOOGLE_CSE_ID),
}
