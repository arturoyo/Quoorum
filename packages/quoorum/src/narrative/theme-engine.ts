/**
 * Theme Engine - Dynamic Narrative Identity Assignment
 *
 * Analyzes debate context to select appropriate narrative theme.
 * Ensures ANONIMIZATION: users never see model names (GPT, Claude), only character names.
 * Admins see: "Character Name (Model ID)" for full transparency.
 */

import type { AgentRole, AIProviderType } from '../types'
import { AVAILABLE_THEMES, getCharacterByRole, type NarrativeCharacter, type NarrativeTheme } from './themes'

// ============================================================================
// TYPES
// ============================================================================

export interface ThemeSelection {
  themeId: string
  theme: NarrativeTheme
  reason: string // Why this theme was selected
  confidence: number // 0-1
}

export interface AssignedIdentity {
  // Technical (internal)
  role: AgentRole
  provider: AIProviderType
  modelId: string

  // Narrative (user-facing)
  characterId: string
  characterName: string
  characterEmoji: string
  characterColor: string

  // Admin transparency
  displayNameAdmin: string // "Atenea (Claude 3.5 Sonnet)"
  displayNameUser: string // "Atenea"
}

// ============================================================================
// THEME SELECTION ENGINE
// ============================================================================

/**
 * Analyze debate question to select most appropriate narrative theme
 */
export function selectTheme(question: string, context?: string): ThemeSelection {
  const lowerQuestion = question.toLowerCase()
  const lowerContext = context?.toLowerCase() ?? ''
  const combined = `${lowerQuestion} ${lowerContext}`

  // Greek Mythology: Strategy, business decisions, philosophical questions
  const greekKeywords = [
    'estrategia', 'strategy', 'decisión', 'decision',
    'negocio', 'business', 'startup', 'saas',
    'pricing', 'producto', 'product',
    'crecimiento', 'growth', 'escalar', 'scale',
    'marketing', 'ventas', 'sales',
    'competencia', 'competidor', 'market',
    'inversión', 'investment', 'financiación',
  ]

  // Arthurian Legend: Leadership, team decisions, honor-based choices
  const arthurianKeywords = [
    'equipo', 'team', 'liderazgo', 'leadership',
    'cultura', 'culture', 'valores', 'values',
    'misión', 'mission', 'visión', 'vision',
    'contratar', 'hiring', 'despedir', 'firing',
    'conflicto', 'conflict', 'ética', 'ethics',
  ]

  // Tech Founders: Technical decisions, architecture, implementation
  const techKeywords = [
    'tecnología', 'technology', 'arquitectura', 'architecture',
    'implementar', 'implement', 'código', 'code',
    'framework', 'librería', 'library',
    'database', 'api', 'backend', 'frontend',
    'escalabilidad', 'scalability', 'performance',
    'seguridad', 'security', 'infraestructura',
  ]

  // Philosophy Schools: Ethical dilemmas, abstract reasoning
  const philosophyKeywords = [
    'ético', 'ethical', 'moral', 'morality',
    'filosofía', 'philosophy', 'principio', 'principle',
    'correcto', 'right', 'incorrecto', 'wrong',
    'deber', 'duty', 'responsabilidad', 'responsibility',
    'justicia', 'justice', 'libertad', 'freedom',
  ]

  // Score each theme
  const scores = {
    'greek-mythology': countKeywords(combined, greekKeywords),
    'arthurian-legend': countKeywords(combined, arthurianKeywords),
    'tech-founders': countKeywords(combined, techKeywords),
    'philosophy-schools': countKeywords(combined, philosophyKeywords),
  }

  // Get highest score
  const entries = Object.entries(scores)
  const [bestThemeId, bestScore] = entries.reduce((max, current) =>
    current[1] > max[1] ? current : max
  )

  // If no keywords matched, default to Greek Mythology (most versatile)
  const themeId = bestScore === 0 ? 'greek-mythology' : bestThemeId
  const theme = AVAILABLE_THEMES[themeId] ?? AVAILABLE_THEMES['greek-mythology']!

  return {
    themeId,
    theme,
    reason: getThemeReason(themeId, bestScore),
    confidence: Math.min(bestScore / 3, 1), // Normalize to 0-1
  }
}

function countKeywords(text: string, keywords: string[]): number {
  return keywords.filter((keyword) => text.includes(keyword)).length
}

