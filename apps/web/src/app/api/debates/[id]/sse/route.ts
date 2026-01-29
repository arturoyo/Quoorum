/**
 * SSE Endpoint for Debate Sessions
 * Polls debate_sessions table every 2s and streams updates to the client.
 * Compatible with Vercel serverless (no WebSocket needed).
 */

import { NextRequest } from 'next/server'
import { db } from '@quoorum/db'
import { debateSessions } from '@quoorum/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: debateId } = await params

  const encoder = new TextEncoder()
  let lastUpdatedAt = ''
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial state
      const sendEvent = (data: unknown) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          closed = true
        }
      }

      const poll = async () => {
        if (closed) return

        try {
          const [session] = await db
            .select()
            .from(debateSessions)
            .where(eq(debateSessions.debateId, debateId))
            .limit(1)

          if (!session) {
            sendEvent({ type: 'not_found' })
            return
          }

          const updatedStr = session.updatedAt.toISOString()
          if (updatedStr !== lastUpdatedAt) {
            lastUpdatedAt = updatedStr
            sendEvent({
              type: 'update',
              session: {
                id: session.id,
                debateId: session.debateId,
                state: session.state,
                currentRound: session.currentRound,
                maxRounds: session.maxRounds,
                liveMetadata: session.liveMetadata,
                pausedAt: session.pausedAt?.toISOString() ?? null,
                pauseReason: session.pauseReason,
                additionalContext: session.additionalContext,
                startedAt: session.startedAt?.toISOString() ?? null,
                completedAt: session.completedAt?.toISOString() ?? null,
                errorMessage: session.errorMessage,
              },
            })
          }

          // Terminal states: stop polling
          const terminal = ['completed', 'consensus_reached', 'force_concluded', 'failed']
          if (terminal.includes(session.state)) {
            sendEvent({ type: 'done', state: session.state })
            closed = true
            controller.close()
            return
          }
        } catch {
          // DB error, continue polling
        }

        if (!closed) {
          setTimeout(poll, 2000)
        }
      }

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        closed = true
        try { controller.close() } catch { /* already closed */ }
      })

      // Start polling
      void poll()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
