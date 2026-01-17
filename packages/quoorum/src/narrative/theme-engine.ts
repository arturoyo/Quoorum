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

// ============================================================================
// CONFIDENCE THRESHOLD
// ============================================================================

/**
 * Minimum confidence score to use themed identities
 * Below this threshold, generic neutral names are used
 */
const THEME_CONFIDENCE_THRESHOLD = 0.4 // 40% confidence minimum

/**
 * Analyze debate question to select most appropriate narrative theme
 * Returns 'generic' theme if confidence is below threshold
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

  // Calculate confidence (normalize to 0-1)
  const confidence = Math.min(bestScore / 3, 1)

  // If confidence is below threshold, try to detect domain-specific theme
  if (confidence < THEME_CONFIDENCE_THRESHOLD || bestScore === 0) {
    const domainTheme = detectDomainTheme(combined)

    if (domainTheme) {
      return {
        themeId: domainTheme.id,
        theme: domainTheme,
        reason: `Domain-specific theme detected: ${domainTheme.name}`,
        confidence: 0.3, // Low confidence but better than fully generic
      }
    }

    // No domain detected, use fully generic neutral theme
    return {
      themeId: 'generic',
      theme: createGenericTheme(),
      reason: 'No clear theme detected - using neutral identities',
      confidence: 0,
    }
  }

  // Use themed identities with high confidence
  const theme = AVAILABLE_THEMES[bestThemeId]
  if (!theme) {
    return {
      themeId: 'generic',
      theme: createGenericTheme(),
      reason: 'Theme not found - using neutral identities',
      confidence: 0,
    }
  }

  return {
    themeId: bestThemeId,
    theme,
    reason: getThemeReason(bestThemeId, bestScore),
    confidence,
  }
}

/**
 * Detect domain-specific theme from question content
 * Returns themed identities relevant to the domain (education, finance, health, etc.)
 */
function detectDomainTheme(text: string): NarrativeTheme | null {
  // Education domain
  if (
    text.includes('educación') ||
    text.includes('education') ||
    text.includes('estudiante') ||
    text.includes('student') ||
    text.includes('profesor') ||
    text.includes('teacher') ||
    text.includes('universidad') ||
    text.includes('university') ||
    text.includes('escuela') ||
    text.includes('school')
  ) {
    return createEducationTheme()
  }

  // Finance domain
  if (
    text.includes('finanzas') ||
    text.includes('finance') ||
    text.includes('economía') ||
    text.includes('economy') ||
    text.includes('inversión') ||
    text.includes('investment') ||
    text.includes('banco') ||
    text.includes('bank') ||
    text.includes('mercado') ||
    text.includes('market')
  ) {
    return createFinanceTheme()
  }

  // Health/Medicine domain
  if (
    text.includes('salud') ||
    text.includes('health') ||
    text.includes('medicina') ||
    text.includes('medicine') ||
    text.includes('médico') ||
    text.includes('doctor') ||
    text.includes('paciente') ||
    text.includes('patient') ||
    text.includes('hospital')
  ) {
    return createHealthTheme()
  }

  // Law domain
  if (
    text.includes('legal') ||
    text.includes('ley') ||
    text.includes('law') ||
    text.includes('derecho') ||
    text.includes('abogado') ||
    text.includes('lawyer') ||
    text.includes('contrato') ||
    text.includes('contract')
  ) {
    return createLawTheme()
  }

  // Science domain
  if (
    text.includes('ciencia') ||
    text.includes('science') ||
    text.includes('investigación') ||
    text.includes('research') ||
    text.includes('experimento') ||
    text.includes('experiment') ||
    text.includes('hipótesis') ||
    text.includes('hypothesis')
  ) {
    return createScienceTheme()
  }

  return null
}

/**
 * Education domain theme - Famous educators and pedagogues
 */
function createEducationTheme(): NarrativeTheme {
  return {
    id: 'education',
    name: 'Educación',
    description: 'Perspectivas de pedagogos y educadores influyentes',
    characters: {
      'montessori': {
        id: 'montessori',
        name: 'Montessori',
        role: 'optimizer',
        title: 'Método Experimental',
        emoji: '📚',
        color: '#10B981',
        personality: 'Innovadora, centrada en el aprendizaje experiencial',
        systemPrompt:
          'Analiza desde la perspectiva del aprendizaje práctico y el desarrollo autónomo.',
      },
      'dewey': {
        id: 'dewey',
        name: 'Dewey',
        role: 'critic',
        title: 'Reflexión Crítica',
        emoji: '🤔',
        color: '#DC2626',
        personality: 'Crítico, enfocado en la reflexión y el pragmatismo',
        systemPrompt: 'Analiza críticamente desde el pragmatismo educativo y la experiencia reflexiva.',
      },
      'piaget': {
        id: 'piaget',
        name: 'Piaget',
        role: 'analyst',
        title: 'Desarrollo Cognitivo',
        emoji: '🧠',
        color: '#F59E0B',
        personality: 'Analítico, basado en el desarrollo cognitivo',
        systemPrompt: 'Analiza desde las etapas del desarrollo cognitivo y el constructivismo.',
      },
      'freire': {
        id: 'freire',
        name: 'Freire',
        role: 'synthesizer',
        title: 'Pedagogía Crítica',
        emoji: '✊',
        color: '#4F46E5',
        personality: 'Transformador, enfocado en la educación liberadora',
        systemPrompt: 'Sintetiza desde la pedagogía crítica y la concienciación.',
      },
    },
  }
}

