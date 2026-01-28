/**
 * Auto-Research System
 * Automatically researches context for debates using Google Custom Search API or Serper API
 */

import { getAIClient, parseAIJson } from '@quoorum/ai'
import { logger } from './logger'
import { trackAICall } from '@quoorum/quoorum/ai-cost-tracking'

// ============================================================================
// TYPES
// ============================================================================

export interface ResearchResult {
  category: string
  title: string
  summary: string
  sources: Array<{
    title: string
    url: string
    snippet: string
  }>
  confidence: number
}

export interface AutoResearchOutput {
  question: string
  researchResults: ResearchResult[]
  suggestedContext: Record<string, unknown>
  executionTimeMs: number
}

// ============================================================================
// RESEARCH QUERIES GENERATOR
// ============================================================================

async function generateResearchQueries(
  question: string,
  userId: string,
  domain?: string
): Promise<string[]> {
  // Analizar la pregunta primero para entender qué información específica necesita
  const analysisPrompt = `Analiza esta pregunta de negocio y determina qué información específica necesitarías buscar en internet para responderla bien.

Pregunta: "${question}"
${domain ? `Dominio detectado: ${domain}` : ''}

Piensa en:
1. ¿Qué datos concretos necesitas? (tamaño de mercado, precios, benchmarks, etc.)
2. ¿Qué aspectos específicos de la pregunta requieren investigación externa?
3. ¿Qué información de contexto ayudaría a tomar una mejor decisión?

NO busques la pregunta tal cual. En su lugar, identifica los conceptos clave y datos específicos que necesitas.`

  const queryGenerationPrompt = `Basándote en este análisis de la pregunta, genera 3-5 queries de búsqueda en Google que sean ESPECÍFICAS y CONTEXTUALES.

REGLAS:
- NO repitas la pregunta original
- Genera queries que busquen DATOS CONCRETOS, no opiniones genéricas
- Enfócate en información cuantificable: números, estadísticas, benchmarks, casos de estudio
- Si la pregunta es sobre pricing, busca "pricing benchmarks [industria]" o "average pricing [producto]"
- Si es sobre hiring, busca "hiring best practices [rol]" o "salary benchmarks [rol] [ubicación]"
- Si es sobre growth, busca "growth strategies [tipo negocio]" o "growth metrics [industria]"
- Si es sobre producto, busca "product launch success factors" o "MVP validation methods"
- Las queries deben ser en inglés para mejores resultados
- Máximo 5-7 palabras por query

Pregunta original: "${question}"
${domain ? `Dominio: ${domain}` : ''}

Ejemplo de transformación:
[ERROR] MAL: "Should I launch a SaaS product?"
[OK] BIEN: ["SaaS product launch success rate", "SaaS MVP validation methods", "SaaS market entry strategies 2024"]

[ERROR] MAL: "What price should I charge?"
[OK] BIEN: ["SaaS pricing benchmarks 2024", "average SaaS pricing by tier", "pricing strategy best practices"]

Return ONLY a JSON array of search queries, no additional text.`

  try {
    const aiClient = getAIClient()

    // Paso 1: Analizar la pregunta para entender qué necesita
    const startTime1 = Date.now()
    const analysisResponse = await aiClient.generate(analysisPrompt, {
      modelId: 'gemini-2.0-flash-exp',
      temperature: 0.2,
      maxTokens: 300,
    })

    // Track AI cost for analysis (tokens not available from generate(), using estimates)
    void trackAICall({
      userId,
      operationType: 'auto_research_analysis',
      provider: 'google',
      modelId: 'gemini-2.0-flash-exp',
      promptTokens: Math.ceil(analysisPrompt.length / 4), // Estimate ~4 chars per token
      completionTokens: Math.ceil(analysisResponse.text.length / 4),
      latencyMs: Date.now() - startTime1,
      success: true,
      inputSummary: question.substring(0, 500),
      outputSummary: analysisResponse.text.substring(0, 500),
    })

    const analysis = analysisResponse.text.trim()
    
    // Paso 2: Generar queries específicas basadas en el análisis
    const queryPrompt = `${queryGenerationPrompt}

Análisis previo:
${analysis}

Ahora genera las queries específicas:`

    const startTime2 = Date.now()
    const response = await aiClient.generate(queryPrompt, {
      modelId: 'gemini-2.0-flash-exp',
      systemPrompt: 'You are an expert research query generator. You create specific, data-focused search queries. Output ONLY valid JSON array.',
      temperature: 0.3,
      maxTokens: 500,
    })

    // Track AI cost for query generation (tokens not available from generate(), using estimates)
    void trackAICall({
      userId,
      operationType: 'auto_research_queries',
      provider: 'google',
      modelId: 'gemini-2.0-flash-exp',
      promptTokens: Math.ceil(queryPrompt.length / 4), // Estimate ~4 chars per token
      completionTokens: Math.ceil(response.text.length / 4),
      latencyMs: Date.now() - startTime2,
      success: true,
      inputSummary: question.substring(0, 500),
      outputSummary: response.text.substring(0, 500),
    })

    const queries = parseAIJson<string[]>(response.text)

    // Validar y limpiar queries
    const validQueries = queries
      .filter((q) => q && typeof q === 'string' && q.trim().length > 0)
      .map((q) => q.trim())
      .slice(0, 5)

    if (validQueries.length === 0) {
      throw new Error('No valid queries generated')
    }

    logger.info(`[Auto-Research] Generated ${validQueries.length} contextual queries`, {
      question,
      domain,
      queries: validQueries,
    })

    return validQueries
  } catch (error) {
    // Track failed AI call
    void trackAICall({
      userId,
      operationType: 'auto_research_queries',
      provider: 'google',
      modelId: 'gemini-2.0-flash-exp',
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: 0,
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
      inputSummary: question.substring(0, 500),
    })

    logger.error('Failed to generate research queries:', error instanceof Error ? error : undefined)
    
    // Fallback mejorado: generar queries más específicas basadas en keywords
    const keywords = question.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
    const domainContext = domain ? `${domain} ` : ''
    
    return [
      `${domainContext}${keywords.slice(0, 2).join(' ')} benchmarks 2024`,
      `${domainContext}${keywords.slice(0, 2).join(' ')} best practices`,
      `${domainContext}${keywords.slice(0, 2).join(' ')} market data`,
    ].slice(0, 3)
  }
}

