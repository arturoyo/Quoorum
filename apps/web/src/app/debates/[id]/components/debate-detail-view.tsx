'use client'

/**
 * DebateDetailView - Reusable Debate Display Component
 *
 * This component displays a debate in detail with its progress and results.
 * It's used both in the full-page view and in the split-pane layout.
 * Can be rendered without the header and phase indicator when embedded.
 */

import { useRef, useEffect } from 'react'
import { DebateProgressCascade } from '@/components/debates'
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
} from '.'
import { ConsensusTimeline, ArgumentGraph, DebateExport } from '@/components/quoorum'
import type { RankingOption, DebatePhase } from '../types'

interface DebateDetailViewProps {
  debateId: string
  debate: any // Debate type from useDebateDetail
  comments: any[] | undefined
  isLoading: boolean
  allMessages: any[]
  currentPhase: DebatePhase
  expertColors: Record<string, string>
  isContextExpanded: boolean
  isCommentsExpanded: boolean
  showHeader?: boolean
  showPhaseIndicator?: boolean
  onNavigateToDebates: () => void
  onNavigateToNewDebate: () => void
  onNavigateToRetry: () => void
  onToggleContextExpanded: () => void
  onToggleCommentsExpanded: () => void
}

export function DebateDetailView({
  debateId,
  debate,
  comments,
  isLoading,
  allMessages,
  currentPhase,
  expertColors,
  isContextExpanded,
  isCommentsExpanded,
  showHeader = true,
  showPhaseIndicator = true,
  onNavigateToDebates,
  onNavigateToNewDebate,
  onNavigateToRetry,
  onToggleContextExpanded,
  onToggleCommentsExpanded,
}: DebateDetailViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    return <DebateNotFoundState onNavigateToDebates={onNavigateToDebates} />
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="flex h-full flex-col bg-slate-950 overflow-hidden">
      {/* Phase Indicator - Conditional */}
      {showPhaseIndicator && <PhaseIndicator currentPhase={currentPhase} />}

      {/* Header - Conditional */}
      {showHeader && <DebateHeader debate={debate} />}

      {/* Messages Area */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {/* Context Card - Always Visible at Start */}
          {debate.context && (
            <DebateContextCard
              question={debate.metadata?.title || undefined}
              context={debate.context}
              status={debate.status}
              hasRounds={!!debate.rounds && debate.rounds.length > 0}
              isExpanded={isContextExpanded}
              onToggle={onToggleContextExpanded}
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
            <DebateDraftState onNavigateToNewDebate={onNavigateToNewDebate} />
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
              onNavigateToDebates={onNavigateToDebates}
              onNavigateToNewDebate={onNavigateToNewDebate}
              onRetry={onNavigateToRetry}
              hasContext={!!debate.context}
              roundsCount={debate.rounds?.length}
            />
          )}

          {/* Empty Completed State - Legacy bug */}
          {debate.status === 'completed' &&
            (!debate.rounds || debate.rounds.length === 0) && (
              <DebateEmptyCompletedState
                onNavigateToDebates={onNavigateToDebates}
                onNavigateToNewDebate={onNavigateToNewDebate}
                onRetry={onNavigateToRetry}
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

      {/* Visualizations Section - Only for completed debates with actual results */}
      {debate.status === 'completed' && (debate.finalSynthesis || debate.finalRanking) && (
        <div className="border-t border-[var(--theme-border)] bg-[var(--theme-bg-primary)]/60 px-4 py-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Export Button */}
            <div className="flex justify-end">
              <DebateExport debateId={debateId} />
            </div>

            {/* Consensus Timeline */}
            <ConsensusTimeline debateId={debateId} />

            {/* Argument Graph (Interactive) */}
            <ArgumentGraph debateId={debateId} />
          </div>
        </div>
      )}

      {/* Comments Section */}
      {debate.status === 'completed' && (
        <DebateCommentsSection
          debateId={debateId}
          commentsCount={comments?.length}
          isExpanded={isCommentsExpanded}
          onToggle={onToggleCommentsExpanded}
        />
      )}
    </div>
  )
}
