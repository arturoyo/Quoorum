/**
 * useDebateSession Hook
 * Connects to the SSE endpoint for real-time debate session updates.
 * Provides pause/resume/inject/forceConsensus mutations via tRPC.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/trpc'

interface SessionData {
  id: string
  debateId: string
  state: string
  currentRound: number
  maxRounds: number
  liveMetadata: {
    consensusScore?: number
    dominantPosition?: string
    activeExperts?: string[]
    lastRoundSummary?: string
    argumentCount?: number
  } | null
  pausedAt: string | null
  pauseReason: string | null
  additionalContext: Array<{
    text: string
    injectedAt: string
    injectedBy: string
  }> | null
  startedAt: string | null
  completedAt: string | null
  errorMessage: string | null
}

interface UseDebateSessionReturn {
  session: SessionData | null
  isConnected: boolean
  isDone: boolean
  error: string | null
  pause: (reason?: string) => Promise<void>
  resume: () => Promise<void>
  addContext: (text: string) => Promise<void>
  forceConsensus: () => Promise<void>
}

export function useDebateSession(debateId: string | null): UseDebateSessionReturn {
  const [session, setSession] = useState<SessionData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // tRPC mutations
  const pauseMutation = api.debateSessions.pause.useMutation()
  const resumeMutation = api.debateSessions.resume.useMutation()
  const addContextMutation = api.debateSessions.addContext.useMutation()
  const forceConsensusMutation = api.debateSessions.forceConsensus.useMutation()

  // Connect to SSE
  useEffect(() => {
    if (!debateId) return

    const es = new EventSource(`/api/debates/${debateId}/sse`)
    eventSourceRef.current = es

    es.onopen = () => {
      setIsConnected(true)
      setError(null)
    }

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as { type: string; session?: SessionData; state?: string }
        if (data.type === 'update' && data.session) {
          setSession(data.session)
        } else if (data.type === 'done') {
          setIsDone(true)
          es.close()
        } else if (data.type === 'not_found') {
          setError('Session not found')
        }
      } catch {
        // Ignore parse errors
      }
    }

    es.onerror = () => {
      setIsConnected(false)
      setError('Connection lost')
    }

    return () => {
      es.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }, [debateId])

  const pause = useCallback(async (reason?: string) => {
    if (!session) return
    await pauseMutation.mutateAsync({ sessionId: session.id, reason })
  }, [session, pauseMutation])

  const resume = useCallback(async () => {
    if (!session) return
    await resumeMutation.mutateAsync({ sessionId: session.id })
  }, [session, resumeMutation])

  const addContext = useCallback(async (text: string) => {
    if (!session) return
    await addContextMutation.mutateAsync({ sessionId: session.id, text })
  }, [session, addContextMutation])

  const forceConsensus = useCallback(async () => {
    if (!session) return
    await forceConsensusMutation.mutateAsync({ sessionId: session.id })
  }, [session, forceConsensusMutation])

  return {
    session,
    isConnected,
    isDone,
    error,
    pause,
    resume,
    addContext,
    forceConsensus,
  }
}
