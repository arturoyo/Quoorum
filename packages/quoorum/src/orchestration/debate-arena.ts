/**
 * Debate Arena - Multi-debate comparison and group re-debates
 */

import type { AIProvider, DebateContext } from './ai-debate-types'
import type { SubDebateResult } from './types'

// ============================================================================
// TYPES
// ============================================================================

export interface DebateEntry {
  id: string
  question: string
  conclusion: string
  confidence: number
  arguments: string[]
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface ComparisonResult {
  entries: DebateEntry[]
  commonThemes: string[]
  contradictions: ContradictionItem[]
  synthesizedConclusion: string
  confidenceInSynthesis: number
  recommendation: 'proceed' | 'needs_resolution' | 'insufficient_data'
}

export interface ContradictionItem {
  topic: string
  positions: Array<{ debateId: string; position: string }>
  severity: 'minor' | 'moderate' | 'critical'
  resolution?: string
}

export interface MetaDebateResult {
  question: string
  competingConclusions: Array<{ id: string; conclusion: string; votes: number }>
  winner: { id: string; conclusion: string; reasoning: string }
  dissent: string[]
  finalRecommendation: string
  confidence: number
}

export interface DebateGroup {
  id: string
  name: string
  description: string
  debates: DebateEntry[]
  createdAt: Date
  status: 'open' | 'analyzing' | 'resolved'
}

// ============================================================================
// DEBATE ARENA
// ============================================================================

export class DebateArena {
  private provider: AIProvider
  private groups: Map<string, DebateGroup> = new Map()

  constructor(provider: AIProvider) {
    this.provider = provider
  }

  createGroup(name: string, description: string): DebateGroup {
    const group: DebateGroup = {
      id: `group-${Date.now()}`,
      name,
      description,
      debates: [],
      createdAt: new Date(),
      status: 'open',
    }
    this.groups.set(group.id, group)
    return group
  }

  addToGroup(groupId: string, debate: DebateEntry): void {
    const group = this.groups.get(groupId)
    if (!group) throw new Error(`Group ${groupId} not found`)
    group.debates.push(debate)
  }

  getGroup(groupId: string): DebateGroup | undefined {
    return this.groups.get(groupId)
  }
  listGroups(): DebateGroup[] {
    return Array.from(this.groups.values())
  }

  /**
   * Compare multiple debate results to find themes and contradictions
   */
  async compareDebates(debates: DebateEntry[]): Promise<ComparisonResult> {
    if (debates.length < 2) throw new Error('Need at least 2 debates to compare')

    const debatesSummary = debates
      .map(
        (d, i) =>
          `DEBATE ${i + 1}: "${d.question}"\nConclusión: ${d.conclusion}\nConfianza: ${(d.confidence * 100).toFixed(0)}%`
      )
      .join('\n\n')

    const prompt = `ANÁLISIS COMPARATIVO:\n\n${debatesSummary}\n\nAnaliza y responde en JSON:
{"commonThemes":["..."],"contradictions":[{"topic":"...","severity":"minor|moderate|critical"}],"synthesizedConclusion":"...","confidenceInSynthesis":75,"recommendation":"proceed|needs_resolution|insufficient_data"}`

    const response = await this.provider.generateResponse(prompt, {
      systemPrompt: 'Analista de decisiones. Compara objetivamente. Responde SOLO JSON.',
      temperature: 0.4,
      maxTokens: 1500,
    })

    try {
      const match = response.match(/\{[\s\S]*\}/)
      if (match) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- JSON.parse returns any, but we validate structure
        const parsed = JSON.parse(match[0]) as Partial<{
          commonThemes: string[]
          contradictions: Array<{ topic: string; severity: string }>
          synthesizedConclusion: string
          confidenceInSynthesis: number
          recommendation: string
        }>
        return {
          entries: debates,
          commonThemes: parsed.commonThemes ?? [],
          contradictions: (parsed.contradictions ?? []).map((c) => ({
            topic: c.topic,
            positions: [],
            severity: (c.severity as 'minor' | 'moderate' | 'critical') ?? 'minor',
          })),
          synthesizedConclusion: parsed.synthesizedConclusion ?? response.substring(0, 300),
          confidenceInSynthesis: parsed.confidenceInSynthesis ?? 50,
          recommendation:
            (parsed.recommendation as 'proceed' | 'needs_resolution' | 'insufficient_data') ??
            'needs_resolution',
        }
      }
    } catch {
      /* fallback */
    }
    return {
      entries: debates,
      commonThemes: ['Requiere revisión'],
      contradictions: [],
      synthesizedConclusion: response.substring(0, 300),
      confidenceInSynthesis: 50,
      recommendation: 'needs_resolution' as const,
    }
  }

