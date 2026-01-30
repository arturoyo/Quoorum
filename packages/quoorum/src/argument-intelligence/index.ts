/**
 * Argument Intelligence Engine
 * 
 * Analiza debates y extrae estructura de argumentos (premisas, conclusiones, relaciones)
 * para visualización interactiva.
 */

import { getAIClient } from '@quoorum/ai'
import { quoorumLogger } from '../logger'
import type { DebateResult, DebateMessage, DebateRound } from '../types'

// ============================================================================
// TYPES
// ============================================================================

export interface ArgumentNode {
  id: string
  type: 'premise' | 'conclusion' | 'objection' | 'support'
  content: string
  expert: string
  round: number
  children: string[] // IDs of child nodes (arguments that support/attack this)
  parents: string[] // IDs of parent nodes (arguments this supports/attacks)
  strength: number // 0-1, calculated based on expert credibility + evidence
  sourceMessageId: string
  sourceMessageContent: string // Extract from original message
}

export interface ArgumentEdge {
  from: string // Node ID
  to: string // Node ID
  type: 'supports' | 'attacks' | 'cites' | 'agrees_with' | 'disagrees_with'
  strength: number // 0-1
  round: number
  reasoning?: string // Why this relationship exists
}

export interface ArgumentTree {
  root: ArgumentNode | null // The main question (if extracted)
  nodes: ArgumentNode[]
  edges: ArgumentEdge[]
  metadata: {
    totalArguments: number
    totalRelationships: number
    strongestArgument: string | null // Node ID
    mostContestedArgument: string | null // Node ID (most attacked)
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Analiza un debate y extrae estructura de argumentos
 */
export async function buildArgumentTree(
  debate: DebateResult
): Promise<ArgumentTree> {
  quoorumLogger.info('Building argument tree', {
    debateId: debate.sessionId,
    rounds: debate.rounds?.length || 0,
  })

  const nodes: ArgumentNode[] = []
  const edges: ArgumentEdge[] = []
  let nodeIdCounter = 0

  // Extract arguments from each message
  for (const round of debate.rounds || []) {
    for (const message of round.messages || []) {
      try {
        const extracted = await extractArgumentsFromMessage(
          message,
          round.round || 0
        )

        // Create nodes for each extracted argument
        for (const arg of extracted.arguments) {
          const nodeId = `arg-${nodeIdCounter++}`
          const node: ArgumentNode = {
            id: nodeId,
            type: arg.type,
            content: arg.content,
            expert: message.agentName || message.agentKey || 'Unknown',
            round: round.round || 0,
            children: [],
            parents: [],
            strength: arg.strength,
            sourceMessageId: message.id,
            sourceMessageContent: message.content.substring(0, 200),
          }
          nodes.push(node)

          // Extract relationships
          if (arg.supports) {
            // Find or create target node
            const targetId = findOrCreateTargetNode(
              arg.supports,
              nodes,
              nodeIdCounter
            )
            edges.push({
              from: nodeId,
              to: targetId,
              type: 'supports',
              strength: arg.strength,
              round: round.round || 0,
            })
            node.children.push(targetId)
          }

          if (arg.attacks) {
            const targetId = findOrCreateTargetNode(
              arg.attacks,
              nodes,
              nodeIdCounter
            )
            edges.push({
              from: nodeId,
              to: targetId,
              type: 'attacks',
              strength: arg.strength,
              round: round.round || 0,
            })
            node.children.push(targetId)
          }
        }
      } catch (error) {
        quoorumLogger.error(
          'Failed to extract arguments from message',
          error instanceof Error ? error : new Error(String(error)),
          { messageId: message.id }
        )
      }
    }
  }

  // Calculate metadata
  const strongestArgument = nodes.reduce(
    (max, node) => (node.strength > (max?.strength || 0) ? node : max),
    null as ArgumentNode | null
  )

  const mostContestedArgument = nodes.reduce(
    (max, node) => {
      const attackCount = edges.filter(
        (e) => e.to === node.id && e.type === 'attacks'
      ).length
      const maxAttacks = max
        ? edges.filter((e) => e.to === max.id && e.type === 'attacks').length
        : 0
      return attackCount > maxAttacks ? node : max
    },
    null as ArgumentNode | null
  )

  // Build parent relationships
  for (const edge of edges) {
    const fromNode = nodes.find((n) => n.id === edge.from)
    const toNode = nodes.find((n) => n.id === edge.to)
    if (fromNode && toNode) {
      if (!toNode.parents.includes(edge.from)) {
        toNode.parents.push(edge.from)
      }
    }
  }

  return {
    root: nodes.find((n) => n.type === 'conclusion' && n.round === 0) || null,
    nodes,
    edges,
    metadata: {
      totalArguments: nodes.length,
      totalRelationships: edges.length,
      strongestArgument: strongestArgument?.id || null,
      mostContestedArgument: mostContestedArgument?.id || null,
    },
  }
}

// ============================================================================
// ARGUMENT EXTRACTION
// ============================================================================

interface ExtractedArgument {
  type: 'premise' | 'conclusion' | 'objection' | 'support'
  content: string
  strength: number
  supports?: string // Content of argument this supports
  attacks?: string // Content of argument this attacks
}

interface ExtractionResult {
  arguments: ExtractedArgument[]
}

/**
 * Extrae argumentos de un mensaje usando IA
 */
async function extractArgumentsFromMessage(
  message: DebateMessage,
  round: number
): Promise<ExtractionResult> {
  const aiClient = getAIClient()

  const systemPrompt = `Eres un analista de argumentos experto. Tu tarea es extraer la estructura argumentativa de un mensaje de debate.

Analiza el mensaje y extrae:
1. PREMISAS: Supuestos o hechos que se presentan como base del razonamiento
2. CONCLUSIONES: Afirmaciones que se derivan de las premisas
3. OBJECIONES: Argumentos que refutan o cuestionan otros argumentos
4. APOYOS: Argumentos que apoyan o refuerzan otros argumentos mencionados

Para cada argumento extraído:
- Identifica el tipo (premise, conclusion, objection, support)
- Extrae el contenido (1-2 oraciones)
- Calcula strength (0-1) basándote en:
  * Evidencia proporcionada (datos, ejemplos, referencias)
  * Claridad del razonamiento
  * Especificidad (más específico = más fuerte)
- Si el argumento apoya o ataca otro argumento mencionado, identifica cuál

Output SOLO JSON válido sin texto adicional.`

  const userPrompt = `Mensaje del experto "${message.agentName || message.agentKey}" (Ronda ${round}):

${message.content}

Extrae la estructura argumentativa.`

  const response = await aiClient.generateWithSystem(
    systemPrompt,
    userPrompt,
    {
      modelId: 'gemini-2.0-flash',
      temperature: 0.3,
      maxTokens: 2000,
    }
  )

  try {
    const parsed = JSON.parse(response.text) as ExtractionResult
    return parsed
  } catch (error) {
    quoorumLogger.error(
      'Failed to parse argument extraction',
      error instanceof Error ? error : new Error(String(error))
    )
    // Fallback: simple extraction
    return {
      arguments: [
        {
          type: 'conclusion',
          content: message.content.substring(0, 200),
          strength: 0.5,
        },
      ],
    }
  }
}

/**
 * Helper: Find or create target node for relationships
 */
function findOrCreateTargetNode(
  targetContent: string,
  existingNodes: ArgumentNode[],
  nodeIdCounter: number
): string {
  // Try to find existing node with similar content
  const similar = existingNodes.find(
    (n) =>
      n.content.toLowerCase().includes(targetContent.toLowerCase().substring(0, 50)) ||
      targetContent.toLowerCase().includes(n.content.toLowerCase().substring(0, 50))
  )

  if (similar) {
    return similar.id
  }

  // Create new node
  const newNode: ArgumentNode = {
    id: `arg-${nodeIdCounter}`,
    type: 'conclusion', // Default type
    content: targetContent.substring(0, 200),
    expert: 'Unknown',
    round: 0,
    children: [],
    parents: [],
    strength: 0.5,
    sourceMessageId: 'generated',
    sourceMessageContent: targetContent.substring(0, 200),
  }
  existingNodes.push(newNode)
  return newNode.id
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Filter nodes by expert
 */
export function filterNodesByExpert(
  tree: ArgumentTree,
  expertName: string
): ArgumentTree {
  const filteredNodes = tree.nodes.filter((n) => n.expert === expertName)
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id))
  const filteredEdges = tree.edges.filter(
    (e) => filteredNodeIds.has(e.from) && filteredNodeIds.has(e.to)
  )

  return {
    ...tree,
    nodes: filteredNodes,
    edges: filteredEdges,
  }
}

/**
 * Filter nodes by type
 */
export function filterNodesByType(
  tree: ArgumentTree,
  type: ArgumentNode['type']
): ArgumentTree {
  const filteredNodes = tree.nodes.filter((n) => n.type === type)
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id))
  const filteredEdges = tree.edges.filter(
    (e) => filteredNodeIds.has(e.from) && filteredNodeIds.has(e.to)
  )

  return {
    ...tree,
    nodes: filteredNodes,
    edges: filteredEdges,
  }
}

/**
 * Filter nodes by strength threshold
 */
export function filterNodesByStrength(
  tree: ArgumentTree,
  minStrength: number
): ArgumentTree {
  const filteredNodes = tree.nodes.filter((n) => n.strength >= minStrength)
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id))
  const filteredEdges = tree.edges.filter(
    (e) => filteredNodeIds.has(e.from) && filteredNodeIds.has(e.to)
  )

  return {
    ...tree,
    nodes: filteredNodes,
    edges: filteredEdges,
  }
}
