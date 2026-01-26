/**
 * Forum Context Loader
 *
 * Carga contexto de multiples fuentes: manual, internet, repositorio
 */

import { getAIClient } from '@quoorum/ai'
import * as fs from 'fs/promises'
import * as path from 'path'
import type { ContextSource, LoadedContext } from './types'
import { quoorumLogger } from './logger'

// ============================================================================
// MAIN LOADER
// ============================================================================

export interface LoadContextOptions {
  question: string
  manualContext?: string
  useInternet: boolean
  useRepo: boolean
  repoPath?: string
  userId?: string // Optional: if provided, credits will be deducted for internet searches
}

export async function loadContext(options: LoadContextOptions): Promise<LoadedContext> {
  const { question, manualContext, useInternet, useRepo, repoPath, userId } = options

  const sources: ContextSource[] = []

  // 1. Manual context (always included if provided)
  if (manualContext && manualContext.trim()) {
    sources.push({
      type: 'manual',
      content: manualContext.trim(),
    })
  }

  // 2. Internet search (if enabled)
  if (useInternet) {
    try {
      // Pass manual context and userId to improve search query optimization and deduct credits
      const internetContent = await searchInternet(question, manualContext, userId)
      if (internetContent) {
        sources.push({
          type: 'internet',
          content: internetContent,
          metadata: { query: question },
        })
      }
    } catch {
      // Silently skip if internet search fails
    }
  }

  // 3. Repository context (if enabled)
  if (useRepo && repoPath) {
    try {
      const repoContent = await loadRepoContext(question, repoPath)
      if (repoContent) {
        sources.push({
          type: 'repo',
          content: repoContent,
          metadata: { path: repoPath },
        })
      }
    } catch {
      // Silently skip if repo loading fails
    }
  }

  // Combine all sources
  const combinedContext = sources.map((s) => s.content).join('\n\n---\n\n')

  return {
    sources,
    combinedContext,
  }
}

// ============================================================================
// INTERNET SEARCH
// ============================================================================

const SEARCH_QUERY_PROMPT = `Eres un experto agente de búsqueda en internet. Tu trabajo es transformar preguntas de negocio en queries de búsqueda OPTIMIZADAS que obtengan resultados precisos y relevantes.

PRINCIPIOS CLAVE:
1. **Identifica el tipo de información buscada**:
   - Estadísticas/números → "statistics", "data", "market size", "number of"
   - Tendencias → "trends", "forecast", "growth", "2024", "2025"
   - Mejores prácticas → "best practices", "how to", "guide"
   - Comparaciones → "vs", "comparison", "difference between"
   - Casos de estudio → "case study", "example", "success story"

2. **Extrae entidades específicas**:
   - Industria: "SaaS", "e-commerce", "healthcare", "fintech"
   - Ubicación: "Mexico", "Spain", "US", "Europe"
   - Tamaño: "startup", "SMB", "enterprise"
   - Métricas: "CAC", "LTV", "churn rate", "MRR"

3. **Optimiza para motores de búsqueda**:
   - Usa términos que Google entiende bien
   - Incluye años cuando sea relevante (2024, 2025)
   - Añade palabras clave de búsqueda: "statistics", "data", "report", "study"
   - Usa comillas para frases exactas cuando sea necesario

4. **Sé específico y conciso**:
   - 5-10 palabras máximo
   - En inglés para mejores resultados globales
   - Elimina palabras innecesarias (artículos, preposiciones genéricas)

EJEMPLOS DE TRANSFORMACIÓN INTELIGENTE:

Pregunta: "¿Cuántas empresas de bebidas hay en México?"
Query: "number of beverage companies Mexico statistics"

Pregunta: "¿Cuáles son las tendencias de mercado en SaaS?"
Query: "SaaS market trends 2024 2025 forecast"

Pregunta: "¿Qué precio debería poner a mi producto?"
Query: "SaaS pricing benchmarks by tier 2024"

Pregunta: "¿Cómo contratar desarrolladores?"
Query: "software developer hiring best practices 2024"

Pregunta: "¿Debo lanzar mi producto ahora o esperar?"
Query: "product launch timing best practices market conditions"

Pregunta: "¿Cuál es el tamaño del mercado de IA?"
Query: "artificial intelligence market size statistics 2024"

Pregunta: "¿Qué porcentaje de startups fallan?"
Query: "startup failure rate statistics by industry"

Pregunta: "¿Cuánto cuesta adquirir un cliente en SaaS?"
Query: "SaaS customer acquisition cost CAC benchmarks 2024"

REGLAS FINALES:
- Si la pregunta menciona números/estadísticas → incluye "statistics", "data", "number of"
- Si la pregunta menciona tendencias → incluye "trends", "forecast", año actual
- Si la pregunta menciona ubicación → incluye el país/región
- Si la pregunta menciona industria → incluye el término de la industria
- SIEMPRE optimiza para obtener datos concretos y cuantificables

Responde SOLO con la query optimizada, sin explicaciones adicionales.`

