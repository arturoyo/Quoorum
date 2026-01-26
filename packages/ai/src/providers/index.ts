import type { LanguageModelV1 } from "ai";
import type { AIConfig, AIProvider, ProviderFactory } from "../types";
import { anthropicProvider } from "./anthropic";
import { deepseekProvider } from "./deepseek";
import { googleProvider } from "./google";
import { groqProvider } from "./groq";
import { openaiProvider } from "./openai";

export { anthropicProvider } from "./anthropic";
export { deepseekProvider } from "./deepseek";
export { googleProvider } from "./google";
export { groqProvider } from "./groq";
export { openaiProvider } from "./openai";

const providers: Record<AIProvider, ProviderFactory> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  google: googleProvider,
  groq: groqProvider,
  deepseek: deepseekProvider,
};

export function getProvider(name: AIProvider): ProviderFactory {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown AI provider: ${name}`);
  }
  return provider;
}

export function createModel(config: AIConfig): LanguageModelV1 {
  const provider = getProvider(config.provider);
  if (!provider.validateConfig(config)) {
    throw new Error(
      `Invalid config for ${config.provider}: model ${config.model} not supported`
    );
  }
  return provider.createModel(config);
}

export function getDefaultModel(provider: AIProvider): string {
  return getProvider(provider).getDefaultModel();
}

export function getSupportedModels(provider: AIProvider): string[] {
  return getProvider(provider).getSupportedModels();
}

export function getAllProviders(): AIProvider[] {
  return Object.keys(providers) as AIProvider[];
}
