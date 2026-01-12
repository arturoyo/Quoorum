import { generateText } from "ai";
import { createModel } from "@quoorum/ai";
import type { ExpertOpinionResult, QualityMetrics, QualityMonitorConfig } from "../types.js";

export class QualityMonitor {
  private config: QualityMonitorConfig;
  private model: ReturnType<typeof createModel>;

  constructor(config: QualityMonitorConfig) {
    this.config = config;
    this.model = createModel(config.aiConfig);
  }

  async assessOpinion(opinion: ExpertOpinionResult, context: string): Promise<number> {
    if (!this.config.enabled) {
      return 0.8;
    }

    const prompt = `
Assess the quality of the following expert opinion on a scale of 0 to 1.

**Context:** ${context}

**Expert:** ${opinion.expertName}
**Opinion:** ${opinion.opinion}
**Reasoning:** ${opinion.reasoning}
**Confidence:** ${opinion.confidence}

Evaluate based on:
1. Relevance to the topic (0-1)
2. Coherence and logical structure (0-1)
3. Depth of analysis (0-1)
4. Constructive contribution (0-1)

Return only a single decimal number representing the overall quality score.
`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.3,
      maxTokens: 50,
    });

    const score = parseFloat(result.text.trim());
    return isNaN(score) ? 0.7 : Math.max(0, Math.min(1, score));
  }

  async assessRound(opinions: ExpertOpinionResult[], topic: string): Promise<QualityMetrics> {
    const confidences = opinions.map((o) => o.confidence);
    const averageConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

    if (!this.config.enabled) {
      return {
        averageConfidence,
        coherenceScore: 0.8,
        diversityScore: 0.8,
        relevanceScore: 0.8,
        overallQuality: 0.8,
      };
    }

    const prompt = `
Analyze the following set of expert opinions for a deliberation on: "${topic}"

${opinions
  .map(
    (o) => `
**${o.expertName}:**
Opinion: ${o.opinion}
Reasoning: ${o.reasoning}
`
  )
  .join("\n---\n")}

Evaluate and return scores (0-1) in this exact format:
COHERENCE: [score] - How well the opinions form a coherent discussion
DIVERSITY: [score] - How diverse are the perspectives
RELEVANCE: [score] - How relevant are the opinions to the topic
`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.3,
      maxTokens: 200,
    });

    const coherenceMatch = result.text.match(/COHERENCE:\s*([\d.]+)/i);
    const diversityMatch = result.text.match(/DIVERSITY:\s*([\d.]+)/i);
    const relevanceMatch = result.text.match(/RELEVANCE:\s*([\d.]+)/i);

    const coherenceScore = coherenceMatch?.[1] ? parseFloat(coherenceMatch[1]) : 0.8;
    const diversityScore = diversityMatch?.[1] ? parseFloat(diversityMatch[1]) : 0.8;
    const relevanceScore = relevanceMatch?.[1] ? parseFloat(relevanceMatch[1]) : 0.8;

    const overallQuality =
      (averageConfidence + coherenceScore + diversityScore + relevanceScore) / 4;

    return {
      averageConfidence,
      coherenceScore: Math.max(0, Math.min(1, coherenceScore)),
      diversityScore: Math.max(0, Math.min(1, diversityScore)),
      relevanceScore: Math.max(0, Math.min(1, relevanceScore)),
      overallQuality: Math.max(0, Math.min(1, overallQuality)),
    };
  }

  meetsThresholds(metrics: QualityMetrics): boolean {
    return (
      metrics.averageConfidence >= this.config.minConfidenceThreshold &&
      metrics.coherenceScore >= this.config.coherenceThreshold &&
      metrics.relevanceScore >= this.config.relevanceThreshold
    );
  }
}

export function createDefaultQualityMonitor(): QualityMonitor {
  return new QualityMonitor({
    enabled: true,
    aiConfig: { provider: "anthropic", model: "claude-3-5-haiku-20241022" },
    minConfidenceThreshold: 0.5,
    coherenceThreshold: 0.6,
    relevanceThreshold: 0.7,
  });
}
