/**
 * Expert Database Types
 *
 * Shared types for expert profiles used across the expert database.
 */

/**
 * AI Provider types supported by experts
 */
export type ExpertProvider = 'openai' | 'anthropic' | 'deepseek' | 'google' | 'groq'

/**
 * Expert Profile
 *
 * Defines the structure for expert profiles in the database.
 * Each expert has a unique perspective and expertise area.
 */
export interface ExpertProfile {
  /** ID único del experto */
  id: string
  /** Nombre del experto */
  name: string
  /** Título/posición */
  title: string
  /** Rol del experto (alias para title) */
  role?: string
  /** Áreas de expertise */
  expertise: string[]
  /** Temáticas específicas */
  topics: string[]
  /** Perspectiva única del experto */
  perspective: string
  /** Prompt del sistema para este experto */
  systemPrompt: string
  /** Temperatura recomendada (0-1) */
  temperature: number
  /** Provider recomendado */
  provider: ExpertProvider
  /** Modelo recomendado */
  modelId: string
}

/**
 * Expert database record type
 */
export type ExpertDatabase = Record<string, ExpertProfile>
