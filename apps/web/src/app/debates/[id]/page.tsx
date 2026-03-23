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

import { use } from 'react'
import { useDebateDetail } from './hooks/use-debate-detail'
import { DebateDetailView } from './components'
import type { DebatePageProps } from './types'

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function DebatePage({ params }: DebatePageProps) {
  const { id } = use(params)

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

  return (
    <DebateDetailView
      debateId={id}
      debate={debate}
      comments={comments}
      isLoading={isLoading}
      allMessages={allMessages}
      currentPhase={currentPhase}
      expertColors={expertColors}
      isContextExpanded={isContextExpanded}
      isCommentsExpanded={isCommentsExpanded}
      showHeader={true}
      showPhaseIndicator={true}
      onNavigateToDebates={navigateToDebates}
      onNavigateToNewDebate={navigateToNewDebate}
      onNavigateToRetry={navigateToRetry}
      onToggleContextExpanded={toggleContextExpanded}
      onToggleCommentsExpanded={toggleCommentsExpanded}
    />
  )
}
