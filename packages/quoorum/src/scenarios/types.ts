/**
 * Scenario Types
 *
 * TypeScript types for Decision Playbooks (Escenarios de Oro)
 */

import { z } from 'zod'

// ============================================================================
// SCENARIO CONFIGURATION
// ============================================================================

export const scenarioSegmentSchema = z.enum(['entrepreneur', 'sme', 'corporate'])

export const promptVariableSchema = z.object({
  label: z.string(),
  description: z.string(),
  defaultValue: z.string().optional(),
  required: z.boolean().default(false),
})

export const successMetricSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
  type: z.enum(['number', 'boolean', 'string', 'array']),
  extractor: z.string().optional(), // AI prompt to extract this metric
})

export const agentBehaviorOverrideSchema = z.object({
  role: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  specialInstructions: z.string().optional(),
})

export const tokenOptimizationSchema = z.object({
  enabled: z.boolean().default(true),
  maxTokensPerMessage: z.number().positive().optional(),
  compressionEnabled: z.boolean().optional(),
})

export const scenarioConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  shortDescription: z.string().max(500).optional(),
  segment: scenarioSegmentSchema,
  status: z.enum(['draft', 'active', 'archived']).default('active'),
  
  // Expert Mix
  expertIds: z.array(z.string()).min(1, 'At least one expert required'),
  
  // Department Selection (optional)
  requiresDepartments: z.boolean().default(false),
  departmentIds: z.array(z.string()).default([]),
  
  // Framework
  frameworkId: z.string().optional(),
  
  // Master Prompt Template
  masterPromptTemplate: z.string().min(1),
  promptVariables: z.record(promptVariableSchema).default({}),
  
  // Success Metrics
  successMetrics: z.array(successMetricSchema).default([]),
  
  // Agent Behavior Overrides
  agentBehaviorOverrides: z.record(agentBehaviorOverrideSchema).default({}),
  
  // Token Optimization
  tokenOptimization: tokenOptimizationSchema.default({ enabled: true }),
  
  // Audit Trail
  generateCertificate: z.boolean().default(true),
  certificateTemplate: z.string().optional(),
  
  // Access Control
  minTier: z.string().default('free'),
  isPublic: z.boolean().default(true),
})

export type ScenarioConfig = z.infer<typeof scenarioConfigSchema>
export type ScenarioSegment = z.infer<typeof scenarioSegmentSchema>
export type PromptVariable = z.infer<typeof promptVariableSchema>
export type SuccessMetric = z.infer<typeof successMetricSchema>
export type AgentBehaviorOverride = z.infer<typeof agentBehaviorOverrideSchema>
export type TokenOptimization = z.infer<typeof tokenOptimizationSchema>

// ============================================================================
// SCENARIO APPLICATION RESULT
// ============================================================================

export interface AppliedScenario {
  scenarioId: string
  scenarioName: string
  
  // Pre-configured values
  selectedExpertIds: string[]
  selectedDepartmentIds?: string[]
  frameworkId?: string
  masterPrompt: string // Prompt with variables replaced
  agentBehaviorOverrides: Record<string, AgentBehaviorOverride>
  tokenOptimization: TokenOptimization
  
  // Success metrics to extract
  successMetrics: SuccessMetric[]
  
  // Certificate generation
  generateCertificate: boolean
  certificateTemplate?: string
}

// ============================================================================
// SCENARIO VARIABLE VALUES
// ============================================================================

export interface ScenarioVariableValues {
  user_input: string // Always required
  context?: string
  company_context?: string
  department_context?: string
  [key: string]: string | undefined // Additional custom variables
}
