/**
 * Debate Preview System
 * Generates intelligent previews of what experts will debate about
 */

import { getAIClient } from '@quoorum/ai'

// ============================================================================
// TYPES
// ============================================================================

export interface DebatePoint {
  topic: string
  expertA: {
    name: string
    position: string
    reasoning: string
  }
  expertB: {
    name: string
    position: string
    reasoning: string
  }
  controversy: number // 0-100
  importance: 'critical' | 'important' | 'moderate'
}

export interface WeakPoint {
  dimension: string
  issue: string
  impact: string
  suggestion: string
}

export interface DebatePreviewOutput {
  hotPoints: DebatePoint[]
  weakPoints: WeakPoint[]
  estimatedRounds: number
  consensusLikelihood: number // 0-100
  recommendedExperts: string[]
  contextStrength: {
    overall: number
    dimensions: Record<string, number>
  }
}

// ============================================================================
// DEBATE PREVIEW GENERATOR
// ============================================================================

export async function generateDebatePreview(
  question: string,
  context: Record<string, unknown>,
  dimensions: Array<{ id: string; name: string; score: number }>
): Promise<DebatePreviewOutput> {
  const aiClient = getAIClient()

  // Analyze context to find hot debate topics
  const contextSummary = Object.entries(context)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n')

  const dimensionsSummary = dimensions
    .map((d) => `- ${d.name}: ${d.score}% complete`)
    .join('\n')

  const prompt = `Debate Question: "${question}"

Context Provided:
${contextSummary}

Dimensions:
${dimensionsSummary}

Your task: Predict what expert debates will emerge from this context.

Identify:
1. **3-5 Hot Points** (topics experts will likely disagree on)
   - For each, predict 2 opposing expert positions
   - Rate controversy (0-100)
   - Mark importance (critical/important/moderate)

2. **2-4 Weak Points** (dimensions with insufficient context)
   - Explain what's missing
   - Explain impact on debate quality
   - Suggest what to add

3. **Debate Metadata**
   - Estimated rounds to consensus (1-20)
   - Consensus likelihood (0-100)
   - Recommended expert types

Output ONLY valid JSON:
{
  "hotPoints": [
    {
      "topic": "Pricing Strategy",
      "expertA": {
        "name": "Optimizer",
        "position": "Freemium model",
        "reasoning": "Maximize user acquisition"
      },
      "expertB": {
        "name": "Critic",
        "position": "Sales-led from day 1",
        "reasoning": "Higher LTV, better unit economics"
      },
      "controversy": 85,
      "importance": "critical"
    }
  ],
  "weakPoints": [
    {
      "dimension": "Timeline",
      "issue": "No launch date specified",
      "impact": "Experts can't debate timing trade-offs",
      "suggestion": "Add target launch quarter"
    }
  ],
  "estimatedRounds": 8,
  "consensusLikelihood": 75,
  "recommendedExperts": ["Product Strategist", "Growth Expert", "CFO"],
  "contextStrength": {
    "overall": 70,
    "dimensions": {
      "objective": 90,
      "market": 60,
      "timeline": 30
    }
  }
}`

  try {
    const response = await aiClient.generate(prompt, {
      modelId: 'gemini-2.0-flash-exp',
      systemPrompt:
        'You are an expert debate analyst. Predict expert discussions accurately. Output ONLY valid JSON.',
      temperature: 0.4,
      maxTokens: 3000,
    })

    const parsed = JSON.parse(response.text) as DebatePreviewOutput
    return parsed
  } catch (error) {
    console.error('[Debate Preview] Generation failed:', error)
    // Fallback preview
    return {
      hotPoints: [],
      weakPoints: [],
      estimatedRounds: 10,
      consensusLikelihood: 50,
      recommendedExperts: [],
      contextStrength: {
        overall: 50,
        dimensions: {},
      },
    }
  }
}

// ============================================================================
// EXPERT MATCHMAKING
// ============================================================================

interface ExpertMatch {
  expertType: string
  relevance: number
  reasoning: string
}

export async function recommendExpertsForDebate(
  question: string,
  context: Record<string, unknown>
): Promise<ExpertMatch[]> {
  const aiClient = getAIClient()

  const contextSummary = Object.entries(context)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n')

  const prompt = `Debate Question: "${question}"

Context:
${contextSummary}

Based on this debate topic and context, recommend 5-8 expert types that would provide the most valuable perspectives.

For each expert:
- Type (e.g., "Product Strategist", "CFO", "UX Designer")
- Relevance (0-100)
- Why they're valuable for this debate

Output ONLY valid JSON:
[
  {
    "expertType": "Product Strategist",
    "relevance": 95,
    "reasoning": "Critical for validating product-market fit assumptions"
  }
]`

  try {
    const response = await aiClient.generate(prompt, {
      modelId: 'gemini-2.0-flash-exp',
      systemPrompt: 'You are an expert matchmaking system. Output ONLY valid JSON.',
      temperature: 0.3,
      maxTokens: 2000,
    })

    return JSON.parse(response.text) as ExpertMatch[]
  } catch (error) {
    console.error('[Expert Matchmaking] Failed:', error)
    return []
  }
}
