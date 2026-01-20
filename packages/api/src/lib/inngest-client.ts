/**
 * Inngest Client for API
 *
 * Re-exports the Inngest client from workers package.
 * Used to send events from API routers.
 */

// Try subpath export first, fallback to main export
// This ensures compatibility with Next.js module resolution
import { inngest } from '@quoorum/workers'

export { inngest }
export { inngest as default }