/**
 * Finance domain theme - Famous economists
 */
function createFinanceTheme(): NarrativeTheme {
  return {
    id: 'finance',
    name: 'Finanzas',
    description: 'Perspectivas de economistas influyentes',
    characters: {
      'keynes': {
        id: 'keynes',
        name: 'Keynes',
        role: 'optimizer',
        title: 'Intervención Estratégica',
        emoji: '💰',
        color: '#10B981',
        personality: 'Proactivo, enfocado en la intervención estatal',
        systemPrompt: 'Analiza desde la economía keynesiana y la demanda agregada.',
      },
      'hayek': {
        id: 'hayek',
        name: 'Hayek',
        role: 'critic',
        title: 'Orden Espontáneo',
        emoji: '⚖️',
        color: '#DC2626',
        personality: 'Escéptico de la planificación central, libertario',
        systemPrompt: 'Analiza críticamente desde el liberalismo económico y el orden espontáneo.',
      },
      'fisher': {
        id: 'fisher',
        name: 'Fisher',
        role: 'analyst',
        title: 'Teoría Cuantitativa',
        emoji: '📊',
        color: '#F59E0B',
        personality: 'Cuantitativo, enfocado en datos monetarios',
        systemPrompt: 'Analiza desde la teoría cuantitativa del dinero y el análisis estadístico.',
      },
      'smith': {
        id: 'smith',
        name: 'Smith',
        role: 'synthesizer',
        title: 'Mano Invisible',
        emoji: '🤝',
        color: '#4F46E5',
        personality: 'Equilibrado, enfocado en el mercado libre',
        systemPrompt: 'Sintetiza desde la economía clásica y el libre mercado.',
      },
    },
  }
}

/**
 * Health domain theme - Famous medical researchers
 */
function createHealthTheme(): NarrativeTheme {
  return {
    id: 'health',
    name: 'Salud',
    description: 'Perspectivas de investigadores médicos',
    characters: {
      'pasteur': {
        id: 'pasteur',
        name: 'Pasteur',
        role: 'optimizer',
        title: 'Investigación Preventiva',
        emoji: '🔬',
        color: '#10B981',
        personality: 'Innovador, enfocado en la prevención',
        systemPrompt: 'Analiza desde la microbiología y la medicina preventiva.',
      },
      'koch': {
        id: 'koch',
        name: 'Koch',
        role: 'critic',
        title: 'Rigor Científico',
        emoji: '🦠',
        color: '#DC2626',
        personality: 'Riguroso, enfocado en la evidencia',
        systemPrompt: 'Analiza críticamente con los postulados científicos rigurosos.',
      },
      'hippocrates': {
        id: 'hippocrates',
        name: 'Hipócrates',
        role: 'analyst',
        title: 'Observación Clínica',
        emoji: '⚕️',
        color: '#F59E0B',
        personality: 'Observador, basado en el método clínico',
        systemPrompt: 'Analiza desde la observación clínica sistemática.',
      },
      'nightingale': {
        id: 'nightingale',
        name: 'Nightingale',
        role: 'synthesizer',
        title: 'Cuidado Holístico',
        emoji: '🏥',
        color: '#4F46E5',
        personality: 'Holística, enfocada en el cuidado integral',
        systemPrompt: 'Sintetiza desde el cuidado integral y la estadística sanitaria.',
      },
    },
  }
}

/**
 * Law domain theme - Famous legal scholars
 */
function createLawTheme(): NarrativeTheme {
  return {
    id: 'law',
    name: 'Derecho',
    description: 'Perspectivas de juristas influyentes',
    characters: {
      'holmes': {
        id: 'holmes',
        name: 'Holmes',
        role: 'optimizer',
        title: 'Realismo Jurídico',
        emoji: '⚖️',
        color: '#10B981',
        personality: 'Pragmático, enfocado en la aplicación práctica',
        systemPrompt: 'Analiza desde el realismo jurídico y la experiencia práctica.',
      },
      'kelsen': {
        id: 'kelsen',
        name: 'Kelsen',
        role: 'critic',
        title: 'Pureza Normativa',
        emoji: '📜',
        color: '#DC2626',
        personality: 'Formalista, enfocado en la norma pura',
        systemPrompt: 'Analiza críticamente desde la teoría pura del derecho.',
      },
      'hart': {
        id: 'hart',
        name: 'Hart',
        role: 'analyst',
        title: 'Análisis Conceptual',
        emoji: '🔍',
        color: '#F59E0B',
        personality: 'Analítico, enfocado en conceptos jurídicos',
        systemPrompt: 'Analiza desde el positivismo jurídico analítico.',
      },
      'dworkin': {
        id: 'dworkin',
        name: 'Dworkin',
        role: 'synthesizer',
        title: 'Integridad Jurídica',
        emoji: '⚖️',
        color: '#4F46E5',
        personality: 'Integrador, enfocado en principios',
        systemPrompt: 'Sintetiza desde la teoría de la integridad y los principios jurídicos.',
      },
    },
  }
}

