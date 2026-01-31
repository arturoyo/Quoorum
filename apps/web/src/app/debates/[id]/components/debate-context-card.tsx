/**
 * DebateContextCard Component
 *
 * Collapsible card showing the debate context and background information.
 */

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DebateContextCardProps {
  question?: string
  context: {
    background?: string
    sources?: Array<{ content?: string; type?: string }>
    assessment?: {
      summary?: string
    } | string
  }
  status: string
  hasRounds: boolean
  isExpanded: boolean
  onToggle: () => void
}

export function DebateContextCard({
  question,
  context,
  status,
  hasRounds,
  isExpanded,
  onToggle,
}: DebateContextCardProps) {
  const getSummaryText = () => {
    if (question) {
      return question.length > 120 ? `${question.substring(0, 120)}...` : question
    }
    if (context.assessment && typeof context.assessment === 'object' && 'summary' in context.assessment) {
      return String(context.assessment.summary || '')
    }
    if (context.background) {
      return context.background.length > 120
        ? `${context.background.substring(0, 120)}...`
        : context.background
    }
    return 'Ver contexto completo'
  }

  const getAssessmentText = () => {
    if (typeof context.assessment === 'object' && 'summary' in context.assessment) {
      return String(context.assessment.summary || '')
    }
    if (typeof context.assessment === 'string') {
      return context.assessment
    }
    return 'Análisis disponible'
  }

  return (
    <Card className={cn(
      "border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden",
      status === 'in_progress' && !hasRounds && "border-purple-500/50 shadow-lg shadow-purple-500/20 ring-1 ring-purple-500/20"
    )}>
      {/* Header - Clickable */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-2 text-sm font-medium text-purple-400">
            <span>📝</span>
            <span>Información Proporcionada</span>
          </div>
          {/* Summary when collapsed */}
          {!isExpanded && (
            <p className="text-xs text-[var(--theme-text-secondary)] mt-1 line-clamp-1">
              {getSummaryText()}
            </p>
          )}
          {/* Message when in progress and collapsed */}
          {!isExpanded && status === 'in_progress' && !hasRounds && (
            <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Los agentes están analizando este contexto...</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 ml-2 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content - Collapsible */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
          {/* Original Question */}
          {question && (
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--theme-text-secondary)]">
                Pregunta completa:
              </div>
              <p className="text-sm text-white whitespace-pre-wrap">
                {question}
              </p>
            </div>
          )}

          {/* Background/Context */}
          {context.background && (
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--theme-text-secondary)]">
                Información proporcionada:
              </div>
              <p className="text-sm text-white whitespace-pre-wrap">
                {context.background}
              </p>
            </div>
          )}

          {/* Category */}
          {context.sources && context.sources.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--theme-text-secondary)]">
                Categoría:
              </div>
              <div className="flex flex-wrap gap-2">
                {context.sources.map((source, idx) => (
                  <Badge key={idx} className="bg-purple-600/20 text-purple-300">
                    {source.content || source.type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Assessment Summary if available */}
          {context.assessment && (
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--theme-text-secondary)]">
                Análisis de Contexto:
              </div>
              <p className="text-sm text-[var(--theme-text-secondary)]">
                {getAssessmentText()}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
