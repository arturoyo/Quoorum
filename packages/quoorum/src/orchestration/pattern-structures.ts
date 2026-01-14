/**
 * Pattern Structures - Creates debate phase structures for each pattern type.
 */

import type { DebatePhase, SubDebate } from './types'

export function createSimplePhase(question: string): DebatePhase {
  return {
    id: 'phase-1',
    order: 1,
    type: 'debate',
    execution: 'sequential',
    dependsOn: [],
    debates: [
      {
        id: 'debate-1',
        question,
        inheritContext: false,
        estimatedCost: 0.15,
        estimatedTimeMinutes: 2,
      },
    ],
  }
}

export function createSequentialPhases(question: string, factors: string[]): DebatePhase[] {
  return factors.map((factor, index) => ({
    id: `phase-${index + 1}`,
    order: index + 1,
    type: 'debate' as const,
    execution: 'sequential' as const,
    dependsOn: index > 0 ? [`phase-${index}`] : [],
    debates: [
      {
        id: `debate-${index + 1}`,
        question: `Respecto a "${question}": Análisis de ${factor}`,
        inheritContext: index > 0,
        estimatedCost: 0.12,
        estimatedTimeMinutes: 2,
      },
    ],
  }))
}

export function createParallelPhases(question: string, factors: string[]): DebatePhase[] {
  return [{
    id: 'phase-parallel',
    order: 1,
    type: 'debate',
    execution: 'parallel',
    dependsOn: [],
    debates: factors.map((factor, index) => ({
      id: `debate-${index + 1}`,
      question: `Respecto a "${question}": Análisis de ${factor}`,
      inheritContext: false,
      estimatedCost: 0.12,
      estimatedTimeMinutes: 2,
    })),
  }]
}

export function createTournamentPhases(question: string, optionCount: number): DebatePhase[] {
  const phases: DebatePhase[] = [], options = optionCount || 4, round1Debates: SubDebate[] = []
  for (let i = 0; i < Math.ceil(options / 2); i++) {
    round1Debates.push({
      id: `debate-r1-${i + 1}`,
      question: `${question} - Comparación ${i * 2 + 1} vs ${i * 2 + 2}`,
      inheritContext: false,
      estimatedCost: 0.15,
      estimatedTimeMinutes: 2,
    })
  }

  phases.push({
    id: 'phase-round1',
    order: 1,
    type: 'debate',
    execution: 'parallel',
    dependsOn: [],
    debates: round1Debates,
  })

  if (options > 2) {
    phases.push({
      id: 'phase-final',
      order: 2,
      type: 'debate',
      execution: 'sequential',
      dependsOn: ['phase-round1'],
      debates: [{
        id: 'debate-final',
        question: `${question} - Final entre mejores opciones`,
        inheritContext: true,
        estimatedCost: 0.18,
        estimatedTimeMinutes: 3,
      }],
    })
  }

  return phases
}

export function createAdversarialPhases(question: string): DebatePhase[] {
  return [
    {
      id: 'phase-adversarial',
      order: 1,
      type: 'debate',
      execution: 'parallel',
      dependsOn: [],
      debates: [
        {
          id: 'debate-defender',
          question: `DEFENDER: Argumenta A FAVOR de "${question}"`,
          inheritContext: false,
          estimatedCost: 0.12,
          estimatedTimeMinutes: 2,
          forceExperts: ['optimist'],
        },
        {
          id: 'debate-attacker',
          question: `ATACANTE: Argumenta EN CONTRA de "${question}"`,
          inheritContext: false,
          estimatedCost: 0.12,
          estimatedTimeMinutes: 2,
          forceExperts: ['the-critic'],
        },
      ],
    },
    {
      id: 'phase-judge',
      order: 2,
      type: 'debate',
      execution: 'sequential',
      dependsOn: ['phase-adversarial'],
      debates: [{
        id: 'debate-judge',
        question: `JUEZ: Evalúa ambos argumentos sobre "${question}"`,
        inheritContext: true,
        estimatedCost: 0.15,
        estimatedTimeMinutes: 2,
        forceExperts: ['analyst', 'synthesizer'],
      }],
    },
  ]
}

