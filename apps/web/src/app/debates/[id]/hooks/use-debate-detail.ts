/**
 * useDebateDetail Hook
 *
 * Centralized state management for the debate detail page.
 * Handles queries, expert colors, and derived state.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import type { RoundMessage, ProcessedMessage, DebatePhase } from '../types'
import { EXPERT_COLORS } from '../types'

export function useDebateDetail(debateId: string) {
  const router = useRouter()
  const [expertColors, setExpertColors] = useState<Record<string, string>>({})
  const [isContextExpanded, setIsContextExpanded] = useState(true)
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false)

  // ═══════════════════════════════════════════════════════════
  // QUERIES
  // ═══════════════════════════════════════════════════════════

  // Fetch debate with refetch interval for real-time updates
  const { data: debate, isLoading } = api.debates.get.useQuery(
    { id: debateId },
    {
      refetchInterval: (data) => {
        // Poll every 3 seconds while debate is in progress
        return data?.status === 'in_progress' ? 3000 : false
      },
      refetchIntervalInBackground: true,
    }
  )

  // Fetch comments count for header
  const { data: comments } = api.quoorum.getComments.useQuery(
    { debateId },
    { enabled: debate?.status === 'completed' }
  )

  // ═══════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════

  // Assign colors to experts
  useEffect(() => {
    if (!debate?.rounds) return

    const experts = new Set<string>()
    debate.rounds.forEach((round: { messages?: RoundMessage[] }) => {
      round.messages?.forEach((msg: RoundMessage) => {
        if (msg.expert) experts.add(msg.expert)
        else if (msg.agentKey) experts.add(msg.agentKey)
      })
    })

    const colors: Record<string, string> = {}
    Array.from(experts).forEach((expert, idx) => {
      colors[expert] = EXPERT_COLORS[idx % EXPERT_COLORS.length] || EXPERT_COLORS[0]
    })

    setExpertColors(colors)
  }, [debate])

  // ═══════════════════════════════════════════════════════════
  // DERIVED STATE
  // ═══════════════════════════════════════════════════════════

  // Collect all messages from all rounds for chat view
  const allMessages: ProcessedMessage[] = useMemo(() => {
    return debate?.rounds?.flatMap((round: { messages?: RoundMessage[] }, roundIdx: number) =>
      round.messages?.map((msg: RoundMessage, msgIdx: number) => ({
        ...msg,
        roundNumber: roundIdx + 1,
        messageId: `${roundIdx}-${msgIdx}`,
      }))
    ) ?? []
  }, [debate?.rounds])

  // Determine current phase based on debate status
  const currentPhase: DebatePhase = useMemo(() => {
    if (!debate) return 'contexto'

    if (debate.status === 'completed') {
      return 'conclusion'
    }

    if (debate.status === 'in_progress' || debate.status === 'pending') {
      return 'debate'
    }

    // draft status means still in context phase
    return 'contexto'
  }, [debate])

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════

  const navigateToDebates = useCallback(() => {
    router.push('/debates')
  }, [router])

  const navigateToNewDebate = useCallback(() => {
    router.push('/debates/new-unified?new=1')
  }, [router])

  const navigateToRetry = useCallback(() => {
    if (debate?.id) {
      router.push(`/debates/new-unified?retry=${debate.id}`)
    }
  }, [router, debate?.id])

  const toggleContextExpanded = useCallback(() => {
    setIsContextExpanded(prev => !prev)
  }, [])

  const toggleCommentsExpanded = useCallback(() => {
    setIsCommentsExpanded(prev => !prev)
  }, [])

  // ═══════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════

  return {
    // Data
    debate,
    comments,
    isLoading,

    // Derived state
    allMessages,
    currentPhase,
    expertColors,

    // UI state
    isContextExpanded,
    isCommentsExpanded,

    // Handlers
    navigateToDebates,
    navigateToNewDebate,
    navigateToRetry,
    toggleContextExpanded,
    toggleCommentsExpanded,
  }
}

export type UseDebateDetailReturn = ReturnType<typeof useDebateDetail>
