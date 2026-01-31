/**
 * Quoorum React Hooks
 *
 * Quick bonus hooks for easier Quoorum integration
 */

import { captureException } from '@/lib/monitoring'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/trpc/client'

// ============================================================================
// TYPES
// ============================================================================

interface WebSocketMessage {
  type: string
  debateId?: string
  payload?: unknown
}

// ============================================================================
// DEBATE HOOKS
// ============================================================================

/**
 * Hook para gestionar la lista de debates con auto-refresh opcional.
 *
 * Este hook carga la lista de debates del usuario y permite configurar
 * un intervalo de auto-refresh para mantener los datos actualizados.
 *
 * @param refreshInterval - Intervalo en milisegundos para auto-refresh (opcional).
 *                          Si no se proporciona, no hay auto-refresh.
 *
 * @returns Objeto con el estado de la lista de debates
 * @returns debates - Array de debates del usuario
 * @returns isLoading - `true` mientras se cargan los debates
 * @returns error - Error si falla la carga (opcional)
 * @returns refresh - Función para refrescar manualmente la lista
 *
 * @example
 * ```tsx
 * // Lista básica sin auto-refresh
 * function DebateList() {
 *   const { debates, isLoading } = useDebateList()
 *
 *   if (isLoading) return <Skeleton />
 *
 *   return (
 *     <div>
 *       {debates.map(debate => (
 *         <DebateCard key={debate.id} debate={debate} />
 *       ))}
 *     </div>
 *   )
 * }
 *
 * // Lista con auto-refresh cada 30 segundos
 * function LiveDebateList() {
 *   const { debates, refresh } = useDebateList(30000)
 *
 *   return (
 *     <div>
 *       <button onClick={refresh}>Refrescar ahora</button>
 *       {debates.map(debate => (
 *         <DebateCard key={debate.id} debate={debate} />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useDebateList(refreshInterval?: number) {
  const { data: debates, isLoading, error, refetch } = api.quoorum.list.useQuery()

  // Auto-refresh
  useEffect(() => {
    if (!refreshInterval) return

    const interval = setInterval(() => {
      refetch()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval, refetch])

  return {
    debates: debates || [],
    isLoading,
    error,
    refresh: refetch,
  }
}

/**
 * Hook para gestionar un debate individual con actualizaciones en tiempo real.
 *
 * Este hook carga un debate específico y se suscribe a actualizaciones en tiempo real
 * mediante WebSocket (si está disponible) o polling.
 *
 * **Características:**
 * - Carga el debate por ID
 * - Suscripción automática a actualizaciones en tiempo real (WebSocket)
 * - Auto-refresh cuando se reciben actualizaciones
 * - Manejo de errores y estados de carga
 *
 * @param debateId - ID del debate a cargar (o `null` para deshabilitar)
 *
 * @returns Objeto con el estado del debate
 * @returns debate - Datos del debate (o `undefined` si no se ha cargado)
 * @returns isLoading - `true` mientras se carga el debate
 * @returns error - Error si falla la carga (opcional)
 * @returns refresh - Función para refrescar manualmente el debate
 *
 * @example
 * ```tsx
 * function DebateView({ debateId }: { debateId: string }) {
 *   const { debate, isLoading, error } = useDebate(debateId)
 *
 *   if (isLoading) return <Skeleton />
 *   if (error) return <ErrorState error={error} />
 *   if (!debate) return <EmptyState />
 *
 *   return (
 *     <div>
 *       <h1>{debate.question}</h1>
 *       <DebateRounds rounds={debate.rounds} />
 *       <ConsensusResult consensus={debate.consensus} />
 *     </div>
 *   )
 * }
 *
 * // Con refresh manual
 * function DebateWithRefresh({ debateId }: { debateId: string }) {
 *   const { debate, refresh } = useDebate(debateId)
 *
 *   return (
 *     <div>
 *       <button onClick={refresh}>Actualizar</button>
 *       {debate && <DebateContent debate={debate} />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useDebate(debateId: string | null) {
  const {
    data: debate,
    isLoading,
    error,
    refetch,
  } = api.quoorum.get.useQuery({ id: debateId! }, { enabled: !!debateId })

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!debateId) return

    // Connect to WebSocket - use env variable or skip in production (Vercel doesn't support WebSockets)
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL
    if (!wsUrl) return // Skip WebSocket in production - use polling instead

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', debateId }))
    }

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data)
      if (update.debateId === debateId) {
        refetch()
      }
    }

    return () => {
      ws.close()
    }
  }, [debateId, refetch])

  return {
    debate,
    isLoading,
    error,
    refresh: refetch,
  }
}

/**
 * Hook for creating debates with optimistic updates
 */
export function useCreateDebate() {
  const utils = api.useUtils()
  const createMutation = api.quoorum.create.useMutation({
    onSuccess: () => {
      utils.forum.list.invalidate()
    },
  })

  const create = useCallback(
    async (question: string, mode: 'static' | 'dynamic' = 'dynamic') => {
      return createMutation.mutateAsync({ question, mode })
    },
    [createMutation]
  )

  return {
    create,
    isCreating: createMutation.isPending,
    error: createMutation.error,
  }
}

/**
 * Hook for starting debates
 */
export function useStartDebate() {
  const utils = api.useUtils()
  const startMutation = api.quoorum.start.useMutation({
    onSuccess: () => {
      utils.forum.list.invalidate()
    },
  })

  const start = useCallback(
    async (debateId: string) => {
      return startMutation.mutateAsync({ id: debateId })
    },
    [startMutation]
  )

  return {
    start,
    isStarting: startMutation.isPending,
    error: startMutation.error,
  }
}

