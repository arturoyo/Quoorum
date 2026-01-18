/**
 * Serper Integration
 *
 * Search API for context loading
 */

import { quoorumLogger } from '../logger'
import {
  Map,
} from "lucide-react";


// ============================================================================
// CONFIGURATION
// ============================================================================

const SERPER_API_KEY = process.env['SERPER_API_KEY']
const SERPER_BASE_URL = 'https://google.serper.dev'

// ============================================================================
// TYPES
// ============================================================================

interface SerperSearchResult {
  title: string
  link: string
  snippet: string
  position: number
  date?: string
}

interface SerperNewsResult {
  title: string
  link: string
  snippet: string
  date: string
  source: string
  imageUrl?: string
}

interface SerperSearchResponse {
  searchParameters: {
    q: string
    type: string
    num: number
  }
  organic: SerperSearchResult[]
  answerBox?: {
    answer: string
    snippet: string
    title: string
  }
  knowledgeGraph?: {
    title: string
    type: string
    description: string
  }
}

interface SerperNewsResponse {
  news: SerperNewsResult[]
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
): Promise<SerperSearchResult[]> {
  if (!SERPER_API_KEY) {
    quoorumLogger.warn('SERPER_API_KEY not set, web search disabled', {})
    return []
  }

  try {
    const response = await fetch(`${SERPER_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: options.num || 10,
        gl: options.location || 'us',
      }),
    })

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.statusText}`)
    }

    const data = (await response.json()) as SerperSearchResponse
    return data.organic || []
  } catch (error) {
    quoorumLogger.error(
      'Failed to search web',
      error instanceof Error ? error : new Error(String(error)),
      { query, options }
    )
    return []
  }
}

export async function searchNews(
  query: string,
  options: {
    num?: number
    location?: string
  } = {}
): Promise<SerperNewsResult[]> {
  if (!SERPER_API_KEY) {
    quoorumLogger.warn('SERPER_API_KEY not set, news search disabled', {})
    return []
  }

  try {
    const response = await fetch(`${SERPER_BASE_URL}/news`, {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: options.num || 10,
        gl: options.location || 'us',
      }),
    })

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.statusText}`)
    }

    const data = (await response.json()) as SerperNewsResponse
    return data.news || []
  } catch (error) {
    quoorumLogger.error(
      'Failed to search news',
      error instanceof Error ? error : new Error(String(error)),
      { query, options }
    )
    return []
  }
}

// ============================================================================
// CONTEXT LOADING
// ============================================================================

export async function loadContextForQuestion(
  question: string,
  options: {
    includeNews?: boolean
    maxResults?: number
  } = {}
): Promise<{
  webResults: SerperSearchResult[]
  newsResults: SerperNewsResult[]
  summary: string
}> {
  const webResults = await searchWeb(question, { num: options.maxResults || 5 })

  let newsResults: SerperNewsResult[] = []
  if (options.includeNews) {
    newsResults = await searchNews(question, { num: 3 })
  }

  // Generate summary
  const summary = generateContextSummary(webResults, newsResults)

  return {
    webResults,
    newsResults,
    summary,
  }
}

function generateContextSummary(
  webResults: SerperSearchResult[],
  newsResults: SerperNewsResult[]
): string {
  let summary = '**Context from Web Search:**\n\n'

  if (webResults.length > 0) {
    webResults.slice(0, 3).forEach((result, i) => {
      summary += `${i + 1}. **${result.title}**\n`
      summary += `   ${result.snippet}\n`
      summary += `   Source: ${result.link}\n\n`
    })
  } else {
    summary += 'No web results found.\n\n'
  }

  if (newsResults.length > 0) {
    summary += '**Recent News:**\n\n'
    newsResults.forEach((result, i) => {
      summary += `${i + 1}. **${result.title}** (${result.source}, ${result.date})\n`
      summary += `   ${result.snippet}\n\n`
    })
  }

  return summary
}

// ============================================================================
// INDUSTRY-SPECIFIC SEARCH
// ============================================================================

export async function searchIndustryTrends(industry: string): Promise<SerperSearchResult[]> {
  const query = `${industry} trends 2025 statistics market size`
  return searchWeb(query, { num: 10 })
}

export async function searchCompetitorInfo(company: string): Promise<SerperSearchResult[]> {
  const query = `${company} competitors pricing business model`
  return searchWeb(query, { num: 10 })
}

export async function searchMarketData(topic: string): Promise<SerperSearchResult[]> {
  const query = `${topic} market data statistics research report`
  return searchWeb(query, { num: 10 })
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export async function batchSearch(queries: string[]): Promise<Map<string, SerperSearchResult[]>> {
  const results = new Map<string, SerperSearchResult[]>()

  // Rate limiting: max 5 requests per second
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  for (const query of queries) {
    const searchResults = await searchWeb(query, { num: 5 })
    results.set(query, searchResults)
    await delay(200) // 200ms between requests
  }

  return results
}

// ============================================================================
// CACHE HELPERS
// ============================================================================

const searchCache = new Map<string, { results: unknown; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

export async function searchWebCached(
  query: string,
  options: { num?: number; location?: string } = {}
): Promise<SerperSearchResult[]> {
  const cacheKey = `${query}-${options.num || 10}-${options.location || 'us'}`
  const cached = searchCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    quoorumLogger.debug('Using cached search results', { query, cacheKey })
    return cached.results as SerperSearchResult[]
  }

  const results = await searchWeb(query, options)
  searchCache.set(cacheKey, { results, timestamp: Date.now() })

  return results
}

export function clearSearchCache() {
  searchCache.clear()
}

// ============================================================================
// ANALYTICS
// ============================================================================

let searchCount = 0
let totalSearchTime = 0

export function trackSearch(duration: number) {
  searchCount++
  totalSearchTime += duration
}

export function getSearchStats() {
  return {
    totalSearches: searchCount,
    avgSearchTime: searchCount > 0 ? totalSearchTime / searchCount : 0,
    cacheSize: searchCache.size,
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const SerperAPI = {
  searchWeb,
  searchNews,
  loadContextForQuestion,
  searchIndustryTrends,
  searchCompetitorInfo,
  searchMarketData,
  batchSearch,
  searchWebCached,
  clearSearchCache,
  getSearchStats,
}
