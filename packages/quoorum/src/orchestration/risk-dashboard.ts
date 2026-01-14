/**
 * Risk Dashboard - Aggregate risk view across decisions
 */

import type { DecisionWithOutcome, DecisionCategory } from './decision-history'

// ============================================================================
// TYPES
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type RiskCategory = 'strategic' | 'financial' | 'operational' | 'market' | 'technical' | 'legal' | 'reputational'

export interface Risk {
  id: string
  title: string
  description: string
  category: RiskCategory
  level: RiskLevel
  probability: number // 1-10
  impact: number // 1-10
  score: number // probability * impact
  mitigations?: string[]
  owner?: string
  relatedDecisions?: string[]
  status: 'identified' | 'mitigating' | 'accepted' | 'resolved'
  createdAt: Date
  updatedAt: Date
}

export interface RiskTrend {
  date: Date
  totalRisks: number
  criticalCount: number
  averageScore: number
}

export interface RiskSummary {
  totalRisks: number
  byLevel: Record<RiskLevel, number>
  byCategory: Record<RiskCategory, number>
  topRisks: Risk[]
  averageScore: number
  trend: 'improving' | 'stable' | 'worsening'
}

export interface RiskMatrix {
  low_low: Risk[]
  low_medium: Risk[]
  low_high: Risk[]
  medium_low: Risk[]
  medium_medium: Risk[]
  medium_high: Risk[]
  high_low: Risk[]
  high_medium: Risk[]
  high_high: Risk[]
}

// ============================================================================
// RISK DASHBOARD
// ============================================================================

export class RiskDashboard {
  private risks: Map<string, Risk> = new Map()
  private history: RiskTrend[] = []

  /** Add a new risk */
  addRisk(risk: Omit<Risk, 'id' | 'score' | 'createdAt' | 'updatedAt'>): Risk {
    const score = risk.probability * risk.impact
    const level = this.calculateLevel(score)
    const full: Risk = {
      ...risk, id: `risk-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      score, level, createdAt: new Date(), updatedAt: new Date(),
    }
    this.risks.set(full.id, full)
    this.recordTrend()
    return full
  }

  /** Update risk */
  updateRisk(id: string, updates: Partial<Omit<Risk, 'id' | 'createdAt'>>): Risk {
    const risk = this.risks.get(id)
    if (!risk) throw new Error('Risk not found')
    const updated = { ...risk, ...updates, updatedAt: new Date() }
    if (updates.probability || updates.impact) {
      updated.score = updated.probability * updated.impact
      updated.level = this.calculateLevel(updated.score)
    }
    this.risks.set(id, updated)
    this.recordTrend()
    return updated
  }

  /** Remove risk */
  removeRisk(id: string): void { this.risks.delete(id) }

  /** Get risk by ID */
  getRisk(id: string): Risk | undefined { return this.risks.get(id) }

  /** Get all risks */
  getAll(): Risk[] {
    return Array.from(this.risks.values()).sort((a, b) => b.score - a.score)
  }

  /** Get risks by level */
  getByLevel(level: RiskLevel): Risk[] {
    return this.getAll().filter(r => r.level === level)
  }

  /** Get risks by category */
  getByCategory(category: RiskCategory): Risk[] {
    return this.getAll().filter(r => r.category === category)
  }

  /** Get summary */
  getSummary(): RiskSummary {
    const all = this.getAll()
    const byLevel: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 }
    const byCategory: Record<RiskCategory, number> = { strategic: 0, financial: 0, operational: 0, market: 0, technical: 0, legal: 0, reputational: 0 }

    for (const r of all) { byLevel[r.level]++; byCategory[r.category]++ }

    const avgScore = all.length > 0 ? all.reduce((s, r) => s + r.score, 0) / all.length : 0
    let trend: 'improving' | 'stable' | 'worsening' = 'stable'
    if (this.history.length >= 2) {
      const recent = this.history[this.history.length - 1]!.averageScore
      const previous = this.history[this.history.length - 2]!.averageScore
      if (recent < previous - 5) trend = 'improving'
      else if (recent > previous + 5) trend = 'worsening'
    }

    return { totalRisks: all.length, byLevel, byCategory, topRisks: all.slice(0, 5), averageScore: avgScore, trend }
  }

  /** Get risk matrix */
  getMatrix(): RiskMatrix {
    const matrix: RiskMatrix = {
      low_low: [], low_medium: [], low_high: [],
      medium_low: [], medium_medium: [], medium_high: [],
      high_low: [], high_medium: [], high_high: [],
    }
    for (const r of this.getAll()) {
      const probBand = r.probability <= 3 ? 'low' : r.probability <= 6 ? 'medium' : 'high'
      const impBand = r.impact <= 3 ? 'low' : r.impact <= 6 ? 'medium' : 'high'
      const key = `${probBand}_${impBand}` as keyof RiskMatrix
      matrix[key].push(r)
    }
    return matrix
  }

  /** Extract risks from decisions */
  extractFromDecisions(decisions: DecisionWithOutcome[]): Risk[] {
    const newRisks: Risk[] = []
    for (const d of decisions) {
      if (d.outcome?.status === 'failed' && d.outcome.lessonsLearned?.length) {
        for (const lesson of d.outcome.lessonsLearned) {
          const risk = this.addRisk({
            title: `De decisión: ${d.question.substring(0, 50)}`,
            description: lesson,
            category: this.mapDecisionCategory(d.category),
            probability: 5, impact: d.outcome.impactScore ?? 5,
            status: 'identified', relatedDecisions: [d.id], level: 'medium',
          })
          newRisks.push(risk)
        }
      }
    }
    return newRisks
  }

  /** Add mitigation to risk */
  addMitigation(riskId: string, mitigation: string): void {
    const risk = this.risks.get(riskId)
    if (!risk) throw new Error('Risk not found')
    risk.mitigations = [...(risk.mitigations ?? []), mitigation]
    risk.updatedAt = new Date()
  }

  /** Get critical alerts */
  getCriticalAlerts(): Risk[] {
    return this.getAll().filter(r => r.level === 'critical' && r.status !== 'resolved')
  }

  private calculateLevel(score: number): RiskLevel {
    if (score >= 64) return 'critical'
    if (score >= 36) return 'high'
    if (score >= 16) return 'medium'
    return 'low'
  }

  private recordTrend(): void {
    const all = this.getAll()
    this.history.push({
      date: new Date(),
      totalRisks: all.length,
      criticalCount: all.filter(r => r.level === 'critical').length,
      averageScore: all.length > 0 ? all.reduce((s, r) => s + r.score, 0) / all.length : 0,
    })
    if (this.history.length > 30) this.history.shift()
  }

  private mapDecisionCategory(category: DecisionCategory): RiskCategory {
    const map: Record<DecisionCategory, RiskCategory> = {
      strategic: 'strategic', product: 'technical', hiring: 'operational',
      pricing: 'financial', marketing: 'market', operations: 'operational',
      finance: 'financial', other: 'operational',
    }
    return map[category]
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createRiskDashboard(): RiskDashboard {
  return new RiskDashboard()
}