/**
 * Science domain theme - Famous scientists
 */
function createScienceTheme(): NarrativeTheme {
  return {
    id: 'science',
    name: 'Ciencia',
    description: 'Perspectivas de científicos influyentes',
    characters: {
      'galileo': {
        id: 'galileo',
        name: 'Galileo',
        role: 'optimizer',
        title: 'Experimentación',
        emoji: '🔭',
        color: '#10B981',
        personality: 'Experimental, enfocado en la observación',
        systemPrompt: 'Analiza desde el método experimental y la observación directa.',
      },
      'popper': {
        id: 'popper',
        name: 'Popper',
        role: 'critic',
        title: 'Falsabilidad',
        emoji: '❌',
        color: '#DC2626',
        personality: 'Crítico, enfocado en la falsación',
        systemPrompt: 'Analiza críticamente desde el falsacionismo y la refutación.',
      },
      'curie': {
        id: 'curie',
        name: 'Curie',
        role: 'analyst',
        title: 'Investigación Rigurosa',
        emoji: '☢️',
        color: '#F59E0B',
        personality: 'Rigurosa, basada en datos empíricos',
        systemPrompt: 'Analiza desde la investigación empírica metódica.',
      },
      'einstein': {
        id: 'einstein',
        name: 'Einstein',
        role: 'synthesizer',
        title: 'Pensamiento Teórico',
        emoji: '🌌',
        color: '#4F46E5',
        personality: 'Visionario, enfocado en la síntesis teórica',
        systemPrompt: 'Sintetiza desde el pensamiento teórico y la relatividad conceptual.',
      },
    },
  }
}

/**
 * Create generic theme with neutral, anonymous identities
 * Used when no clear theme is detected
 */
function createGenericTheme(): NarrativeTheme {
  return {
    id: 'generic',
    name: 'Genérico',
    description: 'Identidades neutrales y anónimas',
    characters: {
      // Optimizer → Perspective A
      'perspective-a': {
        id: 'perspective-a',
        name: 'Perspectiva A',
        role: 'optimizer',
        title: 'Análisis Optimista',
        emoji: '🔵',
        color: '#3B82F6', // Blue
        personality: 'Neutral, objetivo, enfocado en oportunidades',
        systemPrompt: 'Analiza las oportunidades y beneficios potenciales de cada opción.',
      },
      // Critic → Perspective B
      'perspective-b': {
        id: 'perspective-b',
        name: 'Perspectiva B',
        role: 'critic',
        title: 'Análisis Crítico',
        emoji: '🔴',
        color: '#EF4444', // Red
        personality: 'Neutral, objetivo, enfocado en riesgos',
        systemPrompt: 'Analiza los riesgos y desafíos potenciales de cada opción.',
      },
      // Analyst → Perspective C
      'perspective-c': {
        id: 'perspective-c',
        name: 'Perspectiva C',
        role: 'analyst',
        title: 'Análisis Cuantitativo',
        emoji: '🟡',
        color: '#F59E0B', // Amber
        personality: 'Neutral, objetivo, enfocado en datos',
        systemPrompt: 'Analiza los datos y métricas objetivas de cada opción.',
      },
      // Synthesizer → Perspective D
      'perspective-d': {
        id: 'perspective-d',
        name: 'Perspectiva D',
        role: 'synthesizer',
        title: 'Síntesis Final',
        emoji: '🟢',
        color: '#10B981', // Green
        personality: 'Neutral, objetivo, enfocado en síntesis',
        systemPrompt: 'Sintetiza las perspectivas anteriores en una conclusión equilibrada.',
      },
    },
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
  // Format model name for admin display
  const modelDisplayName = formatModelName(modelId)

  // If generic theme, use generic neutral identities
  if (themeId === 'generic') {
    const genericTheme = createGenericTheme()
    const character = Object.values(genericTheme.characters).find((char) => char.role === role)

    if (!character) {
      // Final fallback - shouldn't happen but defensive coding
      return createFallbackIdentity(role, provider, modelId)
    }

    return {
      role,
      provider,
      modelId,
      characterId: character.id,
      characterName: character.name,
      characterEmoji: character.emoji,
      characterColor: character.color,
      displayNameAdmin: `${character.name} (${modelDisplayName})`,
      displayNameUser: character.name,
    }
  }

  // Use themed character
  const character = getCharacterByRole(themeId, role)

  if (!character) {
    // Fallback to generic if themed character not found
    return assignIdentity(role, provider, modelId, 'generic')
  }

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
