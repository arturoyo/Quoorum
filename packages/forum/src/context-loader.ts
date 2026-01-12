/**
 * Forum Context Loader
 *
 * Carga contexto de multiples fuentes: manual, internet, repositorio
 */

import { getAIClient } from '@quoorum/ai'
import * as fs from 'fs/promises'
import * as path from 'path'
import type { ContextSource, LoadedContext } from './types'
import { forumLogger } from './forum-logger'

// ============================================================================
// MAIN LOADER
// ============================================================================

export interface LoadContextOptions {
  question: string
  manualContext?: string
  useInternet: boolean
  useRepo: boolean
  repoPath?: string
}

export async function loadContext(options: LoadContextOptions): Promise<LoadedContext> {
  const { question, manualContext, useInternet, useRepo, repoPath } = options

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
      const internetContent = await searchInternet(question)
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

const SEARCH_QUERY_PROMPT = `
Genera una query de busqueda en Google para responder esta pregunta de negocio.
La query debe ser concisa (3-5 palabras) y en ingles para mejores resultados.

Pregunta:
`

export async function searchInternet(question: string): Promise<string | null> {
  const client = getAIClient()

  // Generate search query
  const queryResponse = await client.generate(SEARCH_QUERY_PROMPT + question, {
    modelId: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 50,
  })

  const searchQuery = queryResponse.text.trim()

  // Use Serper integration
  try {
    const { searchWeb } = await import('./integrations/serper')
    const results = await searchWeb(searchQuery, { num: 5 })

    if (results.length === 0) {
      return `[Búsqueda: "${searchQuery}"] - No se encontraron resultados`
    }

    const snippets = results.map((r) => `${r.title}:\n${r.snippet}\n(${r.link})`).join('\n\n')
    return `[Búsqueda: "${searchQuery}"]\n\n${snippets}`
  } catch (error) {
    forumLogger.warn('Serper not available', {
      error: error instanceof Error ? error.message : String(error),
    })
    return `[Búsqueda: "${searchQuery}"]\nNota: SERPER_API_KEY no configurada. Añade contexto manualmente.`
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
        forumLogger.warn('Invalid file path detected', { file, resolvedPath, resolvedRepo })
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
