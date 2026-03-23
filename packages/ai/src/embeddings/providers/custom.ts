/**
 * Custom Embedding Provider
 *
 * Generic provider for self-hosted IA pods or custom embedding services.
 * Configurable via environment variables.
 */

import { BaseEmbeddingProvider } from './base'
import type { ProviderConfig } from '../types'

export class CustomEmbeddingProvider extends BaseEmbeddingProvider {
  name: string
  displayName: string
  type = 'self-hosted' as const
  dimensions: number
  maxBatchSize: number
  supportedModels: string[]

  private apiEndpoint: string
  private apiKey?: string
  private headers: Record<string, string>

  constructor(config: ProviderConfig) {
    super()
    this.name = config.name
    this.displayName = config.displayName
    this.dimensions = config.dimensions
    this.maxBatchSize = config.maxBatchSize || 1
    this.supportedModels = config.supportedModels
    this.apiEndpoint = config.apiEndpoint || ''
    this.apiKey = config.apiKey

    // Build headers
    this.headers = {
      'Content-Type': 'application/json',
    }

    if (this.apiKey) {
      this.headers['Authorization'] = `Bearer ${this.apiKey}`
    }
  }

  async generateEmbedding(text: string, model?: string): Promise<number[]> {
    const modelToUse = this.validateModel(model)

    try {
      const response = await fetch(`${this.apiEndpoint}/embeddings`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          text,
          model: modelToUse,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = (await response.json()) as { embedding: number[] }
      return data.embedding
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Custom provider (${this.name}) error: ${errorMessage}`)
    }
  }

  async generateEmbeddings(texts: string[], model?: string): Promise<number[][]> {
    const modelToUse = this.validateModel(model)

    try {
      // Try batch endpoint first
      const response = await fetch(`${this.apiEndpoint}/embeddings/batch`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          texts,
          model: modelToUse,
        }),
      })

      if (response.ok) {
        const data = (await response.json()) as { embeddings: number[][] }
        return data.embeddings
      }

      // Fallback to sequential processing if batch not supported
      const embeddings: number[][] = []
      for (const text of texts) {
        const embedding = await this.generateEmbedding(text, model)
        embeddings.push(embedding)
      }
      return embeddings
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Custom provider (${this.name}) batch error: ${errorMessage}`)
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/health`, {
        method: 'GET',
        headers: this.headers,
      })
      return response.ok
    } catch {
      return false
    }
  }

  estimateCost(_tokenCount: number): number {
    return 0 // Self-hosted = free
  }

  getAverageLatency(): number {
    // Unknown, depends on pod hardware
    return 150 // ms (reasonable default)
  }
}

/**
 * Create custom provider from environment variables
 */
export function createCustomProviderFromEnv(): CustomEmbeddingProvider | null {
  const enabled = process.env.CUSTOM_EMBEDDING_ENABLED === 'true'

  if (!enabled) {
    return null
  }

  const config: ProviderConfig = {
    name: 'custom',
    displayName: process.env.CUSTOM_EMBEDDING_NAME || 'Custom Provider',
    type: 'self-hosted',
    apiEndpoint: process.env.CUSTOM_EMBEDDING_ENDPOINT || '',
    apiKey: process.env.CUSTOM_EMBEDDING_API_KEY,
    defaultModel: process.env.CUSTOM_EMBEDDING_MODEL || 'default',
    supportedModels: (process.env.CUSTOM_EMBEDDING_MODELS || 'default').split(','),
    dimensions: parseInt(process.env.CUSTOM_EMBEDDING_DIMS || '768'),
    maxBatchSize: parseInt(process.env.CUSTOM_EMBEDDING_BATCH || '1'),
  }

  if (!config.apiEndpoint) {
    console.warn('[Custom Provider] CUSTOM_EMBEDDING_ENDPOINT not set')
    return null
  }

  return new CustomEmbeddingProvider(config)
}
