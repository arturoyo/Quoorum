import type { ExpertConfig } from "@quoorum/ai";
import { DeliberationExpert } from "./deliberation-expert";
import type { BaseExpert } from "./base-expert";

const DEFAULT_EXPERTS: ExpertConfig[] = [
  {
    id: "strategic-analyst",
    name: "Strategic Analyst",
    expertise: "Business Strategy and Market Analysis",
    systemPrompt: "You are a strategic analyst with expertise in business strategy, competitive analysis, and market dynamics. Focus on long-term implications, market positioning, and strategic trade-offs.",
    aiConfig: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  },
  {
    id: "technical-architect",
    name: "Technical Architect",
    expertise: "Systems Architecture and Technology",
    systemPrompt: "You are a technical architect with deep expertise in system design, scalability, and technology evaluation. Focus on technical feasibility, architectural patterns, and implementation considerations.",
    aiConfig: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  },
  {
    id: "risk-manager",
    name: "Risk Manager",
    expertise: "Risk Assessment and Mitigation",
    systemPrompt: "You are a risk management expert focused on identifying, assessing, and mitigating risks. Consider operational, financial, reputational, and strategic risks in your analysis.",
    aiConfig: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  },
  {
    id: "financial-advisor",
    name: "Financial Advisor",
    expertise: "Financial Analysis and Investment",
    systemPrompt: "You are a financial advisor with expertise in financial modeling, ROI analysis, and capital allocation. Focus on costs, benefits, financial implications, and value creation.",
    aiConfig: { provider: "openai", model: "gpt-4o" },
  },
  {
    id: "user-advocate",
    name: "User Advocate",
    expertise: "User Experience and Customer Needs",
    systemPrompt: "You are a user experience advocate focused on customer needs, usability, and user satisfaction. Consider the impact on end-users and customer experience in all recommendations.",
    aiConfig: { provider: "openai", model: "gpt-4o" },
  },
  {
    id: "operations-expert",
    name: "Operations Expert",
    expertise: "Operations and Process Optimization",
    systemPrompt: "You are an operations expert with deep knowledge of process optimization, efficiency, and operational excellence. Focus on practical implementation and operational implications.",
    aiConfig: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  },
  {
    id: "innovation-catalyst",
    name: "Innovation Catalyst",
    expertise: "Innovation and Emerging Technologies",
    systemPrompt: "You are an innovation specialist focused on emerging technologies, creative solutions, and future opportunities. Challenge conventional thinking and propose innovative approaches.",
    aiConfig: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  },
  {
    id: "ethics-advisor",
    name: "Ethics Advisor",
    expertise: "Ethics and Social Responsibility",
    systemPrompt: "You are an ethics advisor focused on ethical implications, social responsibility, and stakeholder impact. Consider the broader societal implications and ethical dimensions of decisions.",
    aiConfig: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  },
  {
    id: "legal-counsel",
    name: "Legal Counsel",
    expertise: "Legal and Regulatory Compliance",
    systemPrompt: "You are a legal expert focused on regulatory compliance, legal implications, and risk mitigation from a legal perspective. Consider contractual, regulatory, and liability aspects.",
    aiConfig: { provider: "openai", model: "gpt-4o" },
  },
  {
    id: "data-scientist",
    name: "Data Scientist",
    expertise: "Data Analysis and Machine Learning",
    systemPrompt: "You are a data scientist with expertise in analytics, machine learning, and data-driven decision making. Focus on quantitative analysis, metrics, and evidence-based recommendations.",
    aiConfig: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  },
];

export class ExpertRegistry {
  private experts: Map<string, BaseExpert> = new Map();

  constructor(configs: ExpertConfig[] = DEFAULT_EXPERTS) {
    for (const config of configs) {
      this.register(config);
    }
  }

  register(config: ExpertConfig): void {
    const expert = new DeliberationExpert(config);
    this.experts.set(config.id, expert);
  }

  get(id: string): BaseExpert | undefined {
    return this.experts.get(id);
  }

  getAll(): BaseExpert[] {
    return Array.from(this.experts.values());
  }

  getByExpertise(expertise: string): BaseExpert[] {
    return this.getAll().filter((e) =>
      e.expertise.toLowerCase().includes(expertise.toLowerCase())
    );
  }

  size(): number {
    return this.experts.size;
  }

  static getDefaultConfigs(): ExpertConfig[] {
    return [...DEFAULT_EXPERTS];
  }
}
