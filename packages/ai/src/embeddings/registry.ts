/**
 * Embedding Provider Registry
 *
 * Manages all available embedding providers and handles provider selection
 * based on user/company preferences with automatic fallback.
 */

import type { EmbeddingProvider } from './types'
import { OpenAIEmbeddingProvider } from './providers/openai'
import { OllamaEmbeddingProvider } from './providers/ollama'
import { createCustomProviderFromEnv } from './providers/custom'

export class EmbeddingProviderRegistry {
  private static providers = new Map<string, EmbeddingProvider>()
  private static initialized = false

  /**
   * Initialize all available providers from environment variables
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    // 1. OpenAI (if API key provided)
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAIEmbeddingProvider(process.env.OPENAI_API_KEY)
        this.providers.set('openai', openai)
        console.log('[Embeddings] OpenAI provider initialized')
      } catch (error) {
        console.error('[Embeddings] Failed to initialize OpenAI:', error)
      }
    }

    // 2. Ollama (if enabled)
    if (process.env.OLLAMA_ENABLED === 'true') {
      try {
        const ollama = new OllamaEmbeddingProvider(
          process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
        )

        // Only register if healthy
        if (await ollama.healthCheck()) {
          this.providers.set('local-ollama', ollama)
          console.log('[Embeddings] Ollama provider initialized')
        } else {
          console.warn('[Embeddings] Ollama not healthy, skipping')
        }
      } catch (error) {
        console.error('[Embeddings] Failed to initialize Ollama:', error)
      }
    }

    // 3. Custom provider (from env vars)
    const customProvider = createCustomProviderFromEnv()
    if (customProvider) {
      try {
        if (await customProvider.healthCheck()) {
          this.providers.set(customProvider.name, customProvider)
          console.log(`[Embeddings] Custom provider "${customProvider.displayName}" initialized`)
        } else {
          console.warn(`[Embeddings] Custom provider not healthy, skipping`)
        }
      } catch (error) {
        console.error('[Embeddings] Failed to initialize custom provider:', error)
      }
    }

    // 4. Run health checks on all providers
    await this.healthCheckAll()

    this.initialized = true
    console.log(`[Embeddings] Registry initialized with ${this.providers.size} providers`)
  }

  /**
   * Get provider by name
   */
  static getProvider(name: string): EmbeddingProvider | undefined {
    return this.providers.get(name)
  }

  /**
   * Get default provider (first healthy one in priority order)
   */
  static async getDefaultProvider(): Promise<EmbeddingProvider> {
    await this.ensureInitialized()

    // Priority order: openai → local-ollama → custom
    const priorityOrder = ['openai', 'local-ollama', 'custom']

    for (const providerName of priorityOrder) {
      const provider = this.providers.get(providerName)
      if (provider && (await provider.healthCheck())) {
        return provider
      }
    }

    // If no provider is healthy, try any available provider
    for (const provider of this.providers.values()) {
      if (await provider.healthCheck()) {
        return provider
      }
    }

    throw new Error('No healthy embedding provider found')
  }

  /**
   * Get provider for user (respecting preferences)
   * Falls back to default if user preference not available
   */
  static async getProviderForUser(
    userId?: string,
    companyId?: string,
    preferredProvider?: string
  ): Promise<EmbeddingProvider> {
    await this.ensureInitialized()

    // 1. Try preferred provider if specified
    if (preferredProvider) {
      const provider = this.providers.get(preferredProvider)
      if (provider && (await provider.healthCheck())) {
        return provider
      }
    }

    // 2. TODO: Check user preferences from database
    // if (userId) {
    //   const userPref = await getUserEmbeddingPreference(userId)
    //   if (userPref) {
    //     const provider = this.providers.get(userPref.primaryProvider)
    //     if (provider && await provider.healthCheck()) {
    //       return provider
    //     }
    //
    //     // Try fallbacks
    //     for (const fallback of userPref.fallbacks || []) {
    //       const fallbackProvider = this.providers.get(fallback)
    //       if (fallbackProvider && await fallbackProvider.healthCheck()) {
    //         return fallbackProvider
    //       }
    //     }
    //   }
    // }

    // 3. TODO: Check company preferences from database
    // if (companyId) {
    //   const companyPref = await getCompanyEmbeddingPreference(companyId)
    //   // Similar logic as above
    // }

    // 4. Fallback to default provider
    return this.getDefaultProvider()
  }

  /**
   * Health check all providers
   */
  static async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}

    for (const [name, provider] of this.providers.entries()) {
      try {
        results[name] = await provider.healthCheck()
      } catch {
        results[name] = false
      }
    }

    return results
  }

  /**
   * List all available providers with their health status
   */
  static async listProviders(): Promise<
    Array<{
      name: string
      displayName: string
      type: string
      dimensions: number
      healthy: boolean
      cost: 'free' | 'paid'
    }>
  > {
    await this.ensureInitialized()

    const health = await this.healthCheckAll()

    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      displayName: provider.displayName,
      type: provider.type,
      dimensions: provider.dimensions,
      healthy: health[name] || false,
      cost: provider.type === 'cloud' ? 'paid' : 'free',
    }))
  }

  /**
   * Ensure registry is initialized before use
   */
  private static async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
  }

  /**
   * Clear all providers (for testing)
   */
  static clear(): void {
    this.providers.clear()
    this.initialized = false
  }
}
