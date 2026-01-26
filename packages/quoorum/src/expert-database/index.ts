/**
 * Expert Database
 *
 * Base de datos de expertos con sus especialidades, áreas de conocimiento y perfiles.
 * Cada experto tiene un perfil único que define su perspectiva y expertise.
 *
 * NOTA: Los providers/models pueden configurarse via environment variables.
 * Ver config/expert-config.ts para detalles.
 *
 * This file provides backwards-compatible exports for the expert database.
 * Experts are organized into category files for better maintainability.
 */

// Re-export types
export type { ExpertProfile, ExpertProvider, ExpertDatabase } from './types'

// Import category databases
import { SAAS_EXPERTS, getSaasExpertIds } from './saas-experts'
import { VENTURE_CAPITAL_EXPERTS, getVentureCapitalExpertIds } from './venture-capital'
import { GENERAL_EXPERTS, getGeneralExpertIds } from './general'
import { VIDA_PERSONAL_EXPERTS, getVidaPersonalExpertIds } from './vida-personal'
import { HISTORICOS_EXPERTS, getHistoricosExpertIds } from './historicos'
import { DESIGN_UX_EXPERTS, getDesignUxExpertIds } from './design-ux-experts'
import { ENGINEERING_EXPERTS, getEngineeringExpertIds } from './engineering-experts'
import { LEGAL_EXPERTS, getLegalExpertIds } from './legal-experts'
import type { ExpertProfile } from './types'

// Re-export category databases
export { SAAS_EXPERTS, getSaasExpertIds } from './saas-experts'
export { VENTURE_CAPITAL_EXPERTS, getVentureCapitalExpertIds } from './venture-capital'
export { GENERAL_EXPERTS, getGeneralExpertIds } from './general'
export { VIDA_PERSONAL_EXPERTS, getVidaPersonalExpertIds } from './vida-personal'
export { HISTORICOS_EXPERTS, getHistoricosExpertIds } from './historicos'
export { DESIGN_UX_EXPERTS, getDesignUxExpertIds } from './design-ux-experts'
export { ENGINEERING_EXPERTS, getEngineeringExpertIds } from './engineering-experts'
export { LEGAL_EXPERTS, getLegalExpertIds } from './legal-experts'

/**
 * Combined Expert Database
 *
 * This is the main export that combines all category databases.
 * Maintains backwards compatibility with the original expert-database.ts
 */
export const EXPERT_DATABASE: Record<string, ExpertProfile> = {
  ...SAAS_EXPERTS,
  ...VENTURE_CAPITAL_EXPERTS,
  ...GENERAL_EXPERTS,
  ...VIDA_PERSONAL_EXPERTS,
  ...HISTORICOS_EXPERTS,
  ...DESIGN_UX_EXPERTS,
  ...ENGINEERING_EXPERTS,
  ...LEGAL_EXPERTS,
}

/**
 * Get an expert by ID
 */
export function getExpert(expertId: string): ExpertProfile | undefined {
  return EXPERT_DATABASE[expertId]
}

/**
 * Get all experts
 * @param companyOnly - If true, only return experts from business/company categories (SaaS, VC, General)
 */
export function getAllExperts(companyOnly: boolean = false): ExpertProfile[] {
  if (!companyOnly) {
    return Object.values(EXPERT_DATABASE)
  }
  
  // Filter to only company/business experts (exclude vida-personal and historicos)
  const companyExpertIds = new Set([
    ...getSaasExpertIds(),
    ...getVentureCapitalExpertIds(),
    ...getGeneralExpertIds(),
    ...getDesignUxExpertIds(),
    ...getEngineeringExpertIds(),
    ...getLegalExpertIds(),
  ])
  
  return Object.values(EXPERT_DATABASE).filter((expert) =>
    companyExpertIds.has(expert.id)
  )
}

/**
 * Search experts by expertise area
 */
export function getExpertsByExpertise(expertise: string): ExpertProfile[] {
  return getAllExperts().filter((expert) =>
    expert.expertise.some((e) => e.toLowerCase().includes(expertise.toLowerCase()))
  )
}

/**
 * Search experts by topic
 */
export function getExpertsByTopic(topic: string): ExpertProfile[] {
  return getAllExperts().filter((expert) =>
    expert.topics.some((t) => t.toLowerCase().includes(topic.toLowerCase()))
  )
}

/**
 * Get experts by IDs
 */
export function getExpertsByIds(expertIds: string[]): ExpertProfile[] {
  return expertIds
    .map((id) => EXPERT_DATABASE[id])
    .filter((expert): expert is ExpertProfile => expert !== undefined)
}

/**
 * Get all expert IDs grouped by category
 */
export function getExpertIdsByCategory(): Record<string, string[]> {
  return {
    saas: getSaasExpertIds(),
    ventureCapital: getVentureCapitalExpertIds(),
    general: getGeneralExpertIds(),
    vidaPersonal: getVidaPersonalExpertIds(),
    historicos: getHistoricosExpertIds(),
    designUx: getDesignUxExpertIds(),
    engineering: getEngineeringExpertIds(),
    legal: getLegalExpertIds(),
  }
}

/**
 * Get total number of experts
 */
export function getExpertCount(): number {
  return Object.keys(EXPERT_DATABASE).length
}

/**
 * Category labels for UI
 */
export const EXPERT_CATEGORY_LABELS: Record<string, string> = {
  saas: 'SaaS & Startups',
  ventureCapital: 'Venture Capital & Investment',
  general: 'General Purpose',
  vidaPersonal: 'Vida Personal',
  historicos: 'Figuras Históricas',
  designUx: 'Design & UX',
  engineering: 'Engineering & Tech Leadership',
  legal: 'Legal & Compliance',
}
