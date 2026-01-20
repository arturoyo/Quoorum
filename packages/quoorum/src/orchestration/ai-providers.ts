/**
 * AI Providers - Adapters for real LLM integration
 *
 * Conecta el AI Debate Engine con la infraestructura de LLMs de Quoorum.
 */

import type { AIProvider, GenerateOptions } from './ai-debate-types'

// ============================================================================
// LITELLM PROVIDER (Recommended - Unified API)
// ============================================================================

/**
 * LiteLLM Provider - Uses the project's LiteLLM infrastructure
 * Supports: flash, standard, pro, reasoning tiers
 */
export class LiteLLMProvider implements AIProvider {
  private baseUrl: string
  private apiKey: string
  private defaultModel: string

  constructor(options?: { baseUrl?: string; apiKey?: string; model?: string }) {
    this.baseUrl = options?.baseUrl || process.env['LITELLM_URL'] || 'http://localhost:4000'
    this.apiKey =
      options?.apiKey || process.env['LITELLM_API_KEY'] || process.env['LITELLM_MASTER_KEY'] || ''
    this.defaultModel = options?.model || 'standard'
  }

  async generateResponse(prompt: string, options?: GenerateOptions): Promise<string> {
    const messages: Array<{ role: string; content: string }> = []

    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt })
    }
    messages.push({ role: 'user', content: prompt })

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.defaultModel,
        messages,
        max_tokens: options?.maxTokens || 2048,
        temperature: options?.temperature || 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`LiteLLM error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> }
    return data.choices[0]?.message?.content || ''
  }
}

// ============================================================================
// OPENAI PROVIDER
// ============================================================================

export class OpenAIProvider implements AIProvider {
  private apiKey: string
  private model: string

  constructor(options?: { apiKey?: string; model?: string }) {
    this.apiKey = options?.apiKey || process.env['OPENAI_API_KEY'] || ''
    this.model = options?.model || 'gpt-4o-mini'
  }

  async generateResponse(prompt: string, options?: GenerateOptions): Promise<string> {
    const messages: Array<{ role: string; content: string }> = []

    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt })
    }
    messages.push({ role: 'user', content: prompt })

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: options?.maxTokens || 2048,
        temperature: options?.temperature || 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`)
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> }
    return data.choices[0]?.message?.content || ''
  }
}

// ============================================================================
// ANTHROPIC PROVIDER
// ============================================================================

export class AnthropicProvider implements AIProvider {
  private apiKey: string
  private model: string

  constructor(options?: { apiKey?: string; model?: string }) {
    this.apiKey = options?.apiKey || process.env['ANTHROPIC_API_KEY'] || ''
    this.model = options?.model || 'claude-3-haiku-20240307'
  }

  async generateResponse(prompt: string, options?: GenerateOptions): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options?.maxTokens || 2048,
        system: options?.systemPrompt || undefined,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic error: ${response.status}`)
    }

    const data = (await response.json()) as { content: Array<{ text: string }> }
    return data.content[0]?.text || ''
  }
}

// ============================================================================
// GEMINI PROVIDER
// ============================================================================

export class GeminiProvider implements AIProvider {
  private apiKey: string
  private model: string

  constructor(options?: { apiKey?: string; model?: string }) {
    this.apiKey =
      options?.apiKey || process.env['GOOGLE_AI_API_KEY'] || process.env['GEMINI_API_KEY'] || ''
    this.model = options?.model || 'gemini-1.5-flash'
  }

  async generateResponse(prompt: string, options?: GenerateOptions): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`

    const contents = []
    if (options?.systemPrompt) {
      contents.push({ role: 'user', parts: [{ text: options.systemPrompt }] })
      contents.push({ role: 'model', parts: [{ text: 'Entendido.' }] })
    }
    contents.push({ role: 'user', parts: [{ text: prompt }] })

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: options?.temperature || 0.7,
          maxOutputTokens: options?.maxTokens || 2048,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini error: ${response.status}`)
    }

    const data = (await response.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }
}

// ============================================================================
// GROQ PROVIDER (Fast inference)
// ============================================================================

export class GroqProvider implements AIProvider {
  private apiKey: string
  private model: string

  constructor(options?: { apiKey?: string; model?: string }) {
    this.apiKey = options?.apiKey || process.env['GROQ_API_KEY'] || ''
    this.model = options?.model || 'llama-3.1-70b-versatile'
  }

  async generateResponse(prompt: string, options?: GenerateOptions): Promise<string> {
    const messages: Array<{ role: string; content: string }> = []

    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt })
    }
    messages.push({ role: 'user', content: prompt })

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: options?.maxTokens || 2048,
        temperature: options?.temperature || 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq error: ${response.status}`)
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> }
    return data.choices[0]?.message?.content || ''
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export type ProviderType = 'litellm' | 'openai' | 'anthropic' | 'gemini' | 'groq' | 'mock'

/**
 * Create an AI provider instance
 */
export function createProvider(type: ProviderType, options?: Record<string, unknown>): AIProvider {
  switch (type) {
    case 'litellm':
      return new LiteLLMProvider(options as { baseUrl?: string; apiKey?: string; model?: string })
    case 'openai':
      return new OpenAIProvider(options as { apiKey?: string; model?: string })
    case 'anthropic':
      return new AnthropicProvider(options as { apiKey?: string; model?: string })
    case 'gemini':
      return new GeminiProvider(options as { apiKey?: string; model?: string })
    case 'groq':
      return new GroqProvider(options as { apiKey?: string; model?: string })
    case 'mock':
    default: {
      // Import dynamically to avoid circular deps
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment -- Dynamic import for circular deps
      const { MockAIProvider } = require('./ai-mock-provider')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return -- MockAIProvider from require() is any type
      return new MockAIProvider()
    }
  }
}

/**
 * Get the best available provider based on environment
 */
export function getDefaultProvider(): AIProvider {
  // Priority: LiteLLM > OpenAI > Anthropic > Gemini > Groq > Mock
  if (process.env['LITELLM_API_KEY'] || process.env['LITELLM_MASTER_KEY']) {
    return new LiteLLMProvider()
  }
  if (process.env['OPENAI_API_KEY']) {
    return new OpenAIProvider()
  }
  if (process.env['ANTHROPIC_API_KEY']) {
    return new AnthropicProvider()
  }
  if (process.env['GOOGLE_AI_API_KEY'] || process.env['GEMINI_API_KEY']) {
    return new GeminiProvider()
  }
  if (process.env['GROQ_API_KEY']) {
    return new GroqProvider()
  }
  // Fallback to mock
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment -- Dynamic import for circular deps
  const { MockAIProvider } = require('./ai-mock-provider')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return -- MockAIProvider from require() is any type
  return new MockAIProvider()
}

/**
 * Check if any real provider is available
 */
export function hasRealProvider(): boolean {
  return !!(
    process.env['LITELLM_API_KEY'] ||
    process.env['LITELLM_MASTER_KEY'] ||
    process.env['OPENAI_API_KEY'] ||
    process.env['ANTHROPIC_API_KEY'] ||
    process.env['GOOGLE_AI_API_KEY'] ||
    process.env['GEMINI_API_KEY'] ||
    process.env['GROQ_API_KEY']
  )
}
