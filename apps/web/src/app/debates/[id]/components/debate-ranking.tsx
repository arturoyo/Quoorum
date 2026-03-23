/**
 * DebateRanking Component
 *
 * Shows the final ranking of options at the bottom of the debate.
 */

import { TrendingUp, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RankingOption } from '../types'

interface DebateRankingProps {
  ranking: RankingOption[]
}

export function DebateRanking({ ranking }: DebateRankingProps) {
  const firstOption = ranking[0]
  const isGeneration = firstOption && firstOption.option.length > 200

  return (
    <div className="border-t border-white/10 bg-slate-900/60 backdrop-blur-xl px-4 py-4">
      <div className="mx-auto max-w-4xl">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
          <TrendingUp className="h-5 w-5" />
          {isGeneration ? 'Contenido Generado' : 'Ranking Final de Opciones'}
        </h3>
        <div className="space-y-2">
          {ranking.map((option, idx) => {
            const isLongContent = option.option.length > 200
            const isGenerationItem = isGeneration && idx === 0

            return (
              <div
                key={idx}
                className={cn(
                  'rounded-lg p-4',
                  idx === 0 ? 'bg-purple-600/20 border border-purple-400/30' : 'bg-slate-900/40'
                )}
              >
                {isGenerationItem ? (
                  // Generation mode: Show full content in a text area format
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-purple-400" />
                        <span className="text-sm font-medium text-purple-300">
                          Contenido listo para usar
                        </span>
                      </div>
                      <span className="text-sm text-[var(--theme-text-secondary)]">
                        {option.score.toFixed(1)}% de confianza
                      </span>
                    </div>
                    <div className="rounded-md bg-slate-900/60 border border-slate-700/50 p-4">
                      <pre className="whitespace-pre-wrap font-sans text-white text-sm leading-relaxed">
                        {typeof option.option === 'object'
                          ? JSON.stringify(option.option, null, 2)
                          : option.option}
                      </pre>
                    </div>
                    {option.reasoning && (
                      <div className="text-xs text-[var(--theme-text-secondary)] italic">
                        💡 {option.reasoning}
                      </div>
                    )}
                  </div>
                ) : (
                  // Decision mode: Show ranked options
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full font-bold',
                          idx === 0
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-600/30 text-white'
                        )}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className={cn(
                          'font-medium text-white',
                          isLongContent && 'max-w-2xl'
                        )}>
                          {typeof option.option === 'object'
                            ? JSON.stringify(option.option, null, 2)
                            : option.option}
                        </div>
                        {option.reasoning && (
                          <div className="text-xs text-[var(--theme-text-secondary)]">{option.reasoning}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">
                        {option.score.toFixed(1)}%
                      </span>
                      {idx === 0 && <CheckCircle2 className="h-5 w-5 text-purple-400" />}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
