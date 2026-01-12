/**
 * Follow-up Tracker - Track decision outcomes and schedule reviews
 */

// ============================================================================
// TYPES
// ============================================================================

export type FollowUpStatus = 'scheduled' | 'pending' | 'completed' | 'overdue' | 'cancelled'
export type FollowUpType = 'review' | 'check_in' | 'milestone' | 'metric_check'

export interface FollowUp {
  id: string
  decisionId: string
  type: FollowUpType
  title: string
  description?: string
  scheduledDate: Date
  completedDate?: Date
  status: FollowUpStatus
  assignee?: string
  notes?: string
  outcome?: 'on_track' | 'needs_attention' | 'off_track' | 'exceeded'
  metrics?: Record<string, number>
  createdAt: Date
}

export interface FollowUpSchedule {
  decisionId: string
  followUps: FollowUp[]
  nextFollowUp?: FollowUp
  completedCount: number
  totalCount: number
}

export interface FollowUpSummary {
  total: number
  pending: number
  overdue: number
  completed: number
  byType: Record<FollowUpType, number>
  upcomingThisWeek: FollowUp[]
  overdueTasks: FollowUp[]
}

export interface ReviewTemplate {
  id: string
  name: string
  questions: string[]
  metricChecks?: string[]
}

// ============================================================================
// FOLLOW-UP TRACKER
// ============================================================================

export class FollowUpTracker {
  private followUps: Map<string, FollowUp> = new Map()
  private templates: Map<string, ReviewTemplate> = new Map()

  constructor() {
    this.initDefaultTemplates()
  }

  private initDefaultTemplates(): void {
    this.templates.set('30_day_review', {
      id: '30_day_review', name: 'Revisión 30 días',
      questions: ['¿Se implementó según lo planeado?', '¿Qué resultados iniciales vemos?', '¿Hay ajustes necesarios?'],
      metricChecks: ['adoption_rate', 'initial_feedback'],
    })
    this.templates.set('90_day_review', {
      id: '90_day_review', name: 'Revisión 90 días',
      questions: ['¿Se alcanzaron los objetivos?', '¿Fue la decisión correcta?', '¿Qué aprendimos?'],
      metricChecks: ['roi', 'goal_completion'],
    })
    this.templates.set('quarterly_check', {
      id: 'quarterly_check', name: 'Check Trimestral',
      questions: ['¿Sigue siendo relevante?', '¿Necesita revisión?'],
    })
  }

  /** Schedule a follow-up */
  schedule(params: { decisionId: string; type: FollowUpType; title: string; scheduledDate: Date; assignee?: string; description?: string }): FollowUp {
    const followUp: FollowUp = {
      id: `fu-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      ...params, status: 'scheduled', createdAt: new Date(),
    }
    this.followUps.set(followUp.id, followUp)
    return followUp
  }

  /** Schedule standard review cycle for a decision */
  scheduleReviewCycle(decisionId: string, startDate: Date = new Date()): FollowUp[] {
    const scheduled: FollowUp[] = []
    const intervals = [
      { days: 30, type: 'check_in' as FollowUpType, title: 'Check-in 30 días' },
      { days: 90, type: 'review' as FollowUpType, title: 'Revisión 90 días' },
      { days: 180, type: 'milestone' as FollowUpType, title: 'Revisión semestral' },
    ]
    for (const interval of intervals) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + interval.days)
      scheduled.push(this.schedule({ decisionId, type: interval.type, title: interval.title, scheduledDate: date }))
    }
    return scheduled
  }

  /** Complete a follow-up */
  complete(id: string, outcome: FollowUp['outcome'], notes?: string, metrics?: Record<string, number>): FollowUp {
    const followUp = this.followUps.get(id)
    if (!followUp) throw new Error('Follow-up not found')
    followUp.status = 'completed'
    followUp.completedDate = new Date()
    followUp.outcome = outcome
    if (notes) followUp.notes = notes
    if (metrics) followUp.metrics = metrics
    return followUp
  }

  /** Cancel a follow-up */
  cancel(id: string, reason?: string): void {
    const followUp = this.followUps.get(id)
    if (!followUp) throw new Error('Follow-up not found')
    followUp.status = 'cancelled'
    followUp.notes = reason
  }

  /** Get follow-up by ID */
  get(id: string): FollowUp | undefined { return this.followUps.get(id) }

  /** Get schedule for a decision */
  getSchedule(decisionId: string): FollowUpSchedule {
    const all = Array.from(this.followUps.values()).filter(f => f.decisionId === decisionId)
    const pending = all.filter(f => f.status === 'scheduled' || f.status === 'pending')
    const sorted = pending.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
    return {
      decisionId, followUps: all,
      nextFollowUp: sorted[0],
      completedCount: all.filter(f => f.status === 'completed').length,
      totalCount: all.length,
    }
  }

  /** Get summary */
  getSummary(): FollowUpSummary {
    const all = Array.from(this.followUps.values())
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Update overdue status
    for (const f of all) {
      if ((f.status === 'scheduled' || f.status === 'pending') && f.scheduledDate < now) {
        f.status = 'overdue'
      }
    }

    const byType: Record<FollowUpType, number> = { review: 0, check_in: 0, milestone: 0, metric_check: 0 }
    for (const f of all) byType[f.type]++

    const pending = all.filter(f => f.status === 'scheduled' || f.status === 'pending')
    const overdue = all.filter(f => f.status === 'overdue')
    const upcoming = pending.filter(f => f.scheduledDate <= weekFromNow)

    return {
      total: all.length,
      pending: pending.length,
      overdue: overdue.length,
      completed: all.filter(f => f.status === 'completed').length,
      byType,
      upcomingThisWeek: upcoming.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()),
      overdueTasks: overdue.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()),
    }
  }

  /** Get pending follow-ups */
  getPending(): FollowUp[] {
    return Array.from(this.followUps.values())
      .filter(f => f.status === 'scheduled' || f.status === 'pending')
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
  }

  /** Get overdue follow-ups */
  getOverdue(): FollowUp[] {
    const now = new Date()
    return Array.from(this.followUps.values())
      .filter(f => (f.status === 'scheduled' || f.status === 'pending' || f.status === 'overdue') && f.scheduledDate < now)
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
  }

  /** Get review template */
  getTemplate(id: string): ReviewTemplate | undefined { return this.templates.get(id) }

  /** Get all templates */
  getTemplates(): ReviewTemplate[] { return Array.from(this.templates.values()) }

  /** Add custom template */
  addTemplate(template: ReviewTemplate): void { this.templates.set(template.id, template) }

  /** Reschedule a follow-up */
  reschedule(id: string, newDate: Date): FollowUp {
    const followUp = this.followUps.get(id)
    if (!followUp) throw new Error('Follow-up not found')
    followUp.scheduledDate = newDate
    followUp.status = 'scheduled'
    return followUp
  }

  /** Get outcomes summary */
  getOutcomesSummary(): Record<NonNullable<FollowUp['outcome']>, number> {
    const outcomes = { on_track: 0, needs_attention: 0, off_track: 0, exceeded: 0 }
    for (const f of this.followUps.values()) {
      if (f.outcome) outcomes[f.outcome]++
    }
    return outcomes
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createFollowUpTracker(): FollowUpTracker {
  return new FollowUpTracker()
}
