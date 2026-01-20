/**
 * Inngest Client for Quoorum Workers
 *
 * Real Inngest client for production, stub for development.
 */

import { Inngest } from 'inngest'

const isDev = process.env.NODE_ENV === 'development'
const hasInngestKey = !!process.env.INNGEST_EVENT_KEY

// Create client based on environment
let inngestClient: any

if (!hasInngestKey && isDev) {
  // In development without key, use local dev mode
  console.log('[Inngest] Running in local dev mode (no event key configured)')
  inngestClient = new Inngest({
    id: 'quoorum',
    // No eventKey means it will use local dev server
  })
} else {
  // Production or dev with explicit key
  inngestClient = new Inngest({
    id: 'quoorum',
    eventKey: process.env.INNGEST_EVENT_KEY,
  })
}

export const inngest = inngestClient
