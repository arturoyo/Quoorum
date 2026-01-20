/**
 * Inngest Client for Quoorum Workers
 *
 * Real Inngest client for production, stub for development.
 */

import { Inngest } from 'inngest'

const isDev = process.env.NODE_ENV === 'development'

// Create client based on environment
let inngestClient: any

// Always use real Inngest client
// Set a dev key if not provided
inngestClient = new Inngest({
  id: 'quoorum',
  eventKey: process.env.INNGEST_EVENT_KEY || 'dev',
})

export const inngest = inngestClient