export function createIterativePhases(question: string): DebatePhase[] {
  return [
    {
      id: 'phase-initial',
      order: 1,
      type: 'debate',
      execution: 'sequential',
      dependsOn: [],
      debates: [{
        id: 'debate-initial',
        question,
        inheritContext: false,
        estimatedCost: 0.15,
        estimatedTimeMinutes: 2,
      }],
    },
    {
      id: 'phase-refine',
      order: 2,
      type: 'debate',
      execution: 'sequential',
      dependsOn: ['phase-initial'],
      debates: [{
        id: 'debate-refine',
        question: `Refinar y profundizar: ${question}`,
        inheritContext: true,
        estimatedCost: 0.12,
        estimatedTimeMinutes: 2,
      }],
    },
  ]
}

export function createEnsemblePhases(question: string): DebatePhase[] {
  return [{
    id: 'phase-ensemble',
    order: 1,
    type: 'debate',
    execution: 'parallel',
    dependsOn: [],
    debates: [
      {
        id: 'debate-ensemble-1',
        question: `${question} (Perspectiva 1: Optimista)`,
        inheritContext: false,
        estimatedCost: 0.12,
        estimatedTimeMinutes: 2,
      },
      {
        id: 'debate-ensemble-2',
        question: `${question} (Perspectiva 2: Conservadora)`,
        inheritContext: false,
        estimatedCost: 0.12,
        estimatedTimeMinutes: 2,
      },
      {
        id: 'debate-ensemble-3',
        question: `${question} (Perspectiva 3: Disruptiva)`,
        inheritContext: false,
        estimatedCost: 0.12,
        estimatedTimeMinutes: 2,
      },
    ],
  }]
}

export function createHierarchicalPhases(question: string, factors: string[]): DebatePhase[] {
  const phases: DebatePhase[] = [{
    id: 'phase-overview',
    order: 1,
    type: 'debate',
    execution: 'sequential',
    dependsOn: [],
    debates: [{
      id: 'debate-overview',
      question: `Visión general: ${question}`,
      inheritContext: false,
      estimatedCost: 0.15,
      estimatedTimeMinutes: 2,
    }],
  }]

  if (factors.length > 0) {
    phases.push({
      id: 'phase-drilldown',
      order: 2,
      type: 'debate',
      execution: 'parallel',
      dependsOn: ['phase-overview'],
      debates: factors.map((factor, index) => ({
        id: `debate-detail-${index + 1}`,
        question: `Detalle de ${factor} para: ${question}`,
        inheritContext: true,
        estimatedCost: 0.12,
        estimatedTimeMinutes: 2,
      })),
    })
  }

  return phases
}

export function createConditionalPhases(question: string): DebatePhase[] {
  return [
    {
      id: 'phase-explore',
      order: 1,
      type: 'debate',
      execution: 'sequential',
      dependsOn: [],
      debates: [{
        id: 'debate-explore',
        question: `Explorar opciones para: ${question}`,
        inheritContext: false,
        estimatedCost: 0.15,
        estimatedTimeMinutes: 2,
      }],
    },
    {
      id: 'phase-branch-a',
      order: 2,
      type: 'branch',
      execution: 'sequential',
      dependsOn: ['phase-explore'],
      condition: {
        field: 'consensusScore',
        operator: '>=',
        value: 0.7,
        thenPhase: 'phase-conclude',
        elsePhase: 'phase-deepen',
      },
      debates: [],
    },
  ]
}

export function createSynthesisPhase(previousPhases: DebatePhase[]): DebatePhase {
  const lastPhase = previousPhases[previousPhases.length - 1]
  return {
    id: 'phase-synthesis',
    order: (lastPhase?.order ?? 0) + 1,
    type: 'synthesis',
    execution: 'sequential',
    dependsOn: previousPhases.map(p => p.id),
    debates: [{
      id: 'debate-synthesis',
      question: 'Sintetizar conclusiones de todos los debates anteriores',
      inheritContext: true,
      estimatedCost: 0.12,
      estimatedTimeMinutes: 2,
    }],
  }
}