// ============================================================================
// RESEARCH EXECUTOR
// ============================================================================

async function executeResearch(queries: string[]): Promise<Map<string, ResearchResult>> {
  const results = new Map<string, ResearchResult>()

  // Try Google Custom Search API first, then Serper as fallback
  const { GoogleSearchAPI } = await import('@quoorum/quoorum/integrations/google-search')
  const { SerperAPI } = await import('@quoorum/quoorum/integrations/serper')
  
  const useGoogleSearch = GoogleSearchAPI.isConfigured()
  const useSerper = SerperAPI.isConfigured()
  
  if (!useGoogleSearch && !useSerper) {
    return results // Return empty if no search API configured
  }

  // Execute searches in parallel with rate limiting
  const searchPromises = queries.map(async (query, index) => {
    // Delay to respect rate limits (200ms between requests)
    await new Promise((resolve) => setTimeout(resolve, index * 250))

    let searchResults: Array<{ title: string; link: string; snippet: string; position: number }> = []

    // Try Google Custom Search first, fallback to Serper if it fails
    if (useGoogleSearch) {
      try {
        searchResults = await GoogleSearchAPI.searchWebCached(query, { num: 5 })
        if (searchResults.length > 0) {
          // Success with Google, continue
        } else if (useSerper) {
          // Google returned empty, try Serper as fallback
          logger.info(`[Auto-Research] Google returned no results for "${query}", trying Serper...`)
          searchResults = await SerperAPI.searchWebCached(query, { num: 5 })
        }
      } catch (error) {
        // Google failed, try Serper as fallback
        logger.warn(`[Auto-Research] Google Custom Search failed for "${query}", trying Serper fallback`, { error: error instanceof Error ? error.message : String(error) })
        if (useSerper) {
          try {
            searchResults = await SerperAPI.searchWebCached(query, { num: 5 })
          } catch (serperError) {
            logger.error(`[Auto-Research] Both Google and Serper failed for "${query}"`, serperError instanceof Error ? serperError : undefined)
            return null
          }
        } else {
          return null
        }
      }
    } else if (useSerper) {
      // Only Serper available
      try {
        searchResults = await SerperAPI.searchWebCached(query, { num: 5 })
      } catch (error) {
        logger.error(`[Auto-Research] Serper failed for "${query}"`, error instanceof Error ? error : undefined)
        return null
      }
    }

    if (searchResults.length === 0) {
      return null
    }

    // Synthesize results with AI
    const synthesis = await synthesizeSearchResults(query, searchResults)

    const result: ResearchResult = {
      category: categorizeQuery(query),
      title: query,
      summary: synthesis.summary,
      sources: searchResults.slice(0, 3).map((r) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
      })),
      confidence: searchResults.length >= 3 ? 0.9 : 0.6,
    }

    return { query, result }
  })

  const completedSearches = await Promise.all(searchPromises)

  completedSearches.forEach((item) => {
    if (item) {
      results.set(item.query, item.result)
    }
  })

  return results
}

