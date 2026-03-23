/**
 * Tests for 4-Layer Prompt Builder
 */

import { describe, it, expect } from 'vitest'
import {
  buildFourLayerPrompt,
  buildContextPromptWithCorporate,
  extractDepartmentContext,
  estimateFourLayerTokens,
} from '../prompt-builder'
import type { AgentConfig } from '../types'

// ============================================================================
// MOCK DATA
// ============================================================================

const mockAgent: AgentConfig = {
  key: 'optimizer',
  name: 'Optimizer',
  role: 'optimizer',
  prompt: 'You are an expert optimizer. Identify opportunities and maximize upside.',
  provider: 'google',
  model: 'gemini-2.0-flash',
  temperature: 0.7,
}

const mockCompanyContext = `
Misión: Democratizar el acceso a decisiones inteligentes con IA.
Visión: Ser la plataforma líder de debates multi-agente en español.
Valores: Excelencia, Innovación, Transparencia.
`.trim()

const mockDepartmentContext = `
KPIs: CAC < $50, LTV > $500, Churn < 5%
Procesos: Inbound Marketing + ABM para empresas
Informes: Dashboard semanal de adquisición
`.trim()

const mockCustomPrompt = 'Sé directo, orientado a métricas y usa lenguaje empresarial.'

// ============================================================================
// TESTS: buildFourLayerPrompt
// ============================================================================

describe('buildFourLayerPrompt', () => {
  it('should build prompt with only Layer 1 (technical role)', () => {
    const prompt = buildFourLayerPrompt(mockAgent)

    expect(prompt).toContain('=== TU ROL TÉCNICO ===')
    expect(prompt).toContain('Optimizer (optimizer)')
    expect(prompt).toContain('You are an expert optimizer')
    expect(prompt).toContain('=== INSTRUCCIONES ===')
  })

  it('should include Layer 2 (company context) when provided', () => {
    const prompt = buildFourLayerPrompt(mockAgent, {
      companyContext: mockCompanyContext,
    })

    expect(prompt).toContain('=== CONTEXTO EMPRESARIAL')
    expect(prompt).toContain('Democratizar el acceso')
    expect(prompt).toContain('Misión:')
    expect(prompt).toContain('Visión:')
    expect(prompt).toContain('Valores:')
  })

  it('should include Layer 3 (department context) when provided', () => {
    const prompt = buildFourLayerPrompt(mockAgent, {
      departmentContext: mockDepartmentContext,
    })

    expect(prompt).toContain('=== CONTEXTO DEPARTAMENTAL')
    expect(prompt).toContain('KPIs: CAC < $50')
    expect(prompt).toContain('Procesos: Inbound Marketing')
  })

  it('should include Layer 4 (custom prompt) when provided', () => {
    const prompt = buildFourLayerPrompt(mockAgent, {
      customPrompt: mockCustomPrompt,
    })

    expect(prompt).toContain('=== PERSONALIDAD Y ESTILO ===')
    expect(prompt).toContain('Sé directo, orientado a métricas')
  })

  it('should build complete 4-layer prompt with all layers', () => {
    const prompt = buildFourLayerPrompt(mockAgent, {
      companyContext: mockCompanyContext,
      departmentContext: mockDepartmentContext,
      customPrompt: mockCustomPrompt,
    })

    // Layer 1
    expect(prompt).toContain('=== TU ROL TÉCNICO ===')
    expect(prompt).toContain('Optimizer')

    // Layer 2
    expect(prompt).toContain('=== CONTEXTO EMPRESARIAL')
    expect(prompt).toContain('Democratizar el acceso')

    // Layer 3
    expect(prompt).toContain('=== CONTEXTO DEPARTAMENTAL')
    expect(prompt).toContain('KPIs: CAC')

    // Layer 4
    expect(prompt).toContain('=== PERSONALIDAD Y ESTILO ===')
    expect(prompt).toContain('Sé directo')

    // Instructions
    expect(prompt).toContain('=== INSTRUCCIONES ===')
    expect(prompt).toContain('Responde desde tu rol técnico (Layer 1)')
    expect(prompt).toContain('Alinea tus respuestas con el contexto empresarial (Layer 2)')
  })

  it('should maintain layer order: Role → Company → Department → Personality', () => {
    const prompt = buildFourLayerPrompt(mockAgent, {
      companyContext: mockCompanyContext,
      departmentContext: mockDepartmentContext,
      customPrompt: mockCustomPrompt,
    })

    const roleIndex = prompt.indexOf('=== TU ROL TÉCNICO ===')
    const companyIndex = prompt.indexOf('=== CONTEXTO EMPRESARIAL')
    const departmentIndex = prompt.indexOf('=== CONTEXTO DEPARTAMENTAL')
    const personalityIndex = prompt.indexOf('=== PERSONALIDAD Y ESTILO ===')

    expect(roleIndex).toBeLessThan(companyIndex)
    expect(companyIndex).toBeLessThan(departmentIndex)
    expect(departmentIndex).toBeLessThan(personalityIndex)
  })
})

