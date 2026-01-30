'use client'

import { captureMessage } from '@/lib/monitoring'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
// (no lucide imports)


// ============================================================================
// Types
// ============================================================================

interface WebSocketMessage {
  type: string
  debateId?: string
  payload?: unknown
}

interface DebateUpdate {
  type: string
  payload?: unknown
}

type DebateUpdateCallback = (data: DebateUpdate) => void

interface WebSocketContextType {
  isConnected: boolean
  subscribe: (debateId: string, callback: DebateUpdateCallback) => () => void
  send: (message: WebSocketMessage) => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: React.ReactNode
  url?: string
}

export function WebSocketProvider({ children, url: _url }: WebSocketProviderProps) {
  const [isConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const subscribersRef = useRef<Map<string, Set<DebateUpdateCallback>>>(new Map())
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    // Vercel Serverless does not support persistent WebSocket connections.
    // We disable the custom WebSocket connection to prevent errors in production.
    // The application will fallback to tRPC polling (already implemented in components).
    captureMessage('WebSockets disabled for Serverless deployment. Using polling fallback.')
    return

    /*
    try {
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        captureMessage('WebSocket connected', 'info', { action: 'websocket-connect' })
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const { debateId, type, payload } = data

          // Notify all subscribers for this debate
          const subscribers = subscribersRef.current.get(debateId)
          if (subscribers) {
            subscribers.forEach((callback) => {
              callback({ type, payload })
            })
          }
        } catch (error) {
          captureException(error instanceof Error ? error : new Error('WebSocket parse error'), {
            action: 'websocket-parse-error',
          })
        }
      }

      ws.onerror = () => {
        captureMessage('WebSocket error occurred', 'error', { action: 'websocket-error' })
      }

      ws.onclose = () => {
        captureMessage('WebSocket disconnected', 'info', { action: 'websocket-disconnect' })
        setIsConnected(false)
        wsRef.current = null

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < 10) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          reconnectAttemptsRef.current++

          captureMessage(`WebSocket reconnecting in ${delay}ms`, 'info', {
            action: 'websocket-reconnect',
            metadata: { attempt: reconnectAttemptsRef.current, delay },
          })

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }

      wsRef.current = ws
    } catch (error) {
      captureException(error instanceof Error ? error : new Error('WebSocket connection error'), {
        action: 'websocket-connection-error',
      })
    }
    */
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  const subscribe = useCallback((debateId: string, callback: DebateUpdateCallback) => {
    if (!subscribersRef.current.has(debateId)) {
      subscribersRef.current.set(debateId, new Set())
    }

    const subscribers = subscribersRef.current.get(debateId)!
    subscribers.add(callback)

    // Send subscribe message to server
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'subscribe',
          debateId,
        })
      )
    }

    // Return unsubscribe function
    return () => {
      subscribers.delete(callback)
      if (subscribers.size === 0) {
        subscribersRef.current.delete(debateId)

        // Send unsubscribe message to server
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'unsubscribe',
              debateId,
            })
          )
        }
      }
    }
  }, [])

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      captureMessage('WebSocket cannot send: not connected', 'warning')
    }
  }, [])

  const value: WebSocketContextType = {
    isConnected,
    subscribe,
    send,
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}
