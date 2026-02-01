/**
 * Embeddings System Types
 *
 * Provider-agnostic embeddings generation system.
 * Supports cloud providers (OpenAI, Cohere) and self-hosted models (Ollama, HuggingFace, custom pods).
 */

export interface EmbeddingProvider {
  /** Unique provider identifier */
  name: string

  /** Human-readable display name */
  displayName: string

  /** Provider type */
  type: 'cloud' | 'self-hosted' | 'hybrid'

  /** Embedding vector dimensions */
  dimensions: number

  /** Maximum number of texts that can be processed in a single batch */
  maxBatchSize: number

  /** List of supported model IDs */
  supportedModels: string[]

  /**
   * Generate embedding for a single text
   * @param text - Text to embed
   * @param model - Optional model ID (uses default if not specified)
   */
  generateEmbedding(text: string, model?: string): Promise<number[]>

  /**
   * Generate embeddings for multiple texts (batch)
   * @param texts - Array of texts to embed
   * @param model - Optional model ID (uses default if not specified)
   */
  generateEmbeddings(texts: string[], model?: string): Promise<number[][]>

  /**
   * Check if the provider is healthy and available
   */
  healthCheck(): Promise<boolean>

  /**
   * Estimate cost for a given token count
   * @param tokenCount - Number of tokens
   * @returns Cost in USD (0 for self-hosted)
   */
  estimateCost(tokenCount: number): number

  /**
   * Get average latency for this provider
   * @returns Latency in milliseconds
   */
  getAverageLatency(): number
}

export interface EmbeddingOptions {
  /** Provider name to use (uses default if not specified) */
  provider?: string

  /** Model ID within the provider */
  model?: string

  /** Expected embedding dimensions (for validation) */
  dimensions?: number

  /** User ID (to fetch user preferences) */
  userId?: string

  /** Company ID (to fetch company preferences) */
  companyId?: string

  /** Cache the embedding (default: true) */
  cache?: boolean
}

export interface EmbeddingResult {
  /** The embedding vector */
  embedding: number[]

  /** Provider used */
  provider: string

  /** Model used */
  model: string

  /** Embedding dimensions */
  dimensions: number

  /** Cost in USD */
  cost: number

  /** Generation latency in ms */
  latency: number

  /** Whether result came from cache */
  fromCache: boolean
}

export interface BatchEmbeddingResult {
  /** Array of embedding vectors */
  embeddings: number[][]

  /** Provider used */
  provider: string

  /** Model used */
  model: string

  /** Embedding dimensions */
  dimensions: number

  /** Total cost in USD */
  totalCost: number

  /** Average cost per embedding in USD */
  averageCost: number

  /** Total latency in ms */
  totalLatency: number

  /** Average latency per embedding in ms */
  averageLatency: number

  /** Number of results from cache */
  cacheHits: number
}

export interface ProviderConfig {
  /** Provider name */
  name: string

  /** Display name */
  displayName: string

  /** Provider type */
  type: 'cloud' | 'self-hosted' | 'hybrid'

  /** API endpoint (for HTTP-based providers) */
  apiEndpoint?: string

  /** API key (for cloud providers) */
  apiKey?: string

  /** Default model */
  defaultModel: string

  /** Supported models */
  supportedModels: string[]

  /** Embedding dimensions */
  dimensions: number

  /** Max batch size */
  maxBatchSize?: number

  /** Cost per 1k tokens (0 for self-hosted) */
  costPer1kTokens?: number
}
