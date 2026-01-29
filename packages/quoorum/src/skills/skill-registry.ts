/**
 * Skill Registry
 * Resolves and applies skills to debate configurations.
 */

import { PREDEFINED_SKILLS } from './predefined-skills'
import type { PredefinedSkill } from './predefined-skills'

export interface ResolvedSkill {
  slug: string
  name: string
  systemPromptAddition: string
  suggestedExperts: string[]
  suggestedRounds: number
  outputTemplate: string
}

/**
 * Get a predefined skill by slug.
 */
export function getPredefinedSkill(slug: string): PredefinedSkill | undefined {
  return PREDEFINED_SKILLS.find((s) => s.slug === slug)
}

/**
 * List all predefined skills.
 */
export function listPredefinedSkills(): PredefinedSkill[] {
  return [...PREDEFINED_SKILLS]
}

/**
 * Resolve a skill with optional company overrides.
 */
export function resolveSkill(
  slug: string,
  overrides?: {
    customPromptOverride?: string | null
    customExpertsOverride?: string[] | null
  },
): ResolvedSkill | null {
  const skill = getPredefinedSkill(slug)
  if (!skill) return null

  return {
    slug: skill.slug,
    name: skill.name,
    systemPromptAddition: overrides?.customPromptOverride ?? skill.systemPromptTemplate,
    suggestedExperts: overrides?.customExpertsOverride ?? skill.suggestedExperts,
    suggestedRounds: skill.suggestedRounds,
    outputTemplate: skill.outputTemplate,
  }
}

/**
 * Apply a skill to a debate system prompt.
 * Prepends the skill's prompt template to the existing system prompt.
 */
export function applySkillToPrompt(
  existingPrompt: string,
  skill: ResolvedSkill,
): string {
  return `[SKILL: ${skill.name}]\n${skill.systemPromptAddition}\n\n---\n\n${existingPrompt}`
}
