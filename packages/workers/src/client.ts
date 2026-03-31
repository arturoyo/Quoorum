/**
 * Inngest Client for Quoorum Workers
 *
 * Creates a real Inngest client only when INNGEST_EVENT_KEY is configured.
 * Without the key, creates a no-op stub that silently skips event sending
 * to avoid 401 "Event key not found" log noise.
 */

import { Inngest } from 'inngest'

const hasInngestKey = !!process.env.INNGEST_EVENT_KEY

let inngestClient: unknown

if (hasInngestKey) {
  // Real Inngest client with valid API key
  inngestClient = new Inngest({
    id: 'quoorum',
    eventKey: process.env.INNGEST_EVENT_KEY,
  })
} else {
  // No-op stub: avoids 401 errors when Inngest is not configured.
  // The send() method is the main entry point used by API routers.
  inngestClient = {
    send: async () => {
      // Silently skip - callers already have try/catch with fallback to inline execution
    },
    createFunction: (...args: unknown[]) => args,
  }
}

export const inngest = inngestClient
