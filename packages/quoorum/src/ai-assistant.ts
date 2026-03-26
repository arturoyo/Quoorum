/**
 * AI Assistant for Forum
 *
 * OMG-level AI features:
 * - Question refinement
 * - Expert suggestions
 * - Debate summaries
 * - Smart insights
 */

import { quoorumLogger } from './logger'

// ============================================================================
// TYPES
// ============================================================================

export interface QuestionRefinement {
  original: string
  refined: string
  improvements: string[]
  clarity: number // 0-100
  specificity: number // 0-100
}

export interface ExpertSuggestion {
  expertName: string
  relevanceScore: number
  reasoning: string
}

export interface DebateInsight {
  type: 'consensus' | 'disagreement' | 'key_point' | 'action_item' | 'risk' | 'opportunity'
  content: string
  confidence: number
  relatedExperts: string[]
}

// ============================================================================
// QUESTION REFINEMENT
// ============================================================================

export async function refineQuestion(question: string): Promise<QuestionRefinement> {
  quoorumLogger.info('Refining question', { question })

  try {
    // Use AI to refine the question
    const response = await fetch('/api/ai/refine-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })

    if (!response.ok) {
      throw new Error('Failed to refine question')
    }

    const result = (await response.json()) as QuestionRefinement
    return result
  } catch (error) {
    quoorumLogger.error(
      'Question refinement failed',
      error instanceof Error ? error : new Error(String(error)),
      { question }
    )

    // Fallback: basic refinement
    return {
      original: question,
      refined: question,
      improvements: [],
      clarity: 70,
      specificity: 60,
    }
  }
}

export function analyzeQuestionQuality(question: string): {
  clarity: number
  specificity: number
  actionability: number
  suggestions: string[]
} {
  const suggestions: string[] = []
  let clarity = 100
  let specificity = 100
  let actionability = 100

  // Check length
  if (question.length < 20) {
    clarity -= 30
    suggestions.push('Add more context to your question')
  }

  // Check for question words
  const questionWords = ['what', 'why', 'how', 'when', 'where', 'who', 'which', 'should']
  const hasQuestionWord = questionWords.some((word) => question.toLowerCase().includes(word))
  if (!hasQuestionWord) {
    clarity -= 20
    suggestions.push('Start with a clear question word (what, why, how, etc.)')
  }

  // Check for specificity
  const vagueWords = ['thing', 'stuff', 'something', 'maybe', 'probably']
  const hasVagueWords = vagueWords.some((word) => question.toLowerCase().includes(word))
  if (hasVagueWords) {
    specificity -= 30
    suggestions.push('Be more specific - avoid vague terms')
  }

  // Check for actionability
  const actionWords = ['should', 'decide', 'choose', 'implement', 'strategy', 'plan']
  const hasActionWord = actionWords.some((word) => question.toLowerCase().includes(word))
  if (!hasActionWord) {
    actionability -= 20
    suggestions.push('Frame as an actionable decision or strategy question')
  }

  return {
    clarity: Math.max(0, clarity),
    specificity: Math.max(0, specificity),
    actionability: Math.max(0, actionability),
    suggestions,
  }
}

// ============================================================================
// EXPERT SUGGESTIONS
// ============================================================================

export async function suggestExperts(question: string): Promise<ExpertSuggestion[]> {
  quoorumLogger.info('Suggesting experts for question', { question })

  try {
    const response = await fetch('/api/ai/suggest-experts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })

    if (!response.ok) {
      throw new Error('Failed to suggest experts')
    }

    const result = (await response.json()) as ExpertSuggestion[]
    return result
  } catch (error) {
    quoorumLogger.error(
      'Expert suggestion failed',
      error instanceof Error ? error : new Error(String(error)),
      { question }
    )
    return []
  }
}

// ============================================================================
// DEBATE INSIGHTS
// ============================================================================

export async function extractInsights(debateId: string): Promise<DebateInsight[]> {
  quoorumLogger.info('Extracting insights from debate', { debateId })

  try {
    const response = await fetch(`/api/ai/extract-insights/${debateId}`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Failed to extract insights')
    }

    const result = (await response.json()) as DebateInsight[]
    return result
  } catch (error) {
    quoorumLogger.error(
      'Insight extraction failed',
      error instanceof Error ? error : new Error(String(error)),
      { debateId }
    )
    return []
  }
}

export function categorizeInsights(insights: DebateInsight[]): {
  consensus: DebateInsight[]
  disagreements: DebateInsight[]
  keyPoints: DebateInsight[]
  actionItems: DebateInsight[]
  risks: DebateInsight[]
  opportunities: DebateInsight[]
} {
  return {
    consensus: insights.filter((i) => i.type === 'consensus'),
    disagreements: insights.filter((i) => i.type === 'disagreement'),
    keyPoints: insights.filter((i) => i.type === 'key_point'),
    actionItems: insights.filter((i) => i.type === 'action_item'),
    risks: insights.filter((i) => i.type === 'risk'),
    opportunities: insights.filter((i) => i.type === 'opportunity'),
  }
}

// ============================================================================
// SMART SUMMARIES
// ============================================================================

export async function generateSmartSummary(debateId: string): Promise<{
  executiveSummary: string
  keyDecisions: string[]
  nextSteps: string[]
  risks: string[]
  opportunities: string[]
}> {
  quoorumLogger.info('Generating smart summary', { debateId })

  try {
    const response = await fetch(`/api/ai/smart-summary/${debateId}`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Failed to generate summary')
    }

    const result = (await response.json()) as {
      executiveSummary: string
      keyDecisions: string[]
      nextSteps: string[]
      risks: string[]
      opportunities: string[]
    }
    return result
  } catch (error) {
    quoorumLogger.error(
      'Smart summary generation failed',
      error instanceof Error ? error : new Error(String(error)),
      { debateId }
    )

    return {
      executiveSummary: 'Summary generation failed',
      keyDecisions: [],
      nextSteps: [],
      risks: [],
      opportunities: [],
    }
  }
}

// ============================================================================
// CONTEXTUAL HELP
// ============================================================================

export function getContextualHelp(
  context: 'new_debate' | 'selecting_experts' | 'viewing_results'
): {
  title: string
  tips: string[]
  examples: string[]
} {
  const helpContent = {
    new_debate: {
      title: 'Starting a New Debate',
      tips: [
        'Be specific about your question or decision',
        'Include relevant context (industry, timeline, constraints)',
        'Frame it as an actionable question',
        'Consider what outcome you need',
      ],
      examples: [
        'Should we expand to the European market in Q2 2025?',
        'What pricing strategy should we adopt for our new SaaS product?',
        'How should we prioritize these 5 feature requests?',
      ],
    },
    selecting_experts: {
      title: 'Selecting the Right Experts',
      tips: [
        'Choose experts with relevant domain knowledge',
        'Include diverse perspectives (technical, business, user)',
        'Consider 3-7 experts for balanced discussion',
        'Mix industry-specific and general strategy experts',
      ],
      examples: [
        'For pricing: Pricing Strategist + CFO + Customer Success',
        'For product: Product Manager + CTO + UX Designer',
        'For expansion: Market Analyst + Operations + Sales',
      ],
    },
    viewing_results: {
      title: 'Understanding Debate Results',
      tips: [
        'Look for consensus areas first',
        'Pay attention to high-confidence disagreements',
        'Review expert reasoning, not just conclusions',
        'Consider implementation feasibility',
      ],
      examples: [
        'Consensus Score > 80%: Strong agreement, safe to proceed',
        'Consensus Score 50-80%: Some alignment, review concerns',
        'Consensus Score < 50%: Significant disagreement, need more info',
      ],
    },
  }

  return helpContent[context]
}

// ============================================================================
// AUTO-COMPLETE & SUGGESTIONS
// ============================================================================

export function getQuestionSuggestions(partial: string): string[] {
  const templates = [
    'Should we {action} in {timeframe}?',
    'What is the best {strategy} for {goal}?',
    'How should we prioritize {options}?',
    'What are the risks of {decision}?',
    'Should we invest in {technology/market}?',
    'What pricing strategy should we use for {product}?',
    'How can we improve {metric} by {target}?',
    'Should we hire {role} or outsource?',
  ]

  if (partial.length < 3) return []

  return templates.filter((t) => t.toLowerCase().includes(partial.toLowerCase()))
}

export function getExpertCombinationSuggestions(question: string): {
  name: string
  experts: string[]
  reasoning: string
}[] {
  // Analyze question and suggest expert combinations
  const combinations: {
    name: string
    experts: string[]
    reasoning: string
  }[] = []

  if (question.toLowerCase().includes('pricing') || question.toLowerCase().includes('price')) {
    combinations.push({
      name: 'Pricing Strategy Team',
      experts: ['Pricing Strategist', 'CFO', 'Customer Success Manager'],
      reasoning: 'Balanced view of pricing from financial, strategic, and customer perspectives',
    })
  }

  if (question.toLowerCase().includes('product') || question.toLowerCase().includes('feature')) {
    combinations.push({
      name: 'Product Development Team',
      experts: ['Product Manager', 'CTO', 'UX Designer', 'Customer Success Manager'],
      reasoning: 'Comprehensive product perspective from tech, design, and user angles',
    })
  }

  if (question.toLowerCase().includes('market') || question.toLowerCase().includes('expansion')) {
    combinations.push({
      name: 'Market Expansion Team',
      experts: ['Market Research Analyst', 'Operations Manager', 'Sales Director', 'CFO'],
      reasoning: 'Full view of market opportunity, operational feasibility, and financial impact',
    })
  }

  if (question.toLowerCase().includes('hire') || question.toLowerCase().includes('team')) {
    combinations.push({
      name: 'Hiring & Team Building',
      experts: ['HR Director', 'Department Head', 'CFO'],
      reasoning: 'Balanced hiring decision considering culture, need, and budget',
    })
  }

  // Default combination
  if (combinations.length === 0) {
    combinations.push({
      name: 'Strategic Decision Team',
      experts: ['CEO', 'CFO', 'CTO', 'Head of Strategy'],
      reasoning: 'High-level strategic perspective from key leadership roles',
    })
  }

  return combinations
}

// ============================================================================
// DEBATE QUALITY SCORING
// ============================================================================

export function scoreDebateQuality(debate: {
  question: string
  experts: { name: string }[]
  messages: Array<{ content: string }>
  consensusScore: number
}): {
  overallScore: number
  breakdown: {
    questionQuality: number
    expertDiversity: number
    discussionDepth: number
    consensusClarity: number
  }
  suggestions: string[]
} {
  const suggestions: string[] = []

  // Question quality (0-25)
  const questionAnalysis = analyzeQuestionQuality(debate.question)
  const questionQuality = (questionAnalysis.clarity + questionAnalysis.specificity) / 8

  if (questionQuality < 15) {
    suggestions.push('Consider refining your question for better clarity')
  }

  // Expert diversity (0-25)
  const expertDiversity = Math.min(25, (debate.experts.length / 7) * 25)

  if (expertDiversity < 15) {
    suggestions.push('Add more experts for diverse perspectives')
  }

  // Discussion depth (0-25)
  const discussionDepth = Math.min(25, (debate.messages.length / 20) * 25)

  if (discussionDepth < 15) {
    suggestions.push('Allow more rounds for deeper discussion')
  }

  // Consensus clarity (0-25)
  const consensusClarity = (debate.consensusScore / 100) * 25

  if (consensusClarity < 15) {
    suggestions.push('Low consensus - consider gathering more information')
  }

  const overallScore = questionQuality + expertDiversity + discussionDepth + consensusClarity

  return {
    overallScore,
    breakdown: {
      questionQuality,
      expertDiversity,
      discussionDepth,
      consensusClarity,
    },
    suggestions,
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const AIAssistant = {
  refineQuestion,
  analyzeQuestionQuality,
  suggestExperts,
  extractInsights,
  categorizeInsights,
  generateSmartSummary,
  getContextualHelp,
  getQuestionSuggestions,
  getExpertCombinationSuggestions,
  scoreDebateQuality,
}
