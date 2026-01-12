import { generateText } from "ai";
import { createModel, type ExpertConfig } from "@quoorum/ai";
import type { ExpertOpinionResult } from "../types.js";

export abstract class BaseExpert {
  protected config: ExpertConfig;
  protected model: ReturnType<typeof createModel>;

  constructor(config: ExpertConfig) {
    this.config = config;
    this.model = createModel(config.aiConfig);
  }

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get expertise(): string {
    return this.config.expertise;
  }

  abstract generateOpinion(context: ExpertContext): Promise<ExpertOpinionResult>;

  protected async callModel(prompt: string): Promise<string> {
    const result = await generateText({
      model: this.model,
      system: this.config.systemPrompt,
      prompt,
      temperature: this.config.aiConfig.temperature ?? 0.7,
      maxTokens: this.config.aiConfig.maxTokens ?? 2000,
    });
    return result.text;
  }

  protected parseConfidence(text: string): number {
    const match = text.match(/confidence[:\s]*(\d+(?:\.\d+)?)/i);
    if (match?.[1]) {
      const value = parseFloat(match[1]);
      return value > 1 ? value / 100 : value;
    }
    return 0.7;
  }
}

export interface ExpertContext {
  topic: string;
  description: string;
  objectives: string[];
  constraints: string[];
  roundNumber: number;
  previousOpinions?: ExpertOpinionResult[];
  moderatorGuidance?: string;
}
