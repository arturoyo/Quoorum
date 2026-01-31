import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModelV1 } from "ai";
import type { AIConfig, ProviderFactory } from "../types";

const SUPPORTED_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-pro",
] as const;

export const googleProvider: ProviderFactory = {
  createModel(config: AIConfig): LanguageModelV1 {
    const google = createGoogleGenerativeAI({
      apiKey: config.apiKey ?? process.env.GOOGLE_AI_API_KEY,
    });
    return google(config.model);
  },

  validateConfig(config: AIConfig): boolean {
    if (config.provider !== "google") return false;
    return SUPPORTED_MODELS.includes(config.model as typeof SUPPORTED_MODELS[number]);
  },

  getDefaultModel(): string {
    return "gemini-1.5-pro";
  },

  getSupportedModels(): string[] {
    return [...SUPPORTED_MODELS];
  },
};
