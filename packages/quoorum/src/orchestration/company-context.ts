/**
 * Company Context Store - Persistent company information for informed debates
 */

import type { AIProvider } from './ai-debate-types'

// ============================================================================
// TYPES
// ============================================================================

export interface CompanyProfile {
  id: string
  name: string
  industry: string
  stage: 'idea' | 'mvp' | 'pmf' | 'scaling' | 'mature'
  teamSize: number
  foundedYear?: number
  mission?: string
  vision?: string
  values?: string[]
  updatedAt: Date
}

export interface CompanyMetrics {
  mrr?: number
  arr?: number
  runway?: number // months
  burnRate?: number
  growthRate?: number // percentage
  churnRate?: number
  nps?: number
  cac?: number
  ltv?: number
  customers?: number
  updatedAt: Date
}

export interface Competitor {
  name: string
  strengths: string[]
  weaknesses: string[]
  marketShare?: number
  notes?: string
}

export interface MarketContext {
  targetMarket: string
  tam?: number // Total Addressable Market
  sam?: number // Serviceable Addressable Market
  som?: number // Serviceable Obtainable Market
  competitors: Competitor[]
  trends?: string[]
  regulations?: string[]
}

export interface StrategicContext {
  currentPriorities: string[]
  recentWins?: string[]
  recentChallenges?: string[]
  upcomingMilestones?: Array<{ milestone: string; targetDate: Date }>
  keyRisks?: string[]
}

export interface CompanyContext {
  profile: CompanyProfile
  metrics?: CompanyMetrics
  market?: MarketContext
  strategic?: StrategicContext
  customFields?: Record<string, unknown>
}

// ============================================================================
// COMPANY CONTEXT STORE
// ============================================================================

export class CompanyContextStore {
  private context: CompanyContext | null = null
  private provider?: AIProvider

  constructor(provider?: AIProvider) {
    this.provider = provider
  }

  /** Set company profile */
  setProfile(profile: CompanyProfile): void {
    if (!this.context) {
      this.context = { profile }
    } else {
      this.context.profile = { ...profile, updatedAt: new Date() }
    }
  }

  /** Update metrics */
  updateMetrics(metrics: Partial<CompanyMetrics>): void {
    if (!this.context) throw new Error('Set profile first')
    this.context.metrics = {
      ...this.context.metrics,
      ...metrics,
      updatedAt: new Date(),
    } as CompanyMetrics
  }

  /** Set market context */
  setMarket(market: MarketContext): void {
    if (!this.context) throw new Error('Set profile first')
    this.context.market = market
  }

  /** Add competitor */
  addCompetitor(competitor: Competitor): void {
    if (!this.context?.market) throw new Error('Set market context first')
    this.context.market.competitors.push(competitor)
  }

  /** Set strategic context */
  setStrategic(strategic: StrategicContext): void {
    if (!this.context) throw new Error('Set profile first')
    this.context.strategic = strategic
  }

  /** Get full context */
  getContext(): CompanyContext | null {
    return this.context
  }

  /** Get formatted context for prompts */
  getPromptContext(): string {
    if (!this.context) return ''
    const { profile, metrics, market, strategic } = this.context
    const lines: string[] = [`📊 CONTEXTO DE ${profile.name.toUpperCase()}`]
    lines.push(
      `Industria: ${profile.industry} | Etapa: ${profile.stage} | Equipo: ${profile.teamSize}`
    )
    if (profile.mission) lines.push(`Misión: ${profile.mission}`)

    if (metrics) {
      const m: string[] = []
      if (metrics.mrr) m.push(`MRR: $${metrics.mrr.toLocaleString()}`)
      if (metrics.runway) m.push(`Runway: ${metrics.runway} meses`)
      if (metrics.growthRate) m.push(`Crecimiento: ${metrics.growthRate}%`)
      if (metrics.customers) m.push(`Clientes: ${metrics.customers}`)
      if (m.length) lines.push(`Métricas: ${m.join(' | ')}`)
    }

    if (market?.competitors.length) {
      lines.push(`Competidores: ${market.competitors.map((c) => c.name).join(', ')}`)
    }

    if (strategic?.currentPriorities.length) {
      lines.push(`Prioridades: ${strategic.currentPriorities.slice(0, 3).join(', ')}`)
    }

    return lines.join('\n')
  }

  /** Auto-generate context summary using AI */
  async generateSummary(): Promise<string> {
    if (!this.provider || !this.context) return this.getPromptContext()
    const prompt = `Resume este contexto empresarial en 3 oraciones concisas:\n${this.getPromptContext()}`
    return this.provider.generateResponse(prompt, { temperature: 0.3, maxTokens: 200 })
  }

  /** Export context as JSON */
  toJSON(): string {
    return JSON.stringify(this.context, null, 2)
  }

  /** Import context from JSON */
  fromJSON(json: string): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- JSON.parse returns any, but we validate structure
    const parsed = JSON.parse(json) as CompanyContext
    this.context = parsed
  }

  /** Clear all context */
  clear(): void {
    this.context = null
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createCompanyContext(provider?: AIProvider): CompanyContextStore {
  return new CompanyContextStore(provider)
}

/** Quick setup for common company types */
export function createStartupContext(
  name: string,
  industry: string,
  stage: CompanyProfile['stage']
): CompanyContextStore {
  const store = new CompanyContextStore()
  store.setProfile({
    id: `company-${Date.now()}`,
    name,
    industry,
    stage,
    teamSize: 0,
    updatedAt: new Date(),
  })
  return store
}
