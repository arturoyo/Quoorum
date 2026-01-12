import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModelV1 } from "ai";
import type { AIConfig, ProviderFactory } from "../types.js";

const SUPPORTED_MODELS = [
  "claude-opus-4-5-20251101",
  "claude-sonnet-4-20250514",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "claude-3-opus-20240229",
  "claude-3-sonnet-20240229",
  "claude-3-haiku-20240307",
] as const;

export const anthropicProvider: ProviderFactory = {
  createModel(config: AIConfig): LanguageModelV1 {
    const anthropic = createAnthropic({
      apiKey: config.apiKey ?? process.env.ANTHROPIC_API_KEY,
    });
    return anthropic(config.model);
  },

  validateConfig(config: AIConfig): boolean {
    if (config.provider !== "anthropic") return false;
    return SUPPORTED_MODELS.includes(config.model as typeof SUPPORTED_MODELS[number]);
  },

  getDefaultModel(): string {
    return "claude-sonnet-4-20250514";
  },

  getSupportedModels(): string[] {
    return [...SUPPORTED_MODELS];
  },
};
