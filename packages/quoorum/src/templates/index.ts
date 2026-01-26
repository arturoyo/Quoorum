/**
 * Templates
 *
 * Industry-specific debate templates for common business decisions.
 * This file provides backwards-compatible exports for the templates system.
 * Templates are organized into category files for better maintainability.
 */

// Re-export types
export type { DebateTemplate } from './types'

// Import category templates
import { SAAS_TEMPLATES, getSaasTemplateIds } from './saas'
import { STARTUP_TEMPLATES, getStartupTemplateIds } from './startup'
import { ECOMMERCE_TEMPLATES, getEcommerceTemplateIds } from './ecommerce'
import { MARKETPLACE_TEMPLATES, getMarketplaceTemplateIds } from './marketplace'
import { CREATOR_TEMPLATES, getCreatorTemplateIds } from './creator'
import { INVESTOR_TEMPLATES, getInvestorTemplateIds } from './investor'
import type { DebateTemplate } from './types'

// Re-export category templates
export { SAAS_TEMPLATES, getSaasTemplateIds } from './saas'
export { STARTUP_TEMPLATES, getStartupTemplateIds } from './startup'
export { ECOMMERCE_TEMPLATES, getEcommerceTemplateIds } from './ecommerce'
export { MARKETPLACE_TEMPLATES, getMarketplaceTemplateIds } from './marketplace'
export { CREATOR_TEMPLATES, getCreatorTemplateIds } from './creator'
export { INVESTOR_TEMPLATES, getInvestorTemplateIds } from './investor'

/**
 * All templates combined
 *
 * This is the main export that combines all category templates.
 * Maintains backwards compatibility with the original templates.ts
 */
export const ALL_TEMPLATES: DebateTemplate[] = [
  ...SAAS_TEMPLATES,
  ...STARTUP_TEMPLATES,
  ...ECOMMERCE_TEMPLATES,
  ...MARKETPLACE_TEMPLATES,
  ...CREATOR_TEMPLATES,
  ...INVESTOR_TEMPLATES,
]

/**
 * Get templates by industry
 */
export function getTemplatesByIndustry(industry: string): DebateTemplate[] {
  return ALL_TEMPLATES.filter((t) => t.industry === industry)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): DebateTemplate[] {
  return ALL_TEMPLATES.filter((t) => t.category === category)
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): DebateTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id)
}

/**
 * Search templates
 */
export function searchTemplates(query: string): DebateTemplate[] {
  const lowerQuery = query.toLowerCase()
  return ALL_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery) ||
      t.industry.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get all industries
 */
export function getAllIndustries(): string[] {
  return Array.from(new Set(ALL_TEMPLATES.map((t) => t.industry)))
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(ALL_TEMPLATES.map((t) => t.category)))
}

/**
 * Get all template IDs grouped by industry
 */
export function getTemplateIdsByIndustry(): Record<string, string[]> {
  return {
    saas: getSaasTemplateIds(),
    startup: getStartupTemplateIds(),
    ecommerce: getEcommerceTemplateIds(),
    marketplace: getMarketplaceTemplateIds(),
    creator: getCreatorTemplateIds(),
    investor: getInvestorTemplateIds(),
  }
}

/**
 * Get total number of templates
 */
export function getTemplateCount(): number {
  return ALL_TEMPLATES.length
}

/**
 * Industry labels for UI
 */
export const INDUSTRY_LABELS: Record<string, string> = {
  saas: 'SaaS',
  startup: 'Startup',
  ecommerce: 'E-commerce',
  marketplace: 'Marketplace',
  creator: 'Creator Economy',
  investor: 'Investment & VC',
}
