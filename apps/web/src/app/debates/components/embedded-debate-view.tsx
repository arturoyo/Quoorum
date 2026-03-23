'use client'

import { DebateDetailView } from '@/app/debates/[id]/components'
import { useDebateDetail } from '@/app/debates/[id]/hooks/use-debate-detail'

interface EmbeddedDebateViewProps {
  debateId: string
}

export function EmbeddedDebateView({ debateId }: EmbeddedDebateViewProps) {
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
  } = useDebateDetail(debateId)

  return (
    <DebateDetailView
      debateId={debateId}
      debate={debate}
      comments={comments}
      isLoading={isLoading}
      allMessages={allMessages}
      currentPhase={currentPhase}
      expertColors={expertColors}
      isContextExpanded={isContextExpanded}
      isCommentsExpanded={isCommentsExpanded}
      showHeader={true}
      showPhaseIndicator={false}
      onNavigateToDebates={navigateToDebates}
      onNavigateToNewDebate={navigateToNewDebate}
      onNavigateToRetry={navigateToRetry}
      onToggleContextExpanded={toggleContextExpanded}
      onToggleCommentsExpanded={toggleCommentsExpanded}
    />
  )
}
