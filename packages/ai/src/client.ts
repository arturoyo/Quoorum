/**
 * AI Client for Forum
 * Provides a simple interface to generate text using AI models
 */
import { generateText } from "ai";
import { createModel } from "./providers/index.js";
import type { AIClient, AIResponse, GenerateOptions } from "./types.js";

const DEFAULT_MODEL_ID = "gpt-4o-mini";

class ForumAIClient implements AIClient {
  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    const modelId = options?.modelId ?? DEFAULT_MODEL_ID;

    // Determine provider from model ID
    const provider = this.getProviderFromModelId(modelId);

    const model = createModel({
      provider,
      model: modelId,
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

    return {
      text: result.text,
      usage: result.usage ? {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      } : undefined,
      finishReason: result.finishReason as AIResponse["finishReason"],
    };
  }

  private getProviderFromModelId(modelId: string): "openai" | "anthropic" | "google" | "groq" {
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
    // Default to OpenAI
    return "openai";
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
