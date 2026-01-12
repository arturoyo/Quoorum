import { generateText } from "ai";
import { createModel } from "@forum/ai";
import type {
  ExpertOpinionResult,
  FinalConsensus,
  MetaModeratorConfig,
  QualityMetrics,
  RoundResult,
} from "../types.js";

export class MetaModerator {
  private config: MetaModeratorConfig;
  private model: ReturnType<typeof createModel>;

  constructor(config: MetaModeratorConfig) {
    this.config = config;
    this.model = createModel(config.aiConfig);
  }

  async summarizeRound(
    roundNumber: number,
    opinions: ExpertOpinionResult[],
    metrics: QualityMetrics
  ): Promise<string> {
    if (!this.config.enabled) {
      return `Round ${roundNumber} completed with ${opinions.length} opinions.`;
    }

    const style = this.getSummaryStylePrompt();

    const prompt = `
${style}

Summarize Round ${roundNumber} of the deliberation.

**Opinions received:**
${opinions
  .map(
    (o) => `
- **${o.expertName}** (confidence: ${(o.confidence * 100).toFixed(0)}%): ${o.opinion}
`
  )
  .join("")}

**Quality Metrics:**
- Average Confidence: ${(metrics.averageConfidence * 100).toFixed(0)}%
- Coherence Score: ${(metrics.coherenceScore * 100).toFixed(0)}%
- Diversity Score: ${(metrics.diversityScore * 100).toFixed(0)}%
- Relevance Score: ${(metrics.relevanceScore * 100).toFixed(0)}%

Provide a summary that captures the key themes, areas of agreement, and points of contention.
`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.5,
      maxTokens: this.config.summaryStyle === "detailed" ? 1000 : 500,
    });

    return result.text;
  }

  async generateGuidance(
    currentRound: number,
    previousRounds: RoundResult[],
    topic: string
  ): Promise<string> {
    if (!this.config.enabled || previousRounds.length === 0) {
      return "";
    }

    const lastRound = previousRounds[previousRounds.length - 1];
    if (!lastRound) {
      return "";
    }

    if (lastRound.qualityMetrics.overallQuality >= this.config.interventionThreshold) {
      return "";
    }

    const prompt = `
As the meta-moderator for this deliberation on "${topic}", provide guidance for Round ${currentRound}.

**Previous Round Summary:**
${lastRound.summary}

**Quality Metrics:**
- Overall Quality: ${(lastRound.qualityMetrics.overallQuality * 100).toFixed(0)}%
- Areas needing improvement: ${this.identifyWeakAreas(lastRound.qualityMetrics).join(", ")}

**Current Consensus Score:** ${(lastRound.consensusScore * 100).toFixed(0)}%

Provide brief, actionable guidance to help experts improve the quality of the discussion in the next round. Focus on:
1. Addressing gaps in the discussion
2. Encouraging deeper analysis where needed
3. Facilitating convergence without forcing agreement
`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.5,
      maxTokens: 300,
    });

    return result.text;
  }

  async calculateConsensus(
    opinions: ExpertOpinionResult[],
    topic: string
  ): Promise<{ score: number; summary: string }> {
    if (!this.config.enabled) {
      const avgConfidence =
        opinions.reduce((sum, o) => sum + o.confidence, 0) / opinions.length;
      return {
        score: avgConfidence,
        summary: "Consensus calculation disabled.",
      };
    }

    const prompt = `
Analyze the following expert opinions on "${topic}" and determine the level of consensus.

${opinions
  .map(
    (o) => `
**${o.expertName}:**
Position: ${o.opinion}
Reasoning: ${o.reasoning}
Confidence: ${(o.confidence * 100).toFixed(0)}%
`
  )
  .join("\n---\n")}

Provide your analysis in this exact format:
CONSENSUS_SCORE: [0-100] - The percentage of consensus among experts
SUMMARY: [Brief summary of the consensus or lack thereof]
`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.3,
      maxTokens: 500,
    });

    const scoreMatch = result.text.match(/CONSENSUS_SCORE:\s*([\d.]+)/i);
    const summaryMatch = result.text.match(/SUMMARY:\s*([\s\S]+)/i);

    const score = scoreMatch?.[1] ? parseFloat(scoreMatch[1]) / 100 : 0.5;
    const summary = summaryMatch?.[1]?.trim() ?? "Unable to determine consensus.";

    return {
      score: Math.max(0, Math.min(1, score)),
      summary,
    };
  }

  async generateFinalConsensus(
    rounds: RoundResult[],
    topic: string,
    consensusThreshold: number
  ): Promise<FinalConsensus> {
    const lastRound = rounds[rounds.length - 1];
    if (!lastRound) {
      return {
        achieved: false,
        score: 0,
        summary: "No rounds completed.",
        recommendation: "",
        dissenting: [],
        confidence: 0,
      };
    }

    const consensusAchieved = lastRound.consensusScore >= consensusThreshold / 100;

    if (!this.config.enabled) {
      return {
        achieved: consensusAchieved,
        score: lastRound.consensusScore,
        summary: lastRound.summary,
        recommendation: consensusAchieved
          ? "Proceed with the majority position."
          : "Further deliberation recommended.",
        dissenting: [],
        confidence: lastRound.qualityMetrics.averageConfidence,
      };
    }

    const prompt = `
Generate a final consensus report for the deliberation on "${topic}".

**Deliberation History:**
${rounds
  .map(
    (r) => `
Round ${r.roundNumber}:
- Summary: ${r.summary}
- Consensus Score: ${(r.consensusScore * 100).toFixed(0)}%
- Quality: ${(r.qualityMetrics.overallQuality * 100).toFixed(0)}%
`
  )
  .join("\n")}

**Final Round Opinions:**
${lastRound.opinions
  .map((o) => `- ${o.expertName}: ${o.opinion} (confidence: ${(o.confidence * 100).toFixed(0)}%)`)
  .join("\n")}

**Consensus Threshold:** ${consensusThreshold}%
**Final Consensus Score:** ${(lastRound.consensusScore * 100).toFixed(0)}%

Provide your final report in this format:
SUMMARY: [Comprehensive summary of the final consensus or disagreement]
RECOMMENDATION: [Clear recommendation based on the deliberation]
DISSENTING: [List any significantly dissenting positions and reasons, or "None" if consensus is strong]
`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.4,
      maxTokens: 800,
    });

    const summaryMatch = result.text.match(/SUMMARY:\s*([\s\S]*?)(?=RECOMMENDATION:|$)/i);
    const recommendationMatch = result.text.match(
      /RECOMMENDATION:\s*([\s\S]*?)(?=DISSENTING:|$)/i
    );
    const dissentingMatch = result.text.match(/DISSENTING:\s*([\s\S]+)/i);

    const dissenting = this.parseDissentingOpinions(
      dissentingMatch?.[1] ?? "",
      lastRound.opinions
    );

    return {
      achieved: consensusAchieved,
      score: lastRound.consensusScore,
      summary: summaryMatch?.[1]?.trim() ?? lastRound.summary,
      recommendation:
        recommendationMatch?.[1]?.trim() ?? "See summary for recommendations.",
      dissenting,
      confidence: lastRound.qualityMetrics.averageConfidence,
    };
  }

  private getSummaryStylePrompt(): string {
    switch (this.config.summaryStyle) {
      case "concise":
        return "Provide a concise summary in 2-3 sentences.";
      case "executive":
        return "Provide an executive summary suitable for senior leadership, focusing on key decisions and implications.";
      case "detailed":
      default:
        return "Provide a detailed summary covering all major points and nuances.";
    }
  }

  private identifyWeakAreas(metrics: QualityMetrics): string[] {
    const areas: string[] = [];
    if (metrics.coherenceScore < 0.7) areas.push("coherence");
    if (metrics.diversityScore < 0.6) areas.push("diversity of perspectives");
    if (metrics.relevanceScore < 0.7) areas.push("relevance to topic");
    if (metrics.averageConfidence < 0.6) areas.push("expert confidence");
    return areas.length > 0 ? areas : ["general quality"];
  }

  private parseDissentingOpinions(
    text: string,
    opinions: ExpertOpinionResult[]
  ): FinalConsensus["dissenting"] {
    if (text.toLowerCase().includes("none")) {
      return [];
    }

    const dissenting: FinalConsensus["dissenting"] = [];
    const lowestConfidence = [...opinions].sort((a, b) => a.confidence - b.confidence);

    for (const opinion of lowestConfidence.slice(0, 2)) {
      if (opinion.confidence < 0.5) {
        dissenting.push({
          expertId: opinion.expertId,
          expertName: opinion.expertName,
          reason: "Low confidence in the emerging consensus",
          alternativePosition: opinion.opinion,
        });
      }
    }

    return dissenting;
  }
}

export function createDefaultMetaModerator(): MetaModerator {
  return new MetaModerator({
    enabled: true,
    aiConfig: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
    interventionThreshold: 0.7,
    summaryStyle: "detailed",
  });
}
