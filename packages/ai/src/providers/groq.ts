import { createGroq } from "@ai-sdk/groq";
import type { LanguageModelV1 } from "ai";
import type { AIConfig, ProviderFactory } from "../types";

const SUPPORTED_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
] as const;

export const groqProvider: ProviderFactory = {
  createModel(config: AIConfig): LanguageModelV1 {
    const groq = createGroq({
      apiKey: config.apiKey ?? process.env.GROQ_API_KEY,
    });
    return groq(config.model);
  },

  validateConfig(config: AIConfig): boolean {
    if (config.provider !== "groq") return false;
    return SUPPORTED_MODELS.includes(config.model as typeof SUPPORTED_MODELS[number]);
  },

  getDefaultModel(): string {
    return "llama-3.3-70b-versatile";
  },

  getSupportedModels(): string[] {
    return [...SUPPORTED_MODELS];
  },
};
