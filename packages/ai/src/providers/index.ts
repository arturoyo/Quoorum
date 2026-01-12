import type { LanguageModelV1 } from "ai";
import type { AIConfig, AIProvider, ProviderFactory } from "../types.js";
import { anthropicProvider } from "./anthropic.js";
import { googleProvider } from "./google.js";
import { groqProvider } from "./groq.js";
import { openaiProvider } from "./openai.js";

export { anthropicProvider } from "./anthropic.js";
export { googleProvider } from "./google.js";
export { groqProvider } from "./groq.js";
export { openaiProvider } from "./openai.js";

const providers: Record<AIProvider, ProviderFactory> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  google: googleProvider,
  groq: groqProvider,
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
