/**
 * Inngest Client for Quoorum Workers
 *
 * Real Inngest client for production, stub for development.
 */

import { Inngest } from 'inngest'

const isDev = process.env.NODE_ENV === 'development'
const hasInngestKey = !!process.env.INNGEST_EVENT_KEY

// Create client based on environment
let inngestClient: unknown

if (!hasInngestKey && isDev) {
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
