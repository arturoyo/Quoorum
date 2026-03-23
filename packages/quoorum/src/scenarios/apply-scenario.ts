/**
 * Apply Scenario Configuration
 *
 * Takes a scenario configuration and user input, and returns a fully
 * configured debate setup ready to be passed to runDynamicDebate()
 */

import type { ScenarioConfig, ScenarioVariableValues, AppliedScenario } from './types'
import type { RunDebateOptions } from '../runner-dynamic'
import type { ContextSourceType } from '../types'
import { getExpert } from '../expert-database'

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Apply a scenario configuration to create a debate setup
 */
export function applyScenario(
  scenario: ScenarioConfig,
  variableValues: ScenarioVariableValues
): AppliedScenario {
  // Validate required variables
  if (!variableValues.user_input) {
    throw new Error('user_input is required for scenario application')
  }

  // Replace variables in master prompt template
  const masterPrompt = replacePromptVariables(
    scenario.masterPromptTemplate,
    variableValues,
    scenario.promptVariables
  )

  // Validate expert IDs exist
  const validatedExpertIds = validateExpertIds(scenario.expertIds)

  // Build applied scenario
  const applied: AppliedScenario = {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    selectedExpertIds: validatedExpertIds,
    selectedDepartmentIds: scenario.requiresDepartments ? scenario.departmentIds : undefined,
    frameworkId: scenario.frameworkId,
    masterPrompt,
    agentBehaviorOverrides: scenario.agentBehaviorOverrides,
    tokenOptimization: scenario.tokenOptimization,
    successMetrics: scenario.successMetrics,
    generateCertificate: scenario.generateCertificate,
    certificateTemplate: scenario.certificateTemplate,
  }

  return applied
}

/**
 * Convert AppliedScenario to RunDebateOptions
 */
export function appliedScenarioToRunOptions(
  applied: AppliedScenario,
  sessionId: string,
  context: { sources: Array<{ type: ContextSourceType; content: string }>; combinedContext: string },
  corporateContext?: {
    companyContext?: string
    departmentContexts?: Array<{
      departmentName: string
      departmentContext: string
      customPrompt?: string
    }>
  }
): Partial<RunDebateOptions> {
  return {
    sessionId,
    // Use a clean, user-friendly title for the debate; the detailed masterPrompt lives in context/prompt
    question: applied.scenarioName,
    context,
    corporateContext,
    selectedExpertIds: applied.selectedExpertIds,
    selectedDepartmentIds: applied.selectedDepartmentIds,
    // Note: frameworkId would need to be handled in the runner if supported
    // For now, we rely on the master prompt to guide the framework
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Replace variables in prompt template
 */
function replacePromptVariables(
  template: string,
  values: ScenarioVariableValues,
  variableDefs: Record<string, { label: string; description: string; defaultValue?: string; required: boolean }>
): string {
  let result = template

  // Step 1: Handle {{#if var}}...{{/if}} blocks (simple conditional)
  // Remove entire block if variable is empty/undefined
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g
  result = result.replace(conditionalRegex, (match, varName, content) => {
    const value = values[varName]
    if (value && value.trim()) {
      // Variable has value, keep content and replace variables inside
      return content
    } else {
      // Variable is empty, remove entire block
      return ''
    }
  })

  // Step 2: Replace all remaining variables in format {{variable_name}}
  const variableRegex = /\{\{(\w+)\}\}/g
  const matches = Array.from(result.matchAll(variableRegex))

  for (const match of matches) {
    const varName = match[1]
    const varDef = variableDefs[varName]

    // Get value from provided values or use default
    let value = values[varName]

    if (!value && varDef?.defaultValue) {
      value = varDef.defaultValue
    }

    if (!value && varDef?.required) {
      throw new Error(`Required variable '${varName}' (${varDef.label}) is missing`)
    }

    if (!value) {
      // For optional variables, replace with empty string
      value = ''
    }

    // Replace ALL occurrences of this variable
    result = result.replaceAll(match[0], value)
  }

  // Step 3: Clean up multiple consecutive newlines (from removed conditionals)
  result = result.replace(/\n{3,}/g, '\n\n')

  return result.trim()
}

/**
 * Validate that expert IDs exist in the expert database
 */
function validateExpertIds(expertIds: string[]): string[] {
  const validIds: string[] = []

  for (const expertId of expertIds) {
    const expert = getExpert(expertId)
    if (expert) {
      validIds.push(expertId)
    } else {
      console.warn(`[Scenario] Expert ID '${expertId}' not found in expert database, skipping`)
    }
  }

  if (validIds.length === 0) {
    throw new Error('No valid expert IDs found in scenario configuration')
  }

  return validIds
}
