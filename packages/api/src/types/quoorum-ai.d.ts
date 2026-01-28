/**
 * Type declarations for @quoorum/ai
 * This file ensures DTS builds don't fail when @quoorum/ai hasn't finished building
 */

declare module '@quoorum/ai' {
  export interface AIClient {
    generate(
      prompt: string,
      options?: {
        modelId?: string
        systemPrompt?: string
        temperature?: number
        maxTokens?: number
      }
    ): Promise<{ text: string }>
  }

  export function getAIClient(): AIClient
  export function resetAIClient(): void

  export function parseAIJson<T>(text: string): T
  export function safeParseAIJson<T>(text: string): T | null
  export function cleanJsonResponse(text: string): string
  export function parseAIJsonWithFallback<T>(text: string, fallback: T): T
}
