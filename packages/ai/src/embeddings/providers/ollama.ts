/**
 * Ollama Embedding Provider
 *
 * Self-hosted embeddings using Ollama (local LLM runtime).
 * Zero cost, runs on your own hardware.
 */

import { BaseEmbeddingProvider } from './base'

export class OllamaEmbeddingProvider extends BaseEmbeddingProvider {
  name = 'local-ollama'
  displayName = 'Ollama (Local)'
  type = 'self-hosted' as const
  dimensions = 768 // all-minilm default
  maxBatchSize = 1 // Ollama processes one at a time
  supportedModels = [
    'all-minilm', // 768 dims, fast, good quality
    'nomic-embed-text', // 768 dims, strong performance
    'mxbai-embed-large', // 1024 dims, best quality
  ]

  private baseUrl: string

  constructor(baseUrl = 'http://localhost:11434') {
    super()
    this.baseUrl = baseUrl
  }

  async generateEmbedding(text: string, model?: string): Promise<number[]> {
    const modelToUse = this.validateModel(model)

    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelToUse,
          prompt: text,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = (await response.json()) as { embedding: number[] }
      return data.embedding
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Ollama embeddings error: ${errorMessage}`)
    }
  }

  async generateEmbeddings(texts: string[], model?: string): Promise<number[][]> {
    // Ollama doesn't support batch processing, process sequentially
    const embeddings: number[][] = []

    for (const text of texts) {
      const embedding = await this.generateEmbedding(text, model)
      embeddings.push(embedding)
    }

    return embeddings
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      })
      return response.ok
    } catch {
      return false
    }
  }

  estimateCost(_tokenCount: number): number {
    return 0 // Local = free
  }

  getAverageLatency(): number {
    // Depends on hardware, but typically faster than cloud
    return 100 // ms (on decent hardware)
  }

  /**
   * Get dimensions for a specific model
   */
  getDimensionsForModel(model: string): number {
    switch (model) {
      case 'all-minilm':
      case 'nomic-embed-text':
        return 768
      case 'mxbai-embed-large':
        return 1024
      default:
        return this.dimensions
    }
  }

  /**
   * List available models on the Ollama instance
   */
  async listAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      if (!response.ok) return []

      const data = (await response.json()) as { models: Array<{ name: string }> }
      return data.models.map((m) => m.name)
    } catch {
      return []
    }
  }
}
