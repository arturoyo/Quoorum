/**
 * Unified Embeddings API
 *
 * Provider-agnostic interface for generating embeddings.
 * Automatically selects the best provider based on user preferences.
 */

import { EmbeddingProviderRegistry } from './registry'
import type { EmbeddingOptions, EmbeddingResult, BatchEmbeddingResult } from './types'

// Initialize registry on module load
EmbeddingProviderRegistry.initialize().catch((error) => {
  console.error('[Embeddings] Failed to initialize registry:', error)
})

/**
 * Generate embedding for a single text
 *
 * @param text - Text to embed
 * @param options - Generation options
 * @returns Embedding result with metadata
 *
 * @example
 * ```typescript
 * const result = await generateEmbedding('Hello world', {
 *   userId: 'user-123',
 *   provider: 'openai'
 * })
 *
 * console.log(result.embedding) // [0.123, -0.456, ...]
 * console.log(result.dimensions) // 1536
 * console.log(result.cost) // 0.00001
 * ```
 */
export async function generateEmbedding(
  text: string,
  options: EmbeddingOptions = {}
): Promise<EmbeddingResult> {
  const startTime = Date.now()

  // 1. Get provider
  const provider = await EmbeddingProviderRegistry.getProviderForUser(
    options.userId,
    options.companyId,
    options.provider
  )

  // 2. Generate embedding
  const embedding = await provider.generateEmbedding(text, options.model)

  // 3. Calculate metrics
  const latency = Date.now() - startTime
  const tokenCount = estimateTokens(text)
  const cost = provider.estimateCost(tokenCount)

  return {
    embedding,
    provider: provider.name,
    model: options.model || provider.supportedModels[0] || 'default',
    dimensions: provider.dimensions,
    cost,
    latency,
    fromCache: false, // TODO: Implement caching
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 *
 * @param texts - Array of texts to embed
 * @param options - Generation options
 * @returns Batch embedding result with metadata
 *
 * @example
 * ```typescript
 * const result = await generateEmbeddings(
 *   ['Hello world', 'Goodbye world'],
 *   { provider: 'local-ollama' }
 * )
 *
 * console.log(result.embeddings.length) // 2
 * console.log(result.totalCost) // 0 (local is free)
 * ```
 */
export async function generateEmbeddings(
  texts: string[],
  options: EmbeddingOptions = {}
): Promise<BatchEmbeddingResult> {
  const startTime = Date.now()

  // 1. Get provider
  const provider = await EmbeddingProviderRegistry.getProviderForUser(
    options.userId,
    options.companyId,
    options.provider
  )

  // 2. Generate embeddings
  const embeddings = await provider.generateEmbeddings(texts, options.model)

  // 3. Calculate metrics
  const totalLatency = Date.now() - startTime
  const averageLatency = totalLatency / texts.length

  const totalTokens = texts.reduce((sum, text) => sum + estimateTokens(text), 0)
  const totalCost = provider.estimateCost(totalTokens)
  const averageCost = totalCost / texts.length

  return {
    embeddings,
    provider: provider.name,
    model: options.model || provider.supportedModels[0] || 'default',
    dimensions: provider.dimensions,
    totalCost,
    averageCost,
    totalLatency,
    averageLatency,
    cacheHits: 0, // TODO: Implement caching
  }
}

/**
 * Estimate token count from text
 * Rough estimate: 1 token ≈ 4 characters
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * List available embedding providers
 */
export async function listEmbeddingProviders() {
  return EmbeddingProviderRegistry.listProviders()
}

/**
 * Check health of all providers
 */
export async function checkProvidersHealth() {
  return EmbeddingProviderRegistry.healthCheckAll()
}

// Re-export types
export type { EmbeddingProvider, EmbeddingOptions, EmbeddingResult, BatchEmbeddingResult } from './types'
export { EmbeddingProviderRegistry } from './registry'
