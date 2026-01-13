import type { LanguageModelV1 } from "ai";

export type AIProvider = "openai" | "anthropic" | "google" | "groq" | "deepseek";

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: "stop" | "length" | "content-filter" | "tool-calls" | "error";
}

export interface AIStreamCallbacks {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onComplete?: (response: AIResponse) => void;
  onError?: (error: Error) => void;
}

export interface ProviderFactory {
  createModel(config: AIConfig): LanguageModelV1;
  validateConfig(config: AIConfig): boolean;
  getDefaultModel(): string;
  getSupportedModels(): string[];
}

export interface ExpertConfig {
  id: string;
  name: string;
  expertise: string;
  systemPrompt: string;
  aiConfig: AIConfig;
}

export interface DeliberationContext {
  topic: string;
  description: string;
  constraints?: string[];
  objectives?: string[];
  timeLimit?: number;
}

export interface ExpertOpinion {
  expertId: string;
  opinion: string;
  confidence: number;
  reasoning: string;
  timestamp: Date;
}

export interface ConsensusResult {
  achieved: boolean;
  summary: string;
  dissenting: string[];
  confidence: number;
}

export interface GenerateOptions {
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIClient {
  generate(prompt: string, options?: GenerateOptions): Promise<AIResponse>;
}
