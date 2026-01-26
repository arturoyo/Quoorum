'use client'

/**
 * DebatePage - Orchestrator Component
 *
 * This page displays a debate in detail with its progress and results.
 * Phases shown: Contexto → Debate → Conclusión
 *
 * All state management is centralized in useDebateDetail hook.
 * Each section has its own component for UI rendering.
 */

import { use, useEffect, useRef } from 'react'
import { DebateProgressCascade } from '@/components/debates/debate-progress-cascade'
import { useDebateDetail } from './hooks/use-debate-detail'
import {
  PhaseIndicator,
  DebateHeader,
  DebateContextCard,
  DebateLoadingState,
  DebateNotFoundState,
  DebateDraftState,
  DebatePendingState,
  DebateInProgressState,
  DebateFailedState,
  DebateEmptyCompletedState,
  DebateMessages,
  DebateSynthesis,
  DebateRanking,
  DebateCommentsSection,
} from './components'
import { ConsensusTimeline } from '@/components/quoorum/consensus-timeline'
import { ArgumentTreeViewer } from '@/components/quoorum/argument-tree'
import { ArgumentGraph } from '@/components/quoorum/argument-graph'
import { DebateExport } from '@/components/quoorum/debate-export'
import type { DebatePageProps, RankingOption } from './types'

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function DebatePage({ params }: DebatePageProps) {
  const { id } = use(params)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // All state and handlers from centralized hook
  const {
    debate,
    comments,
    isLoading,
    allMessages,
    currentPhase,
    expertColors,
    isContextExpanded,
    isCommentsExpanded,
    navigateToDebates,
    navigateToNewDebate,
    navigateToRetry,
    toggleContextExpanded,
    toggleCommentsExpanded,
  } = useDebateDetail(id)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [debate?.rounds])

  // ═══════════════════════════════════════════════════════════
  // LOADING & ERROR STATES
  // ═══════════════════════════════════════════════════════════

  if (isLoading) {
    return <DebateLoadingState />
  }

  if (!debate) {
    return <DebateNotFoundState onNavigateToDebates={navigateToDebates} />
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="flex h-screen flex-col bg-slate-950">
      {/* Phase Indicator */}
      <PhaseIndicator currentPhase={currentPhase} />

      {/* Header */}
      <DebateHeader debate={debate} />

      {/* Messages Area */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {/* Context Card - Always Visible at Start */}
          {debate.context && (
            <DebateContextCard
              context={debate.context}
              status={debate.status}
              hasRounds={!!debate.rounds && debate.rounds.length > 0}
              isExpanded={isContextExpanded}
              onToggle={toggleContextExpanded}
            />
          )}

          {/* Progress Cascade - Show during in_progress or if processingStatus exists */}
          {(debate.status === 'in_progress' || debate.processingStatus) && (
            <DebateProgressCascade
              processingStatus={debate.processingStatus}
              status={debate.status}
            />
          )}

          {/* Draft State */}
          {debate.status === 'draft' && (
            <DebateDraftState onNavigateToNewDebate={navigateToNewDebate} />
          )}

          {/* Pending State */}
          {debate.status === 'pending' && <DebatePendingState />}

          {/* In Progress State - Live Updates (no messages yet) */}
          {debate.status === 'in_progress' && allMessages.length === 0 && (
            <DebateInProgressState
              roundsCount={debate.rounds?.length || 0}
              totalRounds={(debate as { totalRounds?: number }).totalRounds}
            />
          )}

          {/* Messages from Experts */}
          {allMessages.length > 0 && (
            <DebateMessages messages={allMessages} expertColors={expertColors} />
          )}

          {/* Failed State */}
          {debate.status === 'failed' && (
            <DebateFailedState
              onNavigateToDebates={navigateToDebates}
              onNavigateToNewDebate={navigateToNewDebate}
              onRetry={navigateToRetry}
              hasContext={!!debate.context}
              roundsCount={debate.rounds?.length}
            />
          )}

          {/* Empty Completed State - Legacy bug */}
          {debate.status === 'completed' &&
            (!debate.rounds || debate.rounds.length === 0) && (
              <DebateEmptyCompletedState
                onNavigateToDebates={navigateToDebates}
                onNavigateToNewDebate={navigateToNewDebate}
                onRetry={navigateToRetry}
                hasContext={!!debate.context}
              />
            )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Final Synthesis (Executive Summary) */}
      {debate.status === 'completed' && debate.finalSynthesis && (
        <DebateSynthesis synthesis={debate.finalSynthesis} />
      )}

      {/* Final Ranking (Bottom Sheet) */}
      {debate.status === 'completed' && debate.finalRanking && (
        <DebateRanking ranking={debate.finalRanking as RankingOption[]} />
      )}

      {/* Visualizations Section - Only for completed debates */}
      {debate.status === 'completed' && (
        <div className="border-t border-[var(--theme-border)] bg-[var(--theme-bg-primary)]/60 px-4 py-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Export Button */}
            <div className="flex justify-end">
              <DebateExport debateId={id} />
            </div>

            {/* Consensus Timeline */}
            <ConsensusTimeline debateId={id} />

            {/* Argument Graph (Interactive) */}
            <ArgumentGraph debateId={id} />

            {/* Argument Tree (List View - Fallback) */}
            <ArgumentTreeViewer debateId={id} />
          </div>
        </div>
      )}

      {/* Comments Section */}
      {debate.status === 'completed' && (
        <DebateCommentsSection
          debateId={id}
          commentsCount={comments?.length}
          isExpanded={isCommentsExpanded}
          onToggle={toggleCommentsExpanded}
        />
      )}
    </div>
  )
}
