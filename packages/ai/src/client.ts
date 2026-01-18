/**
 * AI Client for Forum
 * Provides a simple interface to generate text using AI models
 * with automatic fallback to cheaper providers when quota exceeded
 */
import { generateText } from "ai";
import { createModel } from "./providers/index.js";
import { getFallbackChain } from "./lib/fallback-config.js";
import type { AIClient, AIResponse, GenerateOptions } from "./types.js";

const DEFAULT_MODEL_ID = "gemini-2.0-flash-exp"; // Using Gemini free tier to avoid OpenAI quota issues

class ForumAIClient implements AIClient {
  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    const modelId = options?.modelId ?? DEFAULT_MODEL_ID;

    // Determine provider from model ID
    const provider = this.getProviderFromModelId(modelId);

    // Get fallback chain starting from current provider
    const fallbackChain = getFallbackChain(provider);

    let lastError: Error | null = null;

    // Try each provider in the fallback chain
    for (let i = 0; i < fallbackChain.length; i++) {
      const fallbackModel = fallbackChain[i]!;

      try {
        if (i > 0) {
          // Log fallback attempt
          console.log(`[AI Client] Falling back to ${fallbackModel.displayName} (${fallbackModel.provider})`)
        }

        const model = createModel({
          provider: fallbackModel.provider,
          model: fallbackModel.modelId,
          temperature: options?.temperature,
          maxTokens: options?.maxTokens,
        });

        const messages: { role: "system" | "user"; content: string }[] = [];

        if (options?.systemPrompt) {
          messages.push({ role: "system", content: options.systemPrompt });
        }

        messages.push({ role: "user", content: prompt });

        const result = await generateText({
          model,
          messages,
          temperature: options?.temperature ?? 0.7,
          maxTokens: options?.maxTokens ?? 4096,
        });

        // Success! Return result
        if (i > 0) {
          console.log(`[AI Client] ✓ Fallback successful with ${fallbackModel.displayName}`)
        }

        return {
          text: result.text,
          usage: result.usage ? {
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
            totalTokens: result.usage.totalTokens,
          } : undefined,
          finishReason: result.finishReason as AIResponse["finishReason"],
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = lastError.message;

        // Check if it's a quota/rate limit/balance error
        const isQuotaError = errorMessage.includes("quota") ||
          errorMessage.includes("rate limit") ||
          errorMessage.includes("429") ||
          errorMessage.includes("insufficient balance") ||
          errorMessage.includes("Insufficient Balance") ||
          errorMessage.includes("insufficient funds") ||
          errorMessage.includes("balance");

        if (isQuotaError) {
          console.warn(`[AI Client] ⚠️  ${fallbackModel.displayName} quota exceeded, trying next fallback...`)
          // Continue to next provider
          continue;
        } else {
          // Other error, don't fallback
          console.error(`[AI Client] ❌ ${fallbackModel.displayName} failed with non-quota error:`, errorMessage)
          throw lastError;
        }
      }
    }

    // All providers failed
    throw new Error(`All AI providers failed. Last error: ${lastError?.message ?? 'Unknown error'}`);
  }

  private getProviderFromModelId(modelId: string): "openai" | "anthropic" | "google" | "groq" | "deepseek" {
    if (modelId.startsWith("gpt-") || modelId.startsWith("o1") || modelId.startsWith("o3")) {
      return "openai";
    }
    if (modelId.startsWith("claude-")) {
      return "anthropic";
    }
    if (modelId.startsWith("gemini-")) {
      return "google";
    }
    if (modelId.startsWith("llama-") || modelId.startsWith("mixtral-")) {
      return "groq";
    }
    if (modelId.startsWith("deepseek-")) {
      return "deepseek";
    }
    // Default to Google (free tier)
    console.warn(`[AI Client] Unknown model prefix for "${modelId}", defaulting to Google Gemini`);
    return "google";
  }
}

let clientInstance: ForumAIClient | null = null;

/**
 * Get the AI client instance (singleton)
 */
export function getAIClient(): AIClient {
  if (!clientInstance) {
    clientInstance = new ForumAIClient();
  }
  return clientInstance;
}

/**
 * Reset the AI client (useful for testing)
 */
export function resetAIClient(): void {
  clientInstance = null;
}
