/**
 * PhaseIndicator Component
 *
 * Shows the 3-phase progress indicator at the top of the debate detail page.
 * Phases: Contexto → Debate → Conclusión
 */

import { cn } from '@/lib/utils'
import type { DebatePhase } from '../types'

interface PhaseIndicatorProps {
  currentPhase: DebatePhase
}

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  return (
    <div className="relative border-b border-white/10 bg-slate-900/40 backdrop-blur-xl px-4 py-3">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          {/* Contexto Phase */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
              currentPhase === 'contexto'
                ? "bg-purple-600 border-purple-400 text-white"
                : currentPhase === 'debate' || currentPhase === 'conclusion'
                ? "bg-purple-600/50 border-purple-600/50 text-purple-300"
                : "bg-slate-800/50 border-slate-600/50 text-slate-500"
            )}>
              <span className="text-xs font-bold">1</span>
            </div>
            <span className={cn(
              "text-sm font-medium transition-colors",
              currentPhase === 'contexto'
                ? "text-white"
                : currentPhase === 'debate' || currentPhase === 'conclusion'
                ? "text-purple-300"
                : "text-slate-500"
            )}>
              Contexto
            </span>
          </div>

          {/* Connector Line */}
          <div className={cn(
            "flex-1 h-0.5 transition-colors",
            currentPhase === 'debate' || currentPhase === 'conclusion'
              ? "bg-purple-600/50"
              : "bg-slate-700/50"
          )} />

          {/* Debate Phase */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
              currentPhase === 'debate'
                ? "bg-purple-600 border-purple-400 text-white"
                : currentPhase === 'conclusion'
                ? "bg-purple-600/50 border-purple-600/50 text-purple-300"
                : "bg-slate-800/50 border-slate-600/50 text-slate-500"
            )}>
              <span className="text-xs font-bold">2</span>
            </div>
            <span className={cn(
              "text-sm font-medium transition-colors",
              currentPhase === 'debate'
                ? "text-white"
                : currentPhase === 'conclusion'
                ? "text-purple-300"
                : "text-slate-500"
            )}>
              Debate
            </span>
          </div>

          {/* Connector Line */}
          <div className={cn(
            "flex-1 h-0.5 transition-colors",
            currentPhase === 'conclusion'
              ? "bg-purple-600/50"
              : "bg-slate-700/50"
          )} />

          {/* Conclusión Phase */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
              currentPhase === 'conclusion'
                ? "bg-purple-600 border-purple-400 text-white"
                : "bg-slate-800/50 border-slate-600/50 text-slate-500"
            )}>
              <span className="text-xs font-bold">3</span>
            </div>
            <span className={cn(
              "text-sm font-medium transition-colors",
              currentPhase === 'conclusion'
                ? "text-white"
                : "text-slate-500"
            )}>
              Conclusión
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
