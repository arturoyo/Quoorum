/**
 * OpenAI Embedding Provider
 *
 * Cloud-based embeddings using OpenAI's text-embedding models.
 */

import OpenAI from 'openai'
import { BaseEmbeddingProvider } from './base'

export class OpenAIEmbeddingProvider extends BaseEmbeddingProvider {
  name = 'openai'
  displayName = 'OpenAI Embeddings'
  type = 'cloud' as const
  dimensions = 1536 // text-embedding-3-small
  maxBatchSize = 2048
  supportedModels = [
    'text-embedding-3-small', // 1536 dims, $0.02 / 1M tokens
    'text-embedding-3-large', // 3072 dims, $0.13 / 1M tokens
    'text-embedding-ada-002', // 1536 dims, $0.10 / 1M tokens (legacy)
  ]

  private client: OpenAI

  constructor(apiKey: string) {
    super()
    this.client = new OpenAI({ apiKey })
  }

  async generateEmbedding(text: string, model?: string): Promise<number[]> {
    const modelToUse = this.validateModel(model)

    try {
      const response = await this.client.embeddings.create({
        model: modelToUse,
        input: text,
        encoding_format: 'float',
      })

      return response.data[0]?.embedding || []
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`OpenAI embeddings error: ${errorMessage}`)
    }
  }

  async generateEmbeddings(texts: string[], model?: string): Promise<number[][]> {
    const modelToUse = this.validateModel(model)

    // OpenAI allows up to 2048 inputs per request
    const batches = this.chunkArray(texts, this.maxBatchSize)
    const allEmbeddings: number[][] = []

    for (const batch of batches) {
      try {
        const response = await this.client.embeddings.create({
          model: modelToUse,
          input: batch,
          encoding_format: 'float',
        })

        allEmbeddings.push(...response.data.map((d) => d.embedding))
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw new Error(`OpenAI embeddings batch error: ${errorMessage}`)
      }
    }

    return allEmbeddings
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.generateEmbedding('test', 'text-embedding-3-small')
      return true
    } catch {
      return false
    }
  }

  estimateCost(tokenCount: number): number {
    // text-embedding-3-small: $0.02 / 1M tokens
    return (tokenCount / 1_000_000) * 0.02
  }

  getAverageLatency(): number {
    // Typical OpenAI embedding latency
    return 200 // ms
  }

  /**
   * Get dimensions for a specific model
   */
  getDimensionsForModel(model: string): number {
    switch (model) {
      case 'text-embedding-3-small':
      case 'text-embedding-ada-002':
        return 1536
      case 'text-embedding-3-large':
        return 3072
      default:
        return this.dimensions
    }
  }
}