export async function searchInternet(
  question: string,
  context?: string,
  userId?: string
): Promise<string | null> {
  // ============================================================================
  // CREDIT DEDUCTION (if userId provided)
  // ============================================================================
  if (userId) {
    const { deductCredits, hasSufficientCredits, convertUsdToCredits } = await import('./billing/credit-transactions')
    
    // Costo: Serper API ~$0.005 por búsqueda
    // Créditos: ⌈($0.005 × 1.75) / 0.01⌉ = ⌈0.875⌉ = 1 crédito por búsqueda
    const INTERNET_SEARCH_COST_USD = 0.005
    const INTERNET_SEARCH_CREDITS = convertUsdToCredits(INTERNET_SEARCH_COST_USD) // 1 crédito
    
    // Verificar créditos suficientes ANTES de buscar
    const hasCredits = await hasSufficientCredits(userId, INTERNET_SEARCH_CREDITS)
    if (!hasCredits) {
      quoorumLogger.warn('[Internet Search] Insufficient credits', {
        userId,
        required: INTERNET_SEARCH_CREDITS,
        question: question.substring(0, 50),
      })
      return null // No hacer búsqueda si no hay créditos
    }
    
    // Deduct credits atomically BEFORE performing search
    const deductionResult = await deductCredits(
      userId,
      INTERNET_SEARCH_CREDITS,
      undefined, // No debateId for standalone internet search
      'debate_creation', // Source: internet search during context loading
      'Internet search for context enrichment'
    )
    
    if (!deductionResult.success) {
      quoorumLogger.error('[Internet Search] Credit deduction failed', {
        userId,
        credits: INTERNET_SEARCH_CREDITS,
        error: deductionResult.error,
      })
      return null // No hacer búsqueda si falla la deducción
    }
    
    quoorumLogger.info('[Internet Search] Credits deducted', {
      userId,
      credits: INTERNET_SEARCH_CREDITS,
      costUsd: INTERNET_SEARCH_COST_USD,
      remainingCredits: deductionResult.remainingCredits,
    })
  }

  const client = getAIClient()

  // Build enhanced prompt with context if available
  const enhancedPrompt = context
    ? `${SEARCH_QUERY_PROMPT}

CONTEXTO ADICIONAL:
${context}

PREGUNTA:
${question}

Genera la query optimizada considerando tanto la pregunta como el contexto proporcionado.`
    : `${SEARCH_QUERY_PROMPT}

PREGUNTA:
${question}`

  // Generate optimized search query using AI
  const queryResponse = await client.generate(enhancedPrompt, {
    modelId: 'gemini-2.0-flash-exp', // Free tier, más eficiente
    systemPrompt: 'You are an expert search agent. Transform business questions into highly optimized search queries that retrieve precise, actionable data. Focus on extracting specific entities, metrics, locations, and industry terms.',
    temperature: 0.2, // Más determinístico para queries consistentes
    maxTokens: 50, // Queries deben ser cortas
  })

  // Clean and extract query (remove quotes, extra whitespace, etc.)
  let searchQuery = queryResponse.text.trim()
  
  // Remove surrounding quotes if present
  searchQuery = searchQuery.replace(/^["']|["']$/g, '')
  
  // Remove "Query:" or similar prefixes
  searchQuery = searchQuery.replace(/^(query|search|busqueda):\s*/i, '')
  
  // Final trim
  searchQuery = searchQuery.trim()

  // Log the optimization for debugging
  quoorumLogger.info('[Internet Search] Query optimized', {
    original: question.substring(0, 100),
    optimized: searchQuery,
    hasContext: !!context,
    userId: userId || 'anonymous',
  })

  // Try Google Custom Search API first, then Serper as fallback, then AI-only
  try {
    const { GoogleSearchAPI } = await import('./integrations/google-search')
    const { SerperAPI } = await import('./integrations/serper')
    
    const useGoogleSearch = GoogleSearchAPI.isConfigured()
    const useSerper = SerperAPI.isConfigured()

    // Priority 1: Google Custom Search API (official Google API)
    if (useGoogleSearch) {
      try {
        const results = await GoogleSearchAPI.searchWebCached(searchQuery, { num: 5 })
        if (results.length > 0) {
          const snippets = results.map((r) => `${r.title}:\n${r.snippet}\n(${r.link})`).join('\n\n')
          return `[Búsqueda: "${searchQuery}"]\n\n${snippets}`
        } else if (useSerper) {
          // Google returned empty, try Serper as fallback
          quoorumLogger.debug('Google returned no results, trying Serper fallback', { query: searchQuery })
        }
      } catch (googleError) {
        // Google failed, try Serper as fallback
        quoorumLogger.warn('Google Custom Search failed, trying Serper fallback', {
          error: googleError instanceof Error ? googleError.message : String(googleError),
          query: searchQuery,
        })
      }
    }

    // Priority 2: Serper API (fallback if Google not configured or failed)
    if (useSerper) {
      try {
        const results = await SerperAPI.searchWebCached(searchQuery, { num: 5 })
        if (results.length > 0) {
          const snippets = results.map((r) => `${r.title}:\n${r.snippet}\n(${r.link})`).join('\n\n')
          return `[Búsqueda: "${searchQuery}"]\n\n${snippets}`
        }
      } catch (serperError) {
        quoorumLogger.warn('Serper API also failed', {
          error: serperError instanceof Error ? serperError.message : String(serperError),
          query: searchQuery,
        })
      }
    }

    // No search APIs configured or both failed
    if (!useGoogleSearch && !useSerper) {
      return `[Búsqueda: "${searchQuery}"]\nNota: No hay API de búsqueda configurada. Añade GOOGLE_CUSTOM_SEARCH_API_KEY o SERPER_API_KEY.`
    }
    
    return `[Búsqueda: "${searchQuery}"] - No se encontraron resultados`
  } catch (error) {
    quoorumLogger.warn('Web search not available', {
      error: error instanceof Error ? error.message : String(error),
    })
    return `[Búsqueda: "${searchQuery}"]\nNota: Error en búsqueda web. Añade contexto manualmente.`
  }
}

// ============================================================================
// REPOSITORY CONTEXT
// ============================================================================

const RELEVANT_FILES = [
  'PHASES.md',
  'SYSTEM.md',
  'packages/api/src/lib/tier-limits.ts',
  'packages/db/src/schema/plans.ts',
  'packages/db/src/schema/subscriptions.ts',
]

export async function loadRepoContext(question: string, repoPath: string): Promise<string | null> {
  const client = getAIClient()

  // Determine which files are relevant for this question
  const relevantFilesResponse = await client.generate(
    `
Dado esta pregunta de negocio, cuales de estos archivos serian relevantes?
Responde SOLO con los nombres de archivo, uno por linea.

Pregunta: ${question}

Archivos disponibles:
${RELEVANT_FILES.join('\n')}
`,
    {
      modelId: 'gpt-4o-mini',
      temperature: 0.2,
      maxTokens: 100,
    }
  )

  const requestedFiles = relevantFilesResponse.text
    .split('\n')
    .map((f) => f.trim())
    .filter((f) => RELEVANT_FILES.includes(f))

  if (requestedFiles.length === 0) {
    return null
  }

  // Read relevant files
  const fileContents: string[] = []

  for (const file of requestedFiles.slice(0, 3)) {
    // Max 3 files
    try {
      // Security: Validate file path to prevent directory traversal
      const normalizedFile = path.normalize(file).replace(/^(\.\.(\/|\\|$))+/, '')
      const filePath = path.join(repoPath, normalizedFile)
      // Security: Ensure resolved path is within repoPath
      const resolvedPath = path.resolve(filePath)
      const resolvedRepo = path.resolve(repoPath)
      if (!resolvedPath.startsWith(resolvedRepo)) {
        quoorumLogger.warn('Invalid file path detected', { file, resolvedPath, resolvedRepo })
        continue
      }
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path validated above
      const content = await fs.readFile(filePath, 'utf-8')

      // Truncate if too long
      const truncated = content.length > 2000 ? content.slice(0, 2000) + '\n...[truncado]' : content

      fileContents.push(`[${file}]\n${truncated}`)
    } catch {
      // Skip files that can't be read
    }
  }

  if (fileContents.length === 0) {
    return null
  }

  return fileContents.join('\n\n')
}

// ============================================================================
// CONTEXT SYNTHESIS
// ============================================================================

const SYNTHESIS_PROMPT = `
Resume el siguiente contexto en 200 palabras maximo.
Enfocate en datos relevantes para toma de decisiones:
- Numeros clave
- Restricciones conocidas
- Precedentes relevantes

CONTEXTO:
`

export async function synthesizeContext(rawContext: string): Promise<string> {
  if (rawContext.length < 500) {
    return rawContext // No need to synthesize short context
  }

  const client = getAIClient()

  const response = await client.generate(SYNTHESIS_PROMPT + rawContext, {
    modelId: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 300,
  })

  return response.text.trim()
}
