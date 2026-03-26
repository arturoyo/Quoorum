import type { LanguageModelV1 } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import type { AIConfig, ProviderFactory } from "../types"

const SUPPORTED_MODELS = [
  "optym-balanced",
  "optym-conservative",
  "optym-aggressive",
  "optym-auto",
  "optym-fast",
  "optym-quality",
] as const

export const optymProvider: ProviderFactory = {
  createModel(config: AIConfig): LanguageModelV1 {
    const apiKey = process.env.OPTYM_API_KEY
    if (!apiKey) {
      throw new Error("OPTYM_API_KEY environment variable is not set")
    }

    const baseURL = process.env.OPTYM_BASE_URL || "https://api.optym.pro/v1"
    const optym = createOpenAI({
      apiKey,
      baseURL,
    })

    return optym(config.model)
  },

  validateConfig(config: AIConfig): boolean {
    return (
      config.provider === "optym" &&
      SUPPORTED_MODELS.includes(config.model as (typeof SUPPORTED_MODELS)[number])
    )
  },

  getDefaultModel(): string {
    return "optym-balanced"
  },

  getSupportedModels(): string[] {
    return [...SUPPORTED_MODELS]
  },
}