// ============================================================================
// TESTS: buildContextPromptWithCorporate
// ============================================================================

describe('buildContextPromptWithCorporate', () => {
  const regularSources = [
    { type: 'file', content: 'Context from uploaded PDF document.' },
    { type: 'url', content: 'Context from website scraping.' },
  ]

  it('should build context with question only', () => {
    const context = buildContextPromptWithCorporate(
      '¿Debemos lanzar el producto ahora?',
      regularSources
    )

    expect(context).toContain('PREGUNTA: ¿Debemos lanzar el producto ahora?')
    expect(context).toContain('[FILE]')
    expect(context).toContain('Context from uploaded PDF')
    expect(context).toContain('[URL]')
  })

  it('should inject company context before regular sources', () => {
    const context = buildContextPromptWithCorporate(
      '¿Debemos lanzar el producto ahora?',
      regularSources,
      { companyContext: mockCompanyContext }
    )

    const companyIndex = context.indexOf('[CONTEXTO EMPRESARIAL]')
    const fileIndex = context.indexOf('[FILE]')

    expect(companyIndex).toBeGreaterThan(-1)
    expect(companyIndex).toBeLessThan(fileIndex)
    expect(context).toContain('Misión: Democratizar')
  })

  it('should inject department contexts before regular sources', () => {
    const context = buildContextPromptWithCorporate(
      '¿Debemos lanzar el producto ahora?',
      regularSources,
      {
        departmentContexts: [
          {
            departmentName: 'Marketing',
            departmentContext: mockDepartmentContext,
            customPrompt: mockCustomPrompt,
          },
        ],
      }
    )

    expect(context).toContain('[CONTEXTOS DEPARTAMENTALES]')
    expect(context).toContain('Marketing:')
    expect(context).toContain('KPIs: CAC < $50')
    expect(context).toContain('Estilo: Sé directo')
  })

  it('should handle multiple departments', () => {
    const context = buildContextPromptWithCorporate(
      '¿Debemos lanzar el producto ahora?',
      regularSources,
      {
        departmentContexts: [
          {
            departmentName: 'Marketing',
            departmentContext: 'KPIs: CAC < $50',
          },
          {
            departmentName: 'Producto',
            departmentContext: 'KPIs: NPS > 50, Adoption > 80%',
          },
        ],
      }
    )

    expect(context).toContain('Marketing:')
    expect(context).toContain('KPIs: CAC < $50')
    expect(context).toContain('Producto:')
    expect(context).toContain('NPS > 50')
  })

  it('should maintain order: Question → Company → Departments → Regular Sources', () => {
    const context = buildContextPromptWithCorporate(
      '¿Debemos lanzar el producto ahora?',
      regularSources,
      {
        companyContext: mockCompanyContext,
        departmentContexts: [
          {
            departmentName: 'Marketing',
            departmentContext: mockDepartmentContext,
          },
        ],
      }
    )

    const questionIndex = context.indexOf('PREGUNTA:')
    const companyIndex = context.indexOf('[CONTEXTO EMPRESARIAL]')
    const departmentIndex = context.indexOf('[CONTEXTOS DEPARTAMENTALES]')
    const fileIndex = context.indexOf('[FILE]')

    expect(questionIndex).toBeLessThan(companyIndex)
    expect(companyIndex).toBeLessThan(departmentIndex)
    expect(departmentIndex).toBeLessThan(fileIndex)
  })
})

// ============================================================================
// TESTS: extractDepartmentContext
// ============================================================================

