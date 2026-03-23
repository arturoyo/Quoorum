/**
 * Base Embedding Provider
 *
 * Abstract base class that all embedding providers must extend.
 */

import type { EmbeddingProvider } from '../types'

export abstract class BaseEmbeddingProvider implements EmbeddingProvider {
  abstract name: string
  abstract displayName: string
  abstract type: 'cloud' | 'self-hosted' | 'hybrid'
  abstract dimensions: number
  abstract maxBatchSize: number
  abstract supportedModels: string[]

  abstract generateEmbedding(text: string, model?: string): Promise<number[]>
  abstract generateEmbeddings(texts: string[], model?: string): Promise<number[][]>
  abstract healthCheck(): Promise<boolean>

  /**
   * Estimate cost (override in cloud providers, return 0 for self-hosted)
   */
  estimateCost(tokenCount: number): number {
    return 0
  }

  /**
   * Get average latency (override with real metrics)
   */
  getAverageLatency(): number {
    return 0
  }

  /**
   * Utility: chunk array into batches
   */
  protected chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * Utility: estimate token count from text
   * Rough estimate: 1 token ≈ 4 characters
   */
  protected estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  /**
   * Utility: validate model is supported
   */
  protected validateModel(model?: string): string {
    const modelToUse = model || this.supportedModels[0]

    if (!modelToUse) {
      throw new Error(`No default model available for ${this.name}`)
    }

    if (!this.supportedModels.includes(modelToUse)) {
      throw new Error(
        `Model ${modelToUse} not supported by ${this.name}. ` +
          `Supported models: ${this.supportedModels.join(', ')}`
      )
    }

    return modelToUse
  }
}
