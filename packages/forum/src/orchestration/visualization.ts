/**
 * Visualization - Generates visual representations of debate structures.
 */

import type { DebateStructure, DebatePhase, PatternType } from './types'

// ============================================================================
// MERMAID DIAGRAM GENERATION
// ============================================================================

/**
 * Generate a Mermaid flowchart diagram of the debate structure
 */
export function toMermaid(structure: DebateStructure, pattern: PatternType): string {
  const lines: string[] = ['flowchart TD']
  const { phases } = structure

  // Add start node
  lines.push('  START((Inicio)) --> ANALYZE[Análisis de pregunta]')
  lines.push(`  ANALYZE --> PATTERN{{"Patrón: ${pattern}"}}`)

  // Connect pattern to first phase(s)
  const firstPhases = phases.filter(p => p.dependsOn.length === 0)
  for (const phase of firstPhases) {
    lines.push(`  PATTERN --> ${formatPhaseId(phase.id)}`)
  }

  // Add phase nodes and connections
  for (const phase of phases) {
    const phaseNode = formatPhaseNode(phase)
    lines.push(`  ${phaseNode}`)

    // Add sub-debate nodes
    for (const debate of phase.debates) {
      const debateId = formatDebateId(debate.id)
      const shortQuestion = truncate(debate.question, 30)
      lines.push(`  ${formatPhaseId(phase.id)} --> ${debateId}["${shortQuestion}"]`)
    }

    // Connect to dependent phases
    for (const depPhase of phases) {
      if (depPhase.dependsOn.includes(phase.id)) {
        // Connect debates to next phase
        for (const debate of phase.debates) {
          lines.push(`  ${formatDebateId(debate.id)} --> ${formatPhaseId(depPhase.id)}`)
        }
      }
    }
  }

  // Find last phase and connect to end
  const lastPhase = phases[phases.length - 1]
  if (lastPhase) {
    for (const debate of lastPhase.debates) {
      lines.push(`  ${formatDebateId(debate.id)} --> CONCLUSION[Conclusión Final]`)
    }
  }
  lines.push('  CONCLUSION --> END((Fin))')

  // Add styling
  lines.push('')
  lines.push('  %% Styling')
  lines.push('  classDef phaseNode fill:#e1f5fe,stroke:#01579b')
  lines.push('  classDef debateNode fill:#fff3e0,stroke:#e65100')
  lines.push('  classDef startEnd fill:#c8e6c9,stroke:#2e7d32')

  return lines.join('\n')
}

/**
 * Generate a simplified ASCII tree representation
 */
export function toAsciiTree(structure: DebateStructure, pattern: PatternType): string {
  const lines: string[] = []
  const { phases } = structure

  lines.push(`Patrón: ${pattern}`)
  lines.push('═'.repeat(50))
  lines.push('')

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i]!
    const isLast = i === phases.length - 1
    const prefix = isLast ? '└── ' : '├── '
    const childPrefix = isLast ? '    ' : '│   '

    const execIcon = phase.execution === 'parallel' ? '⇉' : '→'
    lines.push(`${prefix}📦 ${phase.id} [${execIcon} ${phase.execution}]`)

    if (phase.dependsOn.length > 0) {
      lines.push(`${childPrefix}   ⤷ depende de: ${phase.dependsOn.join(', ')}`)
    }

    for (let j = 0; j < phase.debates.length; j++) {
      const debate = phase.debates[j]!
      const isLastDebate = j === phase.debates.length - 1
      const debatePrefix = isLastDebate ? '└── ' : '├── '

      lines.push(`${childPrefix}${debatePrefix}💬 ${truncate(debate.question, 40)}`)
      lines.push(`${childPrefix}${isLastDebate ? '    ' : '│   '}   💰 $${debate.estimatedCost} | ⏱️ ${debate.estimatedTimeMinutes}min`)
    }
    lines.push('')
  }

  lines.push('═'.repeat(50))
  lines.push(`Total: $${structure.estimatedTotalCost.toFixed(2)} | ${structure.estimatedTotalTimeMinutes}min`)

  return lines.join('\n')
}

/**
 * Generate JSON representation for external visualization tools
 */
export function toVisualizationJson(
  structure: DebateStructure,
  pattern: PatternType,
  question: string
): VisualizationData {
  return {
    metadata: {
      pattern,
      question,
      generatedAt: new Date().toISOString(),
      estimatedCost: structure.estimatedTotalCost,
      estimatedTime: structure.estimatedTotalTimeMinutes,
    },
    nodes: generateNodes(structure),
    edges: generateEdges(structure),
  }
}

// ============================================================================
// HELPER TYPES AND FUNCTIONS
// ============================================================================

interface VisualizationData {
  metadata: {
    pattern: PatternType
    question: string
    generatedAt: string
    estimatedCost: number
    estimatedTime: number
  }
  nodes: VisualizationNode[]
  edges: VisualizationEdge[]
}

interface VisualizationNode {
  id: string
  type: 'start' | 'end' | 'phase' | 'debate' | 'synthesis'
  label: string
  data?: Record<string, unknown>
}

interface VisualizationEdge {
  source: string
  target: string
  label?: string
}

function generateNodes(structure: DebateStructure): VisualizationNode[] {
  const nodes: VisualizationNode[] = [
    { id: 'start', type: 'start', label: 'Inicio' },
  ]

  for (const phase of structure.phases) {
    nodes.push({
      id: phase.id,
      type: phase.type === 'synthesis' ? 'synthesis' : 'phase',
      label: phase.id,
      data: { execution: phase.execution, order: phase.order },
    })

    for (const debate of phase.debates) {
      nodes.push({
        id: debate.id,
        type: 'debate',
        label: truncate(debate.question, 50),
        data: { cost: debate.estimatedCost, time: debate.estimatedTimeMinutes },
      })
    }
  }

  nodes.push({ id: 'end', type: 'end', label: 'Fin' })
  return nodes
}

function generateEdges(structure: DebateStructure): VisualizationEdge[] {
  const edges: VisualizationEdge[] = []
  const { phases } = structure

  // Connect start to first phases
  const firstPhases = phases.filter(p => p.dependsOn.length === 0)
  for (const phase of firstPhases) {
    edges.push({ source: 'start', target: phase.id })
  }

  // Connect phases to debates and debates to dependent phases
  for (const phase of phases) {
    for (const debate of phase.debates) {
      edges.push({ source: phase.id, target: debate.id })
    }

    for (const depPhase of phases) {
      if (depPhase.dependsOn.includes(phase.id)) {
        for (const debate of phase.debates) {
          edges.push({ source: debate.id, target: depPhase.id })
        }
      }
    }
  }

  // Connect last phase debates to end
  const lastPhase = phases[phases.length - 1]
  if (lastPhase) {
    for (const debate of lastPhase.debates) {
      edges.push({ source: debate.id, target: 'end' })
    }
  }

  return edges
}

function formatPhaseId(id: string): string {
  return id.replace(/-/g, '_').toUpperCase()
}

function formatDebateId(id: string): string {
  return id.replace(/-/g, '_').toUpperCase()
}

function formatPhaseNode(phase: DebatePhase): string {
  const id = formatPhaseId(phase.id)
  const icon = phase.execution === 'parallel' ? '⇉' : '→'
  return `${id}[["${icon} ${phase.id}"]]`
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}
