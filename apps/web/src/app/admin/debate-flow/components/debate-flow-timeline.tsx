'use client'

import { MessageSquare, Users, Target, CheckCircle, Sparkles } from 'lucide-react'
import { PhaseCard } from './phase-card'

export interface PromptData {
  id: string
  key: string
  name: string
  description: string
  category: string
  version: number
  phase?: number
  prompt?: string
  system_prompt?: string
  recommended_model?: string
  economic_model?: string
  balanced_model?: string
  performance_model?: string
  temperature?: number
  max_tokens?: number
  variables?: string[]
  is_active?: boolean
  order_in_phase?: number
  [key: string]: any
}

interface DebateFlowTimelineProps {
  promptsByPhase: Record<number, PromptData[]>
  onPromptEdit: (prompt: PromptData) => void
  onPromptTest: (prompt: PromptData) => void
}

const PHASES = [
  {
    num: 1,
    title: 'Contexto',
    desc: 'Recopilación de contexto con preguntas guiadas',
    icon: MessageSquare,
    color: 'green',
  },
  {
    num: 2,
    title: 'Expertos',
    desc: 'Selección de participantes (expertos, departamentos, profesionales)',
    icon: Users,
    color: 'blue',
  },
  {
    num: 3,
    title: 'Estrategia',
    desc: 'Elección de estrategia y framework de decisión',
    icon: Target,
    color: 'orange',
  },
  {
    num: 4,
    title: 'Revisión',
    desc: 'Confirmación final antes de crear debate',
    icon: CheckCircle,
    color: 'pink',
  },
  {
    num: 5,
    title: 'Debate',
    desc: 'Ejecución del debate con agentes IA',
    icon: Sparkles,
    color: 'purple',
  },
]

export function DebateFlowTimeline({
  promptsByPhase,
  onPromptEdit,
  onPromptTest,
}: DebateFlowTimelineProps) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-purple-500/30" />

      <div className="space-y-8">
        {PHASES.map((phase) => (
          <PhaseCard
            key={phase.num}
            phase={phase}
            prompts={promptsByPhase[phase.num] || []}
            onPromptEdit={onPromptEdit}
            onPromptTest={onPromptTest}
          />
        ))}
      </div>
    </div>
  )
}