describe('extractDepartmentContext', () => {
  it('should return empty object when no departments provided', () => {
    const result = extractDepartmentContext(undefined)

    expect(result).toEqual({})
  })

  it('should return empty object for empty array', () => {
    const result = extractDepartmentContext([])

    expect(result).toEqual({})
  })

  it('should extract single department context', () => {
    const result = extractDepartmentContext([
      {
        departmentName: 'Marketing',
        departmentContext: mockDepartmentContext,
        customPrompt: mockCustomPrompt,
      },
    ])

    expect(result.departmentContext).toContain('[Marketing]')
    expect(result.departmentContext).toContain('KPIs: CAC < $50')
    expect(result.customPrompt).toBe(mockCustomPrompt)
  })

  it('should combine multiple department contexts', () => {
    const result = extractDepartmentContext([
      {
        departmentName: 'Marketing',
        departmentContext: 'KPIs: CAC < $50',
      },
      {
        departmentName: 'Ventas',
        departmentContext: 'KPIs: Close Rate > 30%',
      },
    ])

    expect(result.departmentContext).toContain('[Marketing]')
    expect(result.departmentContext).toContain('CAC < $50')
    expect(result.departmentContext).toContain('[Ventas]')
    expect(result.departmentContext).toContain('Close Rate > 30%')
  })

  it('should combine multiple custom prompts', () => {
    const result = extractDepartmentContext([
      {
        departmentName: 'Marketing',
        departmentContext: 'KPIs',
        customPrompt: 'Sé directo.',
      },
      {
        departmentName: 'Ventas',
        departmentContext: 'KPIs',
        customPrompt: 'Usa terminología B2B.',
      },
    ])

    expect(result.customPrompt).toContain('Sé directo.')
    expect(result.customPrompt).toContain('Usa terminología B2B.')
  })

  it('should handle departments without custom prompts', () => {
    const result = extractDepartmentContext([
      {
        departmentName: 'Marketing',
        departmentContext: 'KPIs: CAC < $50',
      },
      {
        departmentName: 'Ventas',
        departmentContext: 'KPIs: Close Rate > 30%',
        customPrompt: 'Usa terminología B2B.',
      },
    ])

    expect(result.departmentContext).toBeDefined()
    expect(result.customPrompt).toBe('Usa terminología B2B.')
  })
})

// ============================================================================
// TESTS: estimateFourLayerTokens
// ============================================================================

describe('estimateFourLayerTokens', () => {
  it('should estimate tokens for basic prompt (Layer 1 only)', () => {
    const tokens = estimateFourLayerTokens(mockAgent)

    expect(tokens).toBeGreaterThan(0)
    expect(tokens).toBeLessThan(500) // Basic prompt should be < 500 tokens
  })

  it('should estimate higher tokens with company context', () => {
    const tokensBasic = estimateFourLayerTokens(mockAgent)
    const tokensWithCompany = estimateFourLayerTokens(mockAgent, {
      companyContext: mockCompanyContext,
    })

    expect(tokensWithCompany).toBeGreaterThan(tokensBasic)
  })

  it('should estimate higher tokens with all layers', () => {
    const tokensBasic = estimateFourLayerTokens(mockAgent)
    const tokensFull = estimateFourLayerTokens(mockAgent, {
      companyContext: mockCompanyContext,
      departmentContext: mockDepartmentContext,
      customPrompt: mockCustomPrompt,
    })

    expect(tokensFull).toBeGreaterThan(tokensBasic)
    expect(tokensFull).toBeGreaterThan(100) // Full prompt should be substantial
  })

  it('should use rough estimate of 1 token ≈ 4 characters', () => {
    const prompt = buildFourLayerPrompt(mockAgent, {
      companyContext: mockCompanyContext,
      departmentContext: mockDepartmentContext,
      customPrompt: mockCustomPrompt,
    })

    const estimatedTokens = estimateFourLayerTokens(mockAgent, {
      companyContext: mockCompanyContext,
      departmentContext: mockDepartmentContext,
      customPrompt: mockCustomPrompt,
    })

    const manualEstimate = Math.ceil(prompt.length / 4)

    expect(estimatedTokens).toBe(manualEstimate)
  })
})

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('4-layer system integration', () => {
  it('should work end-to-end: build prompt and context together', () => {
    // Build agent system prompt (4 layers)
    const systemPrompt = buildFourLayerPrompt(mockAgent, {
      companyContext: mockCompanyContext,
      departmentContext: mockDepartmentContext,
      customPrompt: mockCustomPrompt,
    })

    // Build context prompt (corporate context)
    const contextPrompt = buildContextPromptWithCorporate(
      '¿Debemos lanzar el producto ahora?',
      [{ type: 'file', content: 'PDF context here' }],
      {
        companyContext: mockCompanyContext,
        departmentContexts: [
          {
            departmentName: 'Marketing',
            departmentContext: mockDepartmentContext,
            customPrompt: mockCustomPrompt,
          },
        ],
      }
    )

    // Verify both contain corporate intelligence
    expect(systemPrompt).toContain('Democratizar el acceso')
    expect(contextPrompt).toContain('Democratizar el acceso')

    expect(systemPrompt).toContain('KPIs: CAC')
    expect(contextPrompt).toContain('KPIs: CAC')

    expect(systemPrompt).toContain('Sé directo')
    expect(contextPrompt).toContain('Sé directo')
  })

  it('should handle missing optional contexts gracefully', () => {
    const prompt = buildFourLayerPrompt(mockAgent, {
      companyContext: mockCompanyContext,
      // No department or custom prompt
    })

    expect(prompt).toContain('=== TU ROL TÉCNICO ===')
    expect(prompt).toContain('=== CONTEXTO EMPRESARIAL')
    expect(prompt).not.toContain('=== CONTEXTO DEPARTAMENTAL')
    expect(prompt).not.toContain('=== PERSONALIDAD Y ESTILO ===')
  })
})