function getThemeReason(themeId: string, score: number): string {
  if (score === 0) {
    return 'Default theme (versatile for any strategic decision)'
  }

  const reasons: Record<string, string> = {
    'greek-mythology': 'Strategic business decision detected',
    'arthurian-legend': 'Leadership and team dynamics detected',
    'tech-founders': 'Technical implementation decision detected',
    'philosophy-schools': 'Ethical or philosophical question detected',
  }

  return reasons[themeId] ?? 'Theme matched debate context'
}

// ============================================================================
// IDENTITY ASSIGNMENT
// ============================================================================

/**
 * Assign narrative identity to an agent
 * Maps technical role + AI model → Character persona
 */
export function assignIdentity(
  role: AgentRole,
  provider: AIProviderType,
  modelId: string,
  themeId: string
): AssignedIdentity {
  const character = getCharacterByRole(themeId, role)

  if (!character) {
    // Fallback to generic technical names if theme not found
    return createFallbackIdentity(role, provider, modelId)
  }

  // Format model name for admin display
  const modelDisplayName = formatModelName(modelId)

  return {
    // Technical
    role,
    provider,
    modelId,

    // Narrative
    characterId: character.id,
    characterName: character.name,
    characterEmoji: character.emoji,
    characterColor: character.color,

    // Admin transparency: "Atenea (Claude 3.5 Sonnet)"
    displayNameAdmin: `${character.name} (${modelDisplayName})`,

    // User anonymization: "Atenea" (NO model name)
    displayNameUser: character.name,
  }
}

/**
 * Create fallback identity when theme not available
 * Still maintains anonymization (no model names to users)
 */
function createFallbackIdentity(
  role: AgentRole,
  provider: AIProviderType,
  modelId: string
): AssignedIdentity {
  const roleNames: Record<AgentRole, { name: string; emoji: string; color: string }> = {
    optimizer: { name: 'Oportunista', emoji: '⚡', color: '#10B981' },
    critic: { name: 'Escéptico', emoji: '⚔️', color: '#DC2626' },
    analyst: { name: 'Analista', emoji: '📊', color: '#F59E0B' },
    synthesizer: { name: 'Estratega', emoji: '🎯', color: '#4F46E5' },
  }

  const roleConfig = roleNames[role]
  const modelDisplayName = formatModelName(modelId)

  return {
    role,
    provider,
    modelId,
    characterId: role,
    characterName: roleConfig.name,
    characterEmoji: roleConfig.emoji,
    characterColor: roleConfig.color,
    displayNameAdmin: `${roleConfig.name} (${modelDisplayName})`,
    displayNameUser: roleConfig.name,
  }
}

/**
 * Format technical model ID to human-readable name
 * Used only for admin transparency
 */
function formatModelName(modelId: string): string {
  const mappings: Record<string, string> = {
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
    'claude-sonnet-4-20250514': 'Claude Sonnet 4',
    'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
    'gemini-2.0-flash-exp': 'Gemini 2.0 Flash',
    'gemini-1.5-pro': 'Gemini 1.5 Pro',
    'gemini-1.5-flash': 'Gemini 1.5 Flash',
    'deepseek-chat': 'DeepSeek Chat',
    'llama3-70b-8192': 'Llama 3 70B',
    'llama-3.3-70b-versatile': 'Llama 3.3 70B',
  }

  return mappings[modelId] ?? modelId
}

// ============================================================================
// BATCH IDENTITY ASSIGNMENT
// ============================================================================

/**
 * Assign identities to all debate agents at once
 * Ensures consistent theme across all participants
 */
export function assignDebateIdentities(
  agentConfigs: Array<{ role: AgentRole; provider: AIProviderType; modelId: string }>,
  question: string,
  context?: string
): {
  themeSelection: ThemeSelection
  identities: AssignedIdentity[]
} {
  // Select theme based on question
  const themeSelection = selectTheme(question, context)

  // Assign identity to each agent
  const identities = agentConfigs.map((config) =>
    assignIdentity(config.role, config.provider, config.modelId, themeSelection.themeId)
  )

  return {
    themeSelection,
    identities,
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { AVAILABLE_THEMES, getCharacterByRole, type NarrativeCharacter, type NarrativeTheme } from './themes'
