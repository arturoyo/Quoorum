/**
 * Analytics tracking for Quoorum Decision-Making Frameworks
 *
 * This module provides functions to track framework usage and user interactions.
 * Currently set up for PostHog, but can be adapted to other analytics providers.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface FrameworkAnalyticsEvent {
  frameworkSlug: 'pros-and-cons' | 'swot-analysis' | 'eisenhower-matrix'
  action:
    | 'viewed_landing'
    | 'started_analysis'
    | 'completed_analysis'
    | 'exported_pdf'
    | 'shared_result'
  metadata?: Record<string, unknown>
}

export interface FrameworkAnalyticsData {
  questionLength?: number
  hasContext?: boolean
  hasUserBackstory?: boolean
  executionTimeMs?: number
  prosCount?: number
  consCount?: number
  strengthsCount?: number
  weaknessesCount?: number
  opportunitiesCount?: number
  threatsCount?: number
  tasksCount?: number
  q1Count?: number
  q2Count?: number
  q3Count?: number
  q4Count?: number
}

// ============================================================================
// TRACKING FUNCTIONS
// ============================================================================

/**
 * Track framework page view
 */
export function trackFrameworkView(frameworkSlug: FrameworkAnalyticsEvent['frameworkSlug']): void {
  if (typeof window === 'undefined') return

  // PostHog tracking
  if (window.posthog) {
    window.posthog.capture('framework_viewed', {
      framework: frameworkSlug,
      path: window.location.pathname,
    })
  }

  // Google Analytics (if configured)
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: `Framework: ${frameworkSlug}`,
      page_location: window.location.href,
      page_path: window.location.pathname,
    })
  }
}

/**
 * Track framework analysis start
 */
export function trackFrameworkStart(
  frameworkSlug: FrameworkAnalyticsEvent['frameworkSlug'],
  data: FrameworkAnalyticsData
): void {
  if (typeof window === 'undefined') return

  if (window.posthog) {
    window.posthog.capture('framework_started', {
      framework: frameworkSlug,
      question_length: data.questionLength,
      has_context: data.hasContext,
      has_backstory: data.hasUserBackstory,
    })
  }
}

/**
 * Track framework analysis completion
 */
export function trackFrameworkCompletion(
  frameworkSlug: FrameworkAnalyticsEvent['frameworkSlug'],
  data: FrameworkAnalyticsData
): void {
  if (typeof window === 'undefined') return

  if (window.posthog) {
    window.posthog.capture('framework_completed', {
      framework: frameworkSlug,
      execution_time_ms: data.executionTimeMs,
      ...data,
    })
  }

  // Track conversion
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      event_category: 'Framework',
      event_label: frameworkSlug,
      value: 1,
    })
  }
}

/**
 * Track PDF export
 */
export function trackFrameworkExport(
  frameworkSlug: FrameworkAnalyticsEvent['frameworkSlug']
): void {
  if (typeof window === 'undefined') return

  if (window.posthog) {
    window.posthog.capture('framework_exported', {
      framework: frameworkSlug,
      format: 'pdf',
    })
  }
}

/**
 * Track result sharing
 */
export function trackFrameworkShare(
  frameworkSlug: FrameworkAnalyticsEvent['frameworkSlug'],
  method: 'link' | 'email' | 'social'
): void {
  if (typeof window === 'undefined') return

  if (window.posthog) {
    window.posthog.capture('framework_shared', {
      framework: frameworkSlug,
      method,
    })
  }
}

/**
 * Track CTA click from landing page
 */
export function trackFrameworkCTA(
  frameworkSlug: FrameworkAnalyticsEvent['frameworkSlug'],
  ctaLocation: 'hero' | 'example' | 'features' | 'footer'
): void {
  if (typeof window === 'undefined') return

  if (window.posthog) {
    window.posthog.capture('framework_cta_clicked', {
      framework: frameworkSlug,
      cta_location: ctaLocation,
    })
  }
}

// ============================================================================
// TYPE EXTENSIONS FOR WINDOW
// ============================================================================

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void
      identify: (userId: string, properties?: Record<string, unknown>) => void
    }
    gtag?: (
      command: string,
      action: string,
      params?: Record<string, unknown>
    ) => void
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Initialize analytics for frameworks section
 * Call this in the layout or main component
 */
export function initFrameworksAnalytics(): void {
  if (typeof window === 'undefined') return

  // Identify user if authenticated
  // This should be called from a component that has access to user context
  // Example:
  // if (window.posthog && user) {
  //   window.posthog.identify(user.id, {
  //     email: user.email,
  //     name: user.name,
  //   });
  // }
}

/**
 * Get framework display name
 */
export function getFrameworkDisplayName(
  slug: FrameworkAnalyticsEvent['frameworkSlug']
): string {
  const names = {
    'pros-and-cons': 'Pros and Cons',
    'swot-analysis': 'SWOT Analysis',
    'eisenhower-matrix': 'Eisenhower Matrix',
  }
  return names[slug]
}
