/**
 * 4-Layer Prompt System
 *
 * Builds AI agent prompts with 4 layers of context:
 * Layer 1: Role & Technical Expertise (Base agent prompt)
 * Layer 2: Master Context (Company mission, vision, values)
 * Layer 3: Department Context (KPIs, processes, reports)
 * Layer 4: Personality & Style (Custom prompt modifiers)
 */

import type { AgentConfig } from './types'

// ============================================================================
// TYPES
// ============================================================================

export interface FourLayerContext {
  // Layer 1: Technical role (provided by AgentConfig.prompt)
  baseAgentPrompt: string

  // Layer 2: Master context
  companyContext?: string // "Misión: ..., Visión: ..., Valores: ..."

  // Layer 3: Department context
  departmentContext?: string // "KPIs: ..., Procesos: ..., Informes: ..."

  // Layer 4: Personality & style
  customPrompt?: string // User customization of how the agent speaks/thinks
}

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

/**
 * Build a 4-layer system prompt for an agent
 *
 * @param agent - The base agent configuration (Layer 1)
 * @param context - Layers 2-4 (company, department, custom)
 * @returns Complete system prompt with all layers
 */
export function buildFourLayerPrompt(
  agent: AgentConfig,
  context?: {
    companyContext?: string
    departmentContext?: string
    customPrompt?: string
  }
): string {
  const layers: string[] = []

  // ============================================================================
  // LAYER 1: TECHNICAL ROLE & EXPERTISE
  // ============================================================================
  layers.push(`=== TU ROL TÉCNICO ===`)
  layers.push(`${agent.name} (${agent.role})`)
  layers.push(agent.prompt)

  // ============================================================================
  // LAYER 2: MASTER CONTEXT (Company-wide)
  // ============================================================================
  if (context?.companyContext) {
    layers.push(`\n=== CONTEXTO EMPRESARIAL (Misión, Visión, Valores) ===`)
    layers.push(context.companyContext)
  }

  // ============================================================================
  // LAYER 3: DEPARTMENT CONTEXT (Team-specific)
  // ============================================================================
  if (context?.departmentContext) {
    layers.push(`\n=== CONTEXTO DEPARTAMENTAL (KPIs, Procesos, Objetivos) ===`)
    layers.push(context.departmentContext)
  }

  // ============================================================================
  // LAYER 4: PERSONALITY & STYLE (Custom modifiers)
  // ============================================================================
  if (context?.customPrompt) {
    layers.push(`\n=== PERSONALIDAD Y ESTILO ===`)
    layers.push(context.customPrompt)
  }

  // Final instructions
  layers.push(`\n=== INSTRUCCIONES ===`)
  layers.push(`- Responde desde tu rol técnico (Layer 1)`)
  layers.push(`- Alinea tus respuestas con el contexto empresarial (Layer 2)`)
  layers.push(`- Considera los KPIs y procesos del departamento (Layer 3)`)
  layers.push(`- Mantén el estilo de comunicación especificado (Layer 4)`)
  layers.push(`- Sé conciso pero completo (1-3 oraciones máximo)`)

  return layers.join('\n')
}

/**
 * Build context prompt with corporate intelligence
 *
 * This includes company-wide and department-specific context before
 * the regular user-provided context sources.
 */
export function buildContextPromptWithCorporate(
  question: string,
  regularContext: Array<{ type: string; content: string }>,
  corporateContext?: {
    companyContext?: string
    departmentContexts?: Array<{
      departmentName: string
      departmentContext: string
      customPrompt?: string
    }>
  }
): string {
  const parts: string[] = [`PREGUNTA: ${question}`]

  // ============================================================================
  // LAYER 2: COMPANY CONTEXT (Master - Mission, Vision, Values)
  // ============================================================================
  if (corporateContext?.companyContext) {
    parts.push(`\n[CONTEXTO EMPRESARIAL]`)
    parts.push(corporateContext.companyContext)
  }

  // ============================================================================
  // LAYER 3: DEPARTMENT CONTEXTS (Specific - KPIs, Processes, Reports)
  // ============================================================================
  if (corporateContext?.departmentContexts && corporateContext.departmentContexts.length > 0) {
    parts.push('\n[CONTEXTOS DEPARTAMENTALES]')
    for (const dept of corporateContext.departmentContexts) {
      parts.push(`\n${dept.departmentName}:`)
      parts.push(dept.departmentContext)

      // Layer 4: Custom prompt (if exists) is shown here as context
      if (dept.customPrompt) {
        parts.push(`Estilo: ${dept.customPrompt}`)
      }
    }
  }

  // ============================================================================
  // REGULAR CONTEXT SOURCES (User-provided files, URLs, etc.)
  // ============================================================================
  for (const source of regularContext) {
    parts.push(`\n[${source.type.toUpperCase()}]`)
    parts.push(source.content)
  }

  return parts.join('\n')
}

/**
 * Extract department-specific context for a single agent
 *
 * If multiple departments are selected, this combines all their contexts.
 * Useful when building per-agent prompts.
 */
export function extractDepartmentContext(
  departmentContexts?: Array<{
    departmentName: string
    departmentContext: string
    customPrompt?: string
  }>
): {
  departmentContext?: string
  customPrompt?: string
} {
  if (!departmentContexts || departmentContexts.length === 0) {
    return {}
  }

  // Combine all department contexts
  const contextParts = departmentContexts.map((dept) => {
    return `[${dept.departmentName}]\n${dept.departmentContext}`
  })

  // Combine all custom prompts (if multiple departments have style guides)
  const customPrompts = departmentContexts
    .filter((dept) => dept.customPrompt)
    .map((dept) => dept.customPrompt)

  return {
    departmentContext: contextParts.join('\n\n'),
    customPrompt: customPrompts.length > 0 ? customPrompts.join('\n') : undefined,
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get total estimated tokens for a 4-layer prompt
 * Useful for cost estimation
 */
export function estimateFourLayerTokens(
  agent: AgentConfig,
  context?: {
    companyContext?: string
    departmentContext?: string
    customPrompt?: string
  }
): number {
  const prompt = buildFourLayerPrompt(agent, context)
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(prompt.length / 4)
}
