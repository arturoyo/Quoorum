import { BaseExpert, type ExpertContext } from "./base-expert.js";
import type { ExpertOpinionResult } from "../types.js";

export class DeliberationExpert extends BaseExpert {
  async generateOpinion(context: ExpertContext): Promise<ExpertOpinionResult> {
    const prompt = this.buildPrompt(context);
    const response = await this.callModel(prompt);
    return this.parseResponse(response, context.roundNumber);
  }

  private buildPrompt(context: ExpertContext): string {
    let prompt = `
# Deliberation Context

**Topic:** ${context.topic}
**Description:** ${context.description}

**Objectives:**
${context.objectives.map((o) => `- ${o}`).join("\n")}

**Constraints:**
${context.constraints.map((c) => `- ${c}`).join("\n")}

**Round:** ${context.roundNumber}
`;

    if (context.previousOpinions && context.previousOpinions.length > 0) {
      prompt += `
## Previous Opinions from Other Experts

${context.previousOpinions
  .map(
    (op) => `### ${op.expertName}
**Position:** ${op.opinion}
**Reasoning:** ${op.reasoning}
**Confidence:** ${(op.confidence * 100).toFixed(0)}%
`
  )
  .join("\n")}
`;
    }

    if (context.moderatorGuidance) {
      prompt += `
## Moderator Guidance
${context.moderatorGuidance}
`;
    }

    prompt += `
## Your Task

As an expert in **${this.expertise}**, provide your perspective on this topic.

Please structure your response as follows:
1. **OPINION:** Your main position or recommendation (2-3 sentences)
2. **REASONING:** Detailed justification for your position (3-5 points)
3. **CONFIDENCE:** A percentage (0-100) indicating your confidence level

Consider the objectives and constraints carefully. If this is not the first round, engage with the previous opinions constructively.
`;

    return prompt;
  }

  private parseResponse(response: string, roundNumber: number): ExpertOpinionResult {
    const opinionMatch = response.match(/\*?\*?OPINION\*?\*?:?\s*([\s\S]*?)(?=\*?\*?REASONING|$)/i);
    const reasoningMatch = response.match(/\*?\*?REASONING\*?\*?:?\s*([\s\S]*?)(?=\*?\*?CONFIDENCE|$)/i);

    const opinion = opinionMatch?.[1]?.trim() ?? response.slice(0, 500);
    const reasoning = reasoningMatch?.[1]?.trim() ?? "";
    const confidence = this.parseConfidence(response);

    return {
      expertId: this.id,
      expertName: this.name,
      opinion,
      reasoning,
      confidence,
      qualityScore: 0, // Will be set by quality monitor
      position: roundNumber,
    };
  }
}
