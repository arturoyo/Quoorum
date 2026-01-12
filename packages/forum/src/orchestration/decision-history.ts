/**
 * Decision History - Track past decisions and outcomes for learning
 */

// ============================================================================
// TYPES
// ============================================================================

export type DecisionStatus = 'pending' | 'implemented' | 'successful' | 'failed' | 'abandoned' | 'revised'
export type DecisionCategory = 'strategic' | 'product' | 'hiring' | 'pricing' | 'marketing' | 'operations' | 'finance' | 'other'

export interface Decision {
  id: string
  question: string
  conclusion: string
  confidence: number
  category: DecisionCategory
  tags?: string[]
  reasoning?: string
  alternatives?: string[]
  stakeholders?: string[]
  debateId?: string
  createdAt: Date
  decidedBy?: string
}

export interface DecisionOutcome {
  decisionId: string
  status: DecisionStatus
  actualResult?: string
  lessonsLearned?: string[]
  wouldRepeat: boolean
  impactScore?: number // 1-10
  notes?: string
  reviewedAt: Date
  reviewedBy?: string
}

export interface DecisionWithOutcome extends Decision {
  outcome?: DecisionOutcome
}

export interface DecisionStats {
  total: number
  byStatus: Record<DecisionStatus, number>
  byCategory: Record<DecisionCategory, number>
  successRate: number
  averageConfidence: number
  averageImpact: number
}

export interface DecisionSearchOptions {
  category?: DecisionCategory
  status?: DecisionStatus
  tags?: string[]
  fromDate?: Date
  toDate?: Date
  searchText?: string
  limit?: number
}

// ============================================================================
// DECISION HISTORY STORE
// ============================================================================

export class DecisionHistory {
  private decisions: Map<string, Decision> = new Map()
  private outcomes: Map<string, DecisionOutcome> = new Map()

  /** Record a new decision */
  addDecision(decision: Omit<Decision, 'id' | 'createdAt'>): Decision {
    const full: Decision = { ...decision, id: `dec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date() }
    this.decisions.set(full.id, full)
    return full
  }

  /** Record outcome for a decision */
  recordOutcome(outcome: Omit<DecisionOutcome, 'reviewedAt'>): DecisionOutcome {
    if (!this.decisions.has(outcome.decisionId)) throw new Error('Decision not found')
    const full: DecisionOutcome = { ...outcome, reviewedAt: new Date() }
    this.outcomes.set(outcome.decisionId, full)
    return full
  }

  /** Get decision with its outcome */
  getDecision(id: string): DecisionWithOutcome | undefined {
    const decision = this.decisions.get(id)
    if (!decision) return undefined
    return { ...decision, outcome: this.outcomes.get(id) }
  }

  /** Search decisions */
  search(options: DecisionSearchOptions = {}): DecisionWithOutcome[] {
    let results = Array.from(this.decisions.values())

    if (options.category) results = results.filter(d => d.category === options.category)
    if (options.tags?.length) results = results.filter(d => d.tags?.some(t => options.tags!.includes(t)))
    if (options.fromDate) results = results.filter(d => d.createdAt >= options.fromDate!)
    if (options.toDate) results = results.filter(d => d.createdAt <= options.toDate!)
    if (options.searchText) {
      const search = options.searchText.toLowerCase()
      results = results.filter(d => d.question.toLowerCase().includes(search) || d.conclusion.toLowerCase().includes(search))
    }
    if (options.status) {
      const withOutcome = results.filter(d => this.outcomes.get(d.id)?.status === options.status)
      results = withOutcome
    }

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    if (options.limit) results = results.slice(0, options.limit)

    return results.map(d => ({ ...d, outcome: this.outcomes.get(d.id) }))
  }

  /** Get recent decisions */
  getRecent(limit = 10): DecisionWithOutcome[] {
    return this.search({ limit })
  }

  /** Get decisions pending review */
  getPendingReview(): DecisionWithOutcome[] {
    return Array.from(this.decisions.values())
      .filter(d => !this.outcomes.has(d.id))
      .map(d => ({ ...d, outcome: undefined }))
  }

  /** Get statistics */
  getStats(): DecisionStats {
    const all = Array.from(this.decisions.values())
    const outcomes = Array.from(this.outcomes.values())
    const successful = outcomes.filter(o => o.status === 'successful').length
    const withImpact = outcomes.filter(o => o.impactScore !== undefined)

    const byStatus: Record<DecisionStatus, number> = { pending: 0, implemented: 0, successful: 0, failed: 0, abandoned: 0, revised: 0 }
    const byCategory: Record<DecisionCategory, number> = { strategic: 0, product: 0, hiring: 0, pricing: 0, marketing: 0, operations: 0, finance: 0, other: 0 }

    for (const o of outcomes) byStatus[o.status]++
    for (const d of all) byCategory[d.category]++
    byStatus.pending = all.length - outcomes.length

    return {
      total: all.length, byStatus, byCategory,
      successRate: outcomes.length > 0 ? (successful / outcomes.length) * 100 : 0,
      averageConfidence: all.length > 0 ? all.reduce((s, d) => s + d.confidence, 0) / all.length : 0,
      averageImpact: withImpact.length > 0 ? withImpact.reduce((s, o) => s + (o.impactScore ?? 0), 0) / withImpact.length : 0,
    }
  }

  /** Find similar past decisions */
  findSimilar(question: string, limit = 5): DecisionWithOutcome[] {
    const words = question.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    return this.search({ limit: limit * 2 })
      .filter(d => words.some(w => d.question.toLowerCase().includes(w)))
      .slice(0, limit)
  }

  /** Get lessons from category */
  getLessons(category: DecisionCategory): string[] {
    return this.search({ category })
      .flatMap(d => d.outcome?.lessonsLearned ?? [])
      .filter((l, i, a) => a.indexOf(l) === i) // unique
  }

  /** Export history */
  toJSON(): string {
    return JSON.stringify({
      decisions: Array.from(this.decisions.values()),
      outcomes: Array.from(this.outcomes.values()),
    }, null, 2)
  }

  /** Import history */
  fromJSON(json: string): void {
    const data = JSON.parse(json) as { decisions: Decision[]; outcomes: DecisionOutcome[] }
    this.decisions.clear()
    this.outcomes.clear()
    for (const d of data.decisions) this.decisions.set(d.id, { ...d, createdAt: new Date(d.createdAt) })
    for (const o of data.outcomes) this.outcomes.set(o.decisionId, { ...o, reviewedAt: new Date(o.reviewedAt) })
  }

  /** Get all decisions */
  getAll(): DecisionWithOutcome[] { return this.search({}) }

  /** Clear history */
  clear(): void { this.decisions.clear(); this.outcomes.clear() }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createDecisionHistory(): DecisionHistory {
  return new DecisionHistory()
}
