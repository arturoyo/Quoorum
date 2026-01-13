import type { LanguageModelV1 } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { AIConfig, ProviderFactory } from "../types.js";

// DeepSeek uses OpenAI-compatible API
const deepseekModels = ["deepseek-chat", "deepseek-coder"] as const;

export const deepseekProvider: ProviderFactory = {
  validateConfig(config: AIConfig): boolean {
    return (
      config.provider === "deepseek" &&
      deepseekModels.includes(config.model as (typeof deepseekModels)[number])
    );
  },

  createModel(config: AIConfig): LanguageModelV1 {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY environment variable is not set");
    }

    const deepseek = createOpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com",
    });

    return deepseek(config.model);
  },

  getDefaultModel(): string {
    return "deepseek-chat";
  },

  getSupportedModels(): string[] {
    return [...deepseekModels];
  },
};