  /**
   * Meta-debate: conclusions compete against each other
   */
  async metaDebate(debates: DebateEntry[], context: DebateContext): Promise<MetaDebateResult> {
    if (debates.length < 2) throw new Error('Need at least 2 debates')
    const question = `¿Cuál es la mejor conclusión para: "${context.originalQuestion}"?`

    // Get defenses for each position
    const defenses = await Promise.all(
      debates.map((d) =>
        this.provider.generateResponse(
          `Defiende esta conclusión con 3 argumentos fuertes:\n"${d.conclusion}"\nContexto: ${context.originalQuestion}`,
          {
            systemPrompt: 'Abogado defensor. Argumentos sólidos.',
            temperature: 0.6,
            maxTokens: 600,
          }
        )
      )
    )

    // Cross-examine
    const positions = debates
      .map((d, i) => `${i + 1}. "${d.conclusion}"\nDefensa: ${defenses[i]?.substring(0, 400)}`)
      .join('\n\n')
    const crossExam = await this.provider.generateResponse(
      `CROSS-EXAMEN:\n${positions}\n\nIdentifica debilidades de cada posición y cuál tiene mejores fundamentos.`,
      { systemPrompt: 'Juez imparcial.', temperature: 0.5, maxTokens: 800 }
    )

    // Final verdict
    const options = debates.map((d, i) => `${i + 1}. "${d.conclusion}"`).join('\n')
    const verdictPrompt = `VEREDICTO para: ${context.originalQuestion}\n\nOPCIONES:\n${options}\n\nANÁLISIS:\n${crossExam.substring(0, 1000)}\n\nResponde JSON: {"winnerIndex":0,"votes":[3,1],"reasoning":"...","dissent":["..."],"recommendation":"...","confidence":75}`

    const verdict = await this.provider.generateResponse(verdictPrompt, {
      systemPrompt: 'Árbitro final. Decide con evidencia.',
      temperature: 0.3,
      maxTokens: 600,
    })

    try {
      const match = verdict.match(/\{[\s\S]*\}/)
      if (match) {
        const v = JSON.parse(match[0]) as {
          winnerIndex?: number
          votes?: number[]
          reasoning?: string
          dissent?: string[]
          recommendation?: string
          confidence?: number
        }
        const winnerIdx = v.winnerIndex ?? 0
        // Safe: debates.length >= 2 validated above
        const winner = debates[winnerIdx] ?? debates[0]!
        return {
          question,
          confidence: v.confidence ?? 50,
          competingConclusions: debates.map((d, i) => ({
            id: d.id,
            conclusion: d.conclusion,
            votes: v.votes?.[i] ?? 0,
          })),
          winner: { id: winner.id, conclusion: winner.conclusion, reasoning: v.reasoning ?? '' },
          dissent: v.dissent ?? [],
          finalRecommendation: v.recommendation ?? 'Revisar',
        }
      }
    } catch {
      /* fallback */
    }
    // Safe: debates.length >= 2 validated above
    const firstDebate = debates[0]!
    return {
      question,
      confidence: 50,
      competingConclusions: debates.map((d) => ({ id: d.id, conclusion: d.conclusion, votes: 1 })),
      winner: {
        id: firstDebate.id,
        conclusion: firstDebate.conclusion,
        reasoning: verdict.substring(0, 200),
      },
      dissent: [],
      finalRecommendation: 'Requiere revisión adicional',
    }
  }

  /** Quick 2-debate comparison */
  async quickCompare(d1: DebateEntry, d2: DebateEntry): Promise<string> {
    return this.provider.generateResponse(
      `Compara en 3 oraciones:\n1. "${d1.conclusion}" (${(d1.confidence * 100).toFixed(0)}%)\n2. "${d2.conclusion}" (${(d2.confidence * 100).toFixed(0)}%)\n¿Compatibles? ¿Cuál más fuerte?`,
      { systemPrompt: 'Analista conciso.', temperature: 0.5, maxTokens: 150 }
    )
  }

  /** Convert SubDebateResult to DebateEntry */
  static fromSubDebateResult(result: SubDebateResult): DebateEntry {
    return {
      id: result.debateId,
      question: result.question,
      conclusion: result.topOption || 'Sin conclusión',
      confidence: result.consensusScore / 100,
      timestamp: new Date(),
      arguments: result.ranking.map((r) => `${r.option}: ${r.reasoning} (${r.score})`),
    }
  }
}

export function createDebateArena(provider: AIProvider): DebateArena {
  return new DebateArena(provider)
}
