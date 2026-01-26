import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "ai";
import type { AIConfig, ProviderFactory } from "../types";

const SUPPORTED_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-3.5-turbo",
  "o1",
  "o1-mini",
  "o1-preview",
] as const;

export const openaiProvider: ProviderFactory = {
  createModel(config: AIConfig): LanguageModelV1 {
    const openai = createOpenAI({
      apiKey: config.apiKey ?? process.env.OPENAI_API_KEY,
    });
    return openai(config.model);
  },

  validateConfig(config: AIConfig): boolean {
    if (config.provider !== "openai") return false;
    return SUPPORTED_MODELS.includes(config.model as typeof SUPPORTED_MODELS[number]);
  },

  getDefaultModel(): string {
    return "gpt-4o";
  },

  getSupportedModels(): string[] {
    return [...SUPPORTED_MODELS];
  },
};
