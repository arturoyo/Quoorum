/**
 * Slack Webhook Route Handler
 * 
 * Handles Slack webhook events with signature verification.
 * After verification, calls tRPC endpoint to process the event.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { appRouter } from '@quoorum/api'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { logger } from '@/lib/logger'

// Import createContext from tRPC route
// We'll create a simplified version for webhooks
async function createWebhookContext() {
  // For webhooks, we don't need user authentication
  const { db } = await import('@quoorum/db')
  return {
    db,
    user: null,
    userId: null,
    supabase: null,
    authUserId: null,
  }
}

// ============================================================================
// SIGNATURE VERIFICATION
// ============================================================================

function verifySlackSignature(
  body: string,
  signature: string,
  timestamp: string
): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET
  if (!signingSecret) {
    logger.error('SLACK_SIGNING_SECRET not configured')
    return false
  }

  // Verify timestamp (prevent replay attacks)
  const currentTime = Math.floor(Date.now() / 1000)
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    // 5 minutes tolerance
    logger.warn('Slack webhook timestamp too old', { timestamp, currentTime })
    return false
  }

  // Verify signature
  const sigBaseString = `v0:${timestamp}:${body}`
  const mySignature =
    'v0=' + createHmac('sha256', signingSecret).update(sigBaseString).digest('hex')

  return timingSafeEqual(Buffer.from(signature), Buffer.from(mySignature))
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-slack-signature')
    const timestamp = request.headers.get('x-slack-request-timestamp')

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: 'Missing Slack signature or timestamp' },
        { status: 401 }
      )
    }

    // Verify signature
    if (!verifySlackSignature(body, signature, timestamp)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse body
    const event = JSON.parse(body)

    // URL verification challenge
    if (event.type === 'url_verification' && event.challenge) {
      return NextResponse.json({ challenge: event.challenge })
    }

    // Process event via tRPC
    const ctx = await createWebhookContext()
    const caller = appRouter.createCaller(ctx)
    await caller.slack.processEvent({
      event: event.event || {},
      team: event.team_id,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error('Slack webhook error', error instanceof Error ? error : undefined, {
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
