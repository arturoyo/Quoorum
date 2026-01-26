/**
 * Template Types
 *
 * Shared types for debate templates used across industries.
 */

/**
 * Debate Template
 *
 * Pre-configured template for common business decisions by industry
 */
export interface DebateTemplate {
  id: string
  name: string
  description: string
  industry: string
  category: string
  questionTemplate: string
  suggestedExperts: string[]
  defaultContext: {
    constraints?: string[]
    background?: string
  }
  examples: string[]
}