// ============================================================================
// ANALYTICS HOOKS
// ============================================================================

/**
 * Hook for forum analytics
 */
export function useForumAnalytics() {
  const { data: analytics, isLoading, error } = api.quoorum.analytics.useQuery()

  return {
    analytics,
    isLoading,
    error,
  }
}

/**
 * Hook for expert performance
 */
export function useExpertPerformance(expertId?: string) {
  const {
    data: performance,
    isLoading,
    error,
  } = api.quoorum.expertPerformance.useQuery({ expertId: expertId! }, { enabled: !!expertId })

  return {
    performance,
    isLoading,
    error,
  }
}

// ============================================================================
// INTERACTION HOOKS
// ============================================================================

/**
 * Hook for adding comments
 */
export function useAddComment() {
  const utils = api.useUtils()
  const addCommentMutation = api.quoorum.addComment.useMutation({
    onSuccess: (_, variables) => {
      utils.forum.get.invalidate({ id: variables.debateId })
    },
  })

  const addComment = useCallback(
    async (debateId: string, content: string, mentions?: string[]) => {
      return addCommentMutation.mutateAsync({ debateId, content, mentions })
    },
    [addCommentMutation]
  )

  return {
    addComment,
    isAdding: addCommentMutation.isPending,
    error: addCommentMutation.error,
  }
}

/**
 * Hook for adding reactions
 */
export function useAddReaction() {
  const utils = api.useUtils()
  const addReactionMutation = api.quoorum.addReaction.useMutation({
    onSuccess: (_, variables) => {
      utils.forum.get.invalidate({ id: variables.debateId })
    },
  })

  const addReaction = useCallback(
    async (debateId: string, reaction: string) => {
      return addReactionMutation.mutateAsync({ debateId, reaction })
    },
    [addReactionMutation]
  )

  return {
    addReaction,
    isAdding: addReactionMutation.isPending,
    error: addReactionMutation.error,
  }
}

// ============================================================================
// CUSTOM EXPERTS HOOKS
// ============================================================================

/**
 * Hook for managing custom experts
 */
export function useCustomExperts() {
  const { data: experts, isLoading, error, refetch } = api.quoorum.listExperts.useQuery()
  const utils = api.useUtils()

  const createMutation = api.quoorum.createCustomExpert.useMutation({
    onSuccess: () => {
      utils.forum.listExperts.invalidate()
    },
  })

  const updateMutation = api.quoorum.updateCustomExpert.useMutation({
    onSuccess: () => {
      utils.forum.listExperts.invalidate()
    },
  })

  const deleteMutation = api.quoorum.deleteCustomExpert.useMutation({
    onSuccess: () => {
      utils.forum.listExperts.invalidate()
    },
  })

  return {
    experts: experts || [],
    isLoading,
    error,
    refresh: refetch,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for checking rate limits
 */
export function useRateLimit() {
  const { data: rateLimit, isLoading, error, refetch } = api.quoorum.checkRateLimit.useQuery()

  return {
    rateLimit,
    isLoading,
    error,
    refresh: refetch,
    canCreateDebate: rateLimit?.allowed ?? false,
    reason: rateLimit?.reason,
  }
}

/**
 * Hook for finding similar debates
 */
export function useSimilarDebates(question: string, enabled: boolean = true) {
  const {
    data: similar,
    isLoading,
    error,
  } = api.quoorum.getSimilar.useQuery({ question }, { enabled: enabled && question.length > 10 })

  return {
    similar: similar || [],
    isLoading,
    error,
    hasSimilar: (similar?.length || 0) > 0,
  }
}

/**
 * Hook for debate search with debounce
 */
export function useDebateSearch(initialQuery: string = '') {
  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const { data: debates } = api.quoorum.list.useQuery()

  // Filter debates by query
  const filteredDebates =
    debates?.filter((debate) =>
      debate.question?.toLowerCase().includes(debouncedQuery.toLowerCase())
    ) || []

  return {
    query,
    setQuery,
    debates: filteredDebates,
    isSearching: query !== debouncedQuery,
  }
}

/**
 * Hook for managing WebSocket connection
 */
export function useWebSocket(url?: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Use provided URL, env variable, or skip if not available (Vercel doesn't support WebSockets)
    const wsUrl = url || process.env.NEXT_PUBLIC_WS_URL
    if (!wsUrl) return // Skip WebSocket connection in production

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
    }

    ws.onclose = () => {
      setIsConnected(false)
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as WebSocketMessage
        setLastMessage(data)
      } catch (error) {
        captureException(error instanceof Error ? error : new Error('WebSocket parse error'), {
          action: 'use-forum-websocket-parse',
        })
      }
    }

    return () => {
      ws.close()
    }
  }, [url])

  const send = useCallback((data: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  return {
    isConnected,
    lastMessage,
    send,
  }
}

/**
 * Hook for local storage persistence
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch (error) {
      captureException(error instanceof Error ? error : new Error('localStorage read error'), {
        action: 'use-local-storage-read',
        metadata: { key },
      })
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      } catch (error) {
        captureException(error instanceof Error ? error : new Error('localStorage write error'), {
          action: 'use-local-storage-write',
          metadata: { key },
        })
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue] as const
}

/**
 * Hook for tracking debate progress
 */
export function useDebateProgress(debateId: string | null) {
  const { debate } = useDebate(debateId)

  const progress = {
    current: debate?.rounds?.length || 0,
    total: 10, // Max rounds
    percentage: Math.min(100, ((debate?.rounds?.length || 0) / 10) * 100),
    isComplete: debate?.status === 'completed',
    isFailed: debate?.status === 'failed',
  }

  return progress
}
