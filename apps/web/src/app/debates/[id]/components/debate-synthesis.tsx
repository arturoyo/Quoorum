/**
 * DebateSynthesis Component
 *
 * Shows the executive summary when debate is completed.
 * Includes: summary, quality scores, top 3 options, and final recommendation.
 */

import { Card } from '@/components/ui/card'
import { TrendingUp, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SynthesisOption {
  option: string
  implementation: string
  successRate: number
  pros: string[]
  cons: string[]
  criticalRisks: string[]
}

interface FinalSynthesis {
  summary: string
  debateQuality: {
    convergenceScore: number
    depthScore: number
    diversityScore: number
  }
  top3Options: SynthesisOption[]
  recommendation: {
    option: string
    reasoning: string
    nextSteps: string[]
  }
}

interface DebateSynthesisProps {
  synthesis: FinalSynthesis
}

export function DebateSynthesis({ synthesis }: DebateSynthesisProps) {
  return (
    <div className="border-t border-white/10 bg-slate-900/60 backdrop-blur-xl px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              Síntesis Ejecutiva
            </h2>
            <p className="text-sm text-[var(--theme-text-secondary)]">Informe del Secretario del Tribunal</p>
          </div>
        </div>

        {/* Executive Summary */}
        <Card className="border-white/10 bg-slate-900/40 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-purple-400">
            Resumen Ejecutivo
          </h3>
          <p className="text-[var(--theme-text-secondary)] leading-relaxed">
            {synthesis.summary}
          </p>
        </Card>

        {/* Debate Quality Scores */}
        <Card className="border-white/10 bg-slate-900/40 p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-purple-400">
            Calidad del Debate
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {/* Convergence Score */}
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-white">
                {synthesis.debateQuality.convergenceScore}%
              </div>
              <div className="text-xs text-[var(--theme-text-secondary)]">Convergencia</div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400"
                  style={{ width: `${synthesis.debateQuality.convergenceScore}%` }}
                />
              </div>
            </div>

            {/* Depth Score */}
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-white">
                {synthesis.debateQuality.depthScore}%
              </div>
              <div className="text-xs text-[var(--theme-text-secondary)]">Profundidad</div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                  style={{ width: `${synthesis.debateQuality.depthScore}%` }}
                />
              </div>
            </div>

            {/* Diversity Score */}
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-white">
                {synthesis.debateQuality.diversityScore}%
              </div>
              <div className="text-xs text-[var(--theme-text-secondary)]">Diversidad</div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400"
                  style={{ width: `${synthesis.debateQuality.diversityScore}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Top 3 Options */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            Top 3 Opciones Evaluadas
          </h3>
          {synthesis.top3Options.map((option, idx) => (
            <Card
              key={idx}
              className={cn(
                'border-white/10 bg-slate-900/40 p-5',
                idx === 0 && 'border-purple-400/30 bg-purple-600/10'
              )}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={cn(
                      'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold',
                      idx === 0
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-600/50 text-white'
                    )}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 text-lg font-semibold text-white">{option.option}</h4>
                    <p className="text-sm text-[var(--theme-text-secondary)] mb-3">{option.implementation}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-4">
                  <div className="text-2xl font-bold text-white">{option.successRate}%</div>
                  <div className="text-xs text-[var(--theme-text-secondary)]">Éxito</div>
                </div>
              </div>

              {/* Pros, Cons, Risks in a grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pros */}
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-400">
                    [OK] Pros
                  </div>
                  <ul className="space-y-1">
                    {option.pros.map((pro, i) => (
                      <li key={i} className="text-sm text-[var(--theme-text-secondary)]">• {pro}</li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-yellow-400">
                    [WARN] Cons
                  </div>
                  <ul className="space-y-1">
                    {option.cons.map((con, i) => (
                      <li key={i} className="text-sm text-[var(--theme-text-secondary)]">• {con}</li>
                    ))}
                  </ul>
                </div>

                {/* Critical Risks */}
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-400">
                    🚨 Riesgos Críticos
                  </div>
                  <ul className="space-y-1">
                    {option.criticalRisks.map((risk, i) => (
                      <li key={i} className="text-sm text-[var(--theme-text-secondary)]">• {risk}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Final Recommendation */}
        <Card className="border-purple-400/30 bg-gradient-to-br from-purple-600/20 to-blue-600/10 p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Recomendación Final</h3>
          </div>

          <div className="mb-4 rounded-lg bg-slate-900/60 p-4">
            <div className="mb-2 text-lg font-semibold text-purple-300">
              {synthesis.recommendation.option}
            </div>
            <p className="text-[var(--theme-text-secondary)] leading-relaxed">
              {synthesis.recommendation.reasoning}
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-purple-400">
              Próximos Pasos
            </h4>
            <ol className="space-y-2">
              {synthesis.recommendation.nextSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                    {idx + 1}
                  </div>
                  <span className="text-[var(--theme-text-secondary)] pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </Card>
      </div>
    </div>
  )
}