function categorizeQuery(query: string): string {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('market') || lowerQuery.includes('size') || lowerQuery.includes('trend')) {
    return 'Market Data'
  }
  if (lowerQuery.includes('competitor') || lowerQuery.includes('pricing')) {
    return 'Competitive Intelligence'
  }
  if (lowerQuery.includes('best practice') || lowerQuery.includes('success factor')) {
    return 'Best Practices'
  }
  if (lowerQuery.includes('news') || lowerQuery.includes('recent')) {
    return 'Recent Developments'
  }

  return 'General Research'
}

// ============================================================================
// SYNTHESIS WITH AI
// ============================================================================

interface SynthesisResult {
  summary: string
  keyPoints: string[]
}

async function synthesizeSearchResults(
  query: string,
  results: Array<{ title: string; snippet: string; link: string }>
): Promise<SynthesisResult> {
  const resultsText = results
    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   Source: ${r.link}`)
    .join('\n\n')

  const prompt = `Query: "${query}"

Search Results:
${resultsText}

Synthesize these search results into:
1. A concise 2-3 sentence summary of key findings
2. 3-5 bullet points with the most important data points

Focus on quantitative data (numbers, percentages, dates) when available.

Output as JSON:
{
  "summary": "...",
  "keyPoints": ["...", "..."]
}`

  try {
    const aiClient = getAIClient()
    const response = await aiClient.generate(prompt, {
      modelId: 'gemini-2.0-flash-exp',
      systemPrompt: 'You are a research synthesizer. Extract key data and insights. Output ONLY valid JSON.',
      temperature: 0.2,
      maxTokens: 1000,
    })

    const parsed = parseAIJson<SynthesisResult>(response.text)
    return parsed
  } catch (error) {
    logger.error('Failed to synthesize results:', error instanceof Error ? error : undefined)
    // Fallback to simple concatenation
    return {
      summary: results
        .slice(0, 2)
        .map((r) => r.snippet)
        .join(' '),
      keyPoints: results.slice(0, 3).map((r) => r.title),
    }
  }
}

// ============================================================================
// CONTEXT PRE-FILL GENERATOR
// ============================================================================

async function generatePreFilledContext(
  question: string,
  researchResults: Map<string, ResearchResult>
): Promise<Record<string, unknown>> {
  const researchSummary = Array.from(researchResults.values())
    .map((r) => `**${r.category}**: ${r.summary}`)
    .join('\n\n')

  const prompt = `Debate Question: "${question}"

Research Findings:
${researchSummary}

Based on this research, generate a pre-filled context object for the debate.
Extract concrete data points that would be useful for experts to debate.

Output as JSON with this structure:
{
  "market": {
    "size": "...",
    "growth": "...",
    "trends": ["..."]
  },
  "competitors": {
    "main": ["..."],
    "pricing": "..."
  },
  "benchmarks": {
    "...": "..."
  }
}

Only include fields where you have concrete data from research.`

  try {
    const aiClient = getAIClient()
    const response = await aiClient.generate(prompt, {
      modelId: 'gemini-2.0-flash-exp',
      systemPrompt:
        'You are a context generator. Extract structured data from research. Output ONLY valid JSON.',
      temperature: 0.2,
      maxTokens: 1500,
    })

    return parseAIJson<Record<string, unknown>>(response.text)
  } catch (error) {
    logger.error('Failed to generate pre-filled context:', error instanceof Error ? error : undefined)
    return {}
  }
}

// ============================================================================
// AI-ONLY RESEARCH (Fallback sin Serper)
// ============================================================================

async function generateAIOnlyResearch(question: string): Promise<ResearchResult[]> {
  const aiClient = getAIClient()

  const prompt = `Analiza esta pregunta de decisión de negocio: "${question}"

Genera 4-5 áreas de investigación clave con insights relevantes basados en tu conocimiento.

Para cada área, proporciona:
1. Categoría (Market Data, Competitive Intelligence, Best Practices, etc.)
2. Título descriptivo
3. Resumen con insights concretos y datos relevantes
4. 2-3 puntos clave accionables

Output como JSON array:
[
  {
    "category": "Market Data",
    "title": "...",
    "summary": "...",
    "keyPoints": ["...", "..."],
    "confidence": 0.75
  }
]

IMPORTANTE: Proporciona información concreta, específica y útil para tomar la decisión.`

  try {
    const response = await aiClient.generate(prompt, {
      modelId: 'gemini-2.0-flash-exp',
      systemPrompt:
        'You are a business research analyst. Provide concrete, actionable insights. Output ONLY valid JSON.',
      temperature: 0.6,
      maxTokens: 2500,
    })

    interface AIResearchItem {
      category: string
      title: string
      summary: string
      keyPoints: string[]
      confidence: number
    }

    const aiResearch = parseAIJson<AIResearchItem[]>(response.text)

    return aiResearch.map((item: AIResearchItem) => ({
      category: item.category,
      title: item.title,
      summary: item.summary,
      sources: [
        {
          title: 'Generado por IA',
          url: '#',
          snippet: item.keyPoints.join(' • '),
        },
      ],
      confidence: item.confidence,
    }))
  } catch (error) {
    logger.error('[AI-Only Research] Failed:', error instanceof Error ? error : undefined)
    // Return basic template
    return [
      {
        category: 'Market Context',
        title: 'Contexto de mercado relevante',
        summary:
          'Considera el tamaño del mercado, tendencias actuales y factores macroeconómicos que podrían afectar esta decisión.',
        sources: [
          {
            title: 'Sugerencia de IA',
            url: '#',
            snippet: 'Investiga tamaño de mercado, crecimiento proyectado y competidores principales',
          },
        ],
        confidence: 0.6,
      },
      {
        category: 'Competitive Intelligence',
        title: 'Análisis competitivo',
        summary:
          'Evalúa qué están haciendo tus competidores principales en situaciones similares y qué puedes aprender de sus éxitos y fracasos.',
        sources: [
          {
            title: 'Sugerencia de IA',
            url: '#',
            snippet: 'Identifica 3-5 competidores clave y analiza sus estrategias',
          },
        ],
        confidence: 0.6,
      },
      {
        category: 'Best Practices',
        title: 'Mejores prácticas de la industria',
        summary:
          'Revisa casos de éxito en tu industria y frameworks probados para tomar este tipo de decisiones.',
        sources: [
          {
            title: 'Sugerencia de IA',
            url: '#',
            snippet: 'Busca case studies y frameworks de referencia en tu vertical',
          },
        ],
        confidence: 0.6,
      },
    ]
  }
}

async function generateContextFromAIResearch(
  question: string,
  researchResults: ResearchResult[]
): Promise<Record<string, unknown>> {
  const aiClient = getAIClient()

  const researchSummary = researchResults
    .map((r) => `**${r.category}**: ${r.summary}`)
    .join('\n\n')

  const prompt = `Pregunta de debate: "${question}"

Insights de investigación:
${researchSummary}

Genera un objeto de contexto estructurado con datos concretos para iniciar el debate.

Output como JSON con estructura flexible adaptada a la pregunta:
{
  "contexto_clave": "...",
  "datos_mercado": {...},
  "consideraciones": [...],
  "opciones_identificadas": [...],
  "criterios_evaluacion": [...]
}

Solo incluye campos relevantes para esta decisión específica.`

  try {
    const response = await aiClient.generate(prompt, {
      modelId: 'gemini-2.0-flash-exp',
      systemPrompt:
        'You are a context generator. Create structured, actionable context. Output ONLY valid JSON.',
      temperature: 0.3,
      maxTokens: 1500,
    })

    return parseAIJson<Record<string, unknown>>(response.text)
  } catch (error) {
    logger.error('[AI Context Generation] Failed:', error instanceof Error ? error : undefined)
    return {
      contexto_clave: researchSummary,
    }
  }
}

// ============================================================================
// MAIN AUTO-RESEARCH FUNCTION
// ============================================================================

export async function performAutoResearch(
  question: string,
  userId: string,
  options?: {
    maxResults?: number
    domain?: string // Business domain (hiring, pricing, growth, etc.)
  }
): Promise<AutoResearchOutput> {
  const startTime = Date.now()

  try {
    // Check if any search API is available (Google Custom Search or Serper)
    const { GoogleSearchAPI } = await import('@quoorum/quoorum/integrations/google-search')
    const { SerperAPI } = await import('@quoorum/quoorum/integrations/serper')
    
    const hasGoogleSearch = GoogleSearchAPI.isConfigured()
    const hasSerper = SerperAPI.isConfigured()
    const hasSearchAPI = hasGoogleSearch || hasSerper

    if (!hasSearchAPI) {
      logger.info('[Auto-Research] No search API configured (Google Custom Search or Serper), using AI-only mode')
      // Fallback to AI-only research (no external searches)
      const aiResults = await generateAIOnlyResearch(question)
      const executionTimeMs = Date.now() - startTime
      return {
        question,
        researchResults: aiResults,
        suggestedContext: await generateContextFromAIResearch(question, aiResults),
        executionTimeMs,
      }
    }

    logger.info(`[Auto-Research] Using ${hasGoogleSearch ? 'Google Custom Search API' : 'Serper API'}`)

    // Step 1: Generate research queries (with domain context if available)
    const queries = await generateResearchQueries(question, userId, options?.domain)
    logger.info(`[Auto-Research] Generated ${queries.length} queries for: "${question}"`, {
      domain: options?.domain,
    })

    // Step 2: Execute research
    const researchResults = await executeResearch(queries)
    logger.info(`[Auto-Research] Completed ${researchResults.size} searches`)

    // If no results from search API, fallback to AI-only
    if (researchResults.size === 0) {
      logger.info('[Auto-Research] No search results, using AI-only mode')
      const aiResults = await generateAIOnlyResearch(question)
      const executionTimeMs = Date.now() - startTime
      return {
        question,
        researchResults: aiResults,
        suggestedContext: await generateContextFromAIResearch(question, aiResults),
        executionTimeMs,
      }
    }

    // Step 3: Generate pre-filled context
    const suggestedContext = await generatePreFilledContext(question, researchResults)

    const executionTimeMs = Date.now() - startTime

    return {
      question,
      researchResults: Array.from(researchResults.values()),
      suggestedContext,
      executionTimeMs,
    }
  } catch (error) {
    logger.error('[Auto-Research] Failed:', error instanceof Error ? error : undefined)
    // Fallback to AI-only on any error
    try {
      const aiResults = await generateAIOnlyResearch(question)
      return {
        question,
        researchResults: aiResults,
        suggestedContext: await generateContextFromAIResearch(question, aiResults),
        executionTimeMs: Date.now() - startTime,
      }
    } catch {
      return {
        question,
        researchResults: [],
        suggestedContext: {},
        executionTimeMs: Date.now() - startTime,
      }
    }
  }
}

// ============================================================================
// SIMILAR DEBATES FINDER
// ============================================================================

export interface SimilarDebate {
  id: string
  question: string
  contextQuality: number
  successfulDimensions: string[]
  expertCount: number
  createdAt: Date
}

export async function findSimilarDebates(
  question: string,
  limit = 3
): Promise<SimilarDebate[]> {
  try {
    // Use Pinecone integration for vector search
    const { searchSimilarDebates } = await import('@quoorum/quoorum/integrations/pinecone')
    
    // Search for similar debates using vector similarity
    const results = await searchSimilarDebates(question, {
      topK: limit,
      minConsensus: 0.5, // Only return debates with at least 50% consensus
    })

    if (results.length === 0) {
      return []
    }

    // Fetch full debate details from database to get context quality and dimensions
    const { db } = await import('@quoorum/db')
    const { quoorumDebates } = await import('@quoorum/db/schema')
    const { inArray } = await import('drizzle-orm')

    const debateIds = results.map((r) => r.id)
    const debates = await db
      .select({
        id: quoorumDebates.id,
        question: quoorumDebates.question,
        consensusScore: quoorumDebates.consensusScore,
        context: quoorumDebates.context,
        finalRanking: quoorumDebates.finalRanking,
        createdAt: quoorumDebates.createdAt,
      })
      .from(quoorumDebates)
      .where(inArray(quoorumDebates.id, debateIds))

    // Map results to SimilarDebate format
    return results
      .map((result) => {
        const debate = debates.find((d) => d.id === result.id)
        if (!debate) return null

        // Extract successful dimensions from context
        const context = debate.context as Record<string, unknown> | undefined
        const successfulDimensions: string[] = []
        
        if (context) {
          // Check which dimensions have data
          const dimensionKeys = ['market', 'competitors', 'benchmarks', 'risks', 'opportunities', 'constraints']
          dimensionKeys.forEach((key) => {
            if (context[key] && Object.keys(context[key] as Record<string, unknown>).length > 0) {
              successfulDimensions.push(key)
            }
          })
        }

        // Calculate context quality (0-100) based on number of dimensions filled
        const contextQuality = Math.min(100, (successfulDimensions.length / 6) * 100)

        // Extract expert count from rounds if available
        const rounds = debate.finalRanking as Array<{ option: string; score: number }> | undefined
        const expertCount = rounds?.length || 0

        return {
          id: debate.id,
          question: debate.question,
          contextQuality,
          successfulDimensions,
          expertCount,
          createdAt: debate.createdAt,
        }
      })
      .filter((debate): debate is SimilarDebate => debate !== null)
      .slice(0, limit)
  } catch (error) {
    logger.error('[findSimilarDebates] Failed:', error instanceof Error ? error : undefined)
    // Fallback: return empty array if Pinecone is not available
    return []
  }
}

// ============================================================================
// COACHING SUGGESTIONS
// ============================================================================

export interface CoachingSuggestion {
  dimensionId: string
  dimensionName: string
  importance: 'critical' | 'important' | 'nice-to-have'
  suggestion: string
  example: string
  percentageOfSuccessfulDebates: number
}

export async function generateCoachingSuggestions(
  question: string,
  currentContext: Record<string, unknown>,
  missingDimensions: string[]
): Promise<CoachingSuggestion[]> {
  if (missingDimensions.length === 0) {
    return []
  }

  const prompt = `Debate Question: "${question}"

Current Context: ${JSON.stringify(currentContext, null, 2)}

Missing Dimensions: ${missingDimensions.join(', ')}

For each missing dimension, generate a coaching suggestion with:
1. Why it's important for this debate
2. A specific example of what to add
3. How critical it is (critical/important/nice-to-have)

Output as JSON array:
[
  {
    "dimensionId": "...",
    "dimensionName": "...",
    "importance": "critical",
    "suggestion": "...",
    "example": "...",
    "percentageOfSuccessfulDebates": 87
  }
]`

  try {
    const aiClient = getAIClient()
    const response = await aiClient.generate(prompt, {
      modelId: 'gemini-2.0-flash-exp',
      systemPrompt: 'You are an AI debate coach. Provide actionable suggestions. Output ONLY valid JSON.',
      temperature: 0.5,
      maxTokens: 2000,
    })

    return parseAIJson<CoachingSuggestion[]>(response.text)
  } catch (error) {
    logger.error('Failed to generate coaching suggestions:', error instanceof Error ? error : undefined)
    return []
  }
}
