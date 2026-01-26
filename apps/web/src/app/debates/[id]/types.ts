/**
 * Types for Debate Detail Page
 */

export interface DebatePageProps {
  params: Promise<{
    id: string
  }>
}

export interface RoundMessage {
  expert?: string
  agentKey?: string
  role?: 'moderator' | 'expert'
  content: string
  timestamp?: string
}

export interface RankingOption {
  option: string
  score: number
  reasoning?: string
}

export interface ProcessedMessage extends RoundMessage {
  roundNumber: number
  messageId: string
}

export type DebatePhase = 'contexto' | 'debate' | 'conclusion'

export type DebateStatus = 'draft' | 'pending' | 'in_progress' | 'completed' | 'failed'

export interface StatusConfig {
  label: string
  color: string
  icon: React.ComponentType<{ className?: string }>
}

// Color palette for experts (Purple-Blue-Slate theme)
export const EXPERT_COLORS = [
  'bg-purple-600',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-violet-600',
  'bg-fuchsia-600',
  'bg-cyan-600',
  'bg-sky-600',
  'bg-pink-600',
  'bg-rose-600',
  'bg-purple-500',
]

// Pattern labels in Spanish
export function getPatternLabel(pattern: string): string {
  const labels: Record<string, string> = {
    simple: 'Simple',
    sequential: 'Secuencial',
    parallel: 'Paralelo',
    conditional: 'Condicional',
    iterative: 'Iterativo',
    tournament: 'Torneo',
    adversarial: 'Adversarial',
    ensemble: 'Ensemble',
    hierarchical: 'Jerárquico',
  }
  return labels[pattern] || pattern
}
