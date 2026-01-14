import { WebSocketServer, WebSocket } from 'ws'
import type { IncomingMessage } from 'http'
import { quoorumLogger } from './logger'

interface Client {
  ws: WebSocket
  debateIds: Set<string>
}

export interface DebateUpdate {
  debateId: string
  type: 'round_start' | 'round_complete' | 'message' | 'quality_check' | 'intervention' | 'complete'
  payload: unknown
}

export class QuoorumWebSocketServer {
  private wss: WebSocketServer
  private clients: Map<WebSocket, Client> = new Map()
  private debateSubscribers: Map<string, Set<WebSocket>> = new Map()

  constructor(port: number = 3001) {
    this.wss = new WebSocketServer({ port })

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      quoorumLogger.info('WebSocket client connected', { remoteAddress: request.socket.remoteAddress })

      // Initialize client
      this.clients.set(ws, {
        ws,
        debateIds: new Set(),
      })

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as unknown
          this.handleMessage(ws, message)
        } catch (error) {
          quoorumLogger.error('WebSocket message parse error', error instanceof Error ? error : new Error(String(error)), {})
        }
      })

      ws.on('close', () => {
        quoorumLogger.info('WebSocket client disconnected', {})
        this.handleDisconnect(ws)
      })

      ws.on('error', (error: Error) => {
        quoorumLogger.error('WebSocket client error', error, {})
      })

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: 'connected',
          message: 'Connected to Forum WebSocket server',
        })
      )
    })

    quoorumLogger.info('WebSocket server listening', { port })
  }

  private handleMessage(ws: WebSocket, message: unknown) {
    if (typeof message !== 'object' || message === null) {
      quoorumLogger.error('Invalid WebSocket message format', new Error('Invalid message format'), { message })
      return
    }

    const msg = message as { type?: string; debateId?: string }
    const { type, debateId } = msg

    if (!type) {
      quoorumLogger.error('WebSocket message missing type', new Error('Message missing type'), { message })
      return
    }

    switch (type) {
      case 'subscribe':
        if (!debateId) {
          quoorumLogger.error('Subscribe message missing debateId', new Error('Subscribe message missing debateId'), {})
          return
        }
        this.subscribe(ws, debateId)
        break

      case 'unsubscribe':
        if (!debateId) {
          quoorumLogger.error('Unsubscribe message missing debateId', new Error('Unsubscribe message missing debateId'), {})
          return
        }
        this.unsubscribe(ws, debateId)
        break

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }))
        break

      default:
        quoorumLogger.warn('Unknown WebSocket message type', { type })
    }
  }

  private subscribe(ws: WebSocket, debateId: string) {
    const client = this.clients.get(ws)
    if (!client) return

    // Add debate to client's subscriptions
    client.debateIds.add(debateId)

    // Add client to debate's subscribers
    if (!this.debateSubscribers.has(debateId)) {
      this.debateSubscribers.set(debateId, new Set())
    }
    this.debateSubscribers.get(debateId)!.add(ws)

    quoorumLogger.info('Client subscribed to debate', { debateId })

    // Send confirmation
    ws.send(
      JSON.stringify({
        type: 'subscribed',
        debateId,
      })
    )
  }

  private unsubscribe(ws: WebSocket, debateId: string) {
    const client = this.clients.get(ws)
    if (!client) return

    // Remove debate from client's subscriptions
    client.debateIds.delete(debateId)

    // Remove client from debate's subscribers
    const subscribers = this.debateSubscribers.get(debateId)
    if (subscribers) {
      subscribers.delete(ws)
      if (subscribers.size === 0) {
        this.debateSubscribers.delete(debateId)
      }
    }

    quoorumLogger.info('Client unsubscribed from debate', { debateId })

    // Send confirmation
    ws.send(
      JSON.stringify({
        type: 'unsubscribed',
        debateId,
      })
    )
  }

  private handleDisconnect(ws: WebSocket) {
    const client = this.clients.get(ws)
    if (!client) return

    // Remove client from all debate subscriptions
    client.debateIds.forEach((debateId) => {
      const subscribers = this.debateSubscribers.get(debateId)
      if (subscribers) {
        subscribers.delete(ws)
        if (subscribers.size === 0) {
          this.debateSubscribers.delete(debateId)
        }
      }
    })

    // Remove client
    this.clients.delete(ws)
  }

  /**
   * Broadcast update to all subscribers of a debate
   */
  public broadcastDebateUpdate(update: DebateUpdate) {
    const { debateId, type, payload } = update

    const subscribers = this.debateSubscribers.get(debateId)
    if (!subscribers || subscribers.size === 0) {
      return
    }

    const message = JSON.stringify({
      debateId,
      type,
      payload,
      timestamp: new Date().toISOString(),
    })

    subscribers.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message)
      }
    })

    quoorumLogger.info('WebSocket broadcast sent', { type, subscriberCount: subscribers.size, debateId })
  }

  /**
   * Send update to specific client
   */
  public sendToClient(ws: WebSocket, update: DebateUpdate) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          ...update,
          timestamp: new Date().toISOString(),
        })
      )
    }
  }

  /**
   * Get number of subscribers for a debate
   */
  public getSubscriberCount(debateId: string): number {
    return this.debateSubscribers.get(debateId)?.size || 0
  }

  /**
   * Get total number of connected clients
   */
  public getClientCount(): number {
    return this.clients.size
  }

  /**
   * Close the server
   */
  public close() {
    this.wss.close()
    quoorumLogger.info('WebSocket server closed', {})
  }
}

// Singleton instance
let wsServer: QuoorumWebSocketServer | null = null

export function getWebSocketServer(): QuoorumWebSocketServer {
  if (!wsServer) {
    const port = parseInt(process.env['FORUM_WS_PORT'] || '3001', 10)
    wsServer = new QuoorumWebSocketServer(port)
  }
  return wsServer
}

// Helper function to broadcast from anywhere
export function broadcastDebateUpdate(update: DebateUpdate) {
  const server = getWebSocketServer()
  server.broadcastDebateUpdate(update)
}
