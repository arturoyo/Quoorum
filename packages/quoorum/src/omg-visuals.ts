/* eslint-disable no-console */
/**
 * Forum OMG Visuals
 *
 * Quick OMGs: Visualizaciones épicas (Constellation, Flow, Wave, etc.)
 */

import type { DebateResult } from './types'
import type { ExpertProfile } from './expert-database'

// ============================================================================
// EXPERT CONSTELLATION MAP
// ============================================================================

export interface ConstellationNode {
  id: string
  name: string
  x: number
  y: number
  category: string
  connections: string[]
}

/**
 * Genera mapa de constelación de expertos
 */
export function generateExpertConstellation(experts: ExpertProfile[]): ConstellationNode[] {
  const nodes: ConstellationNode[] = []

  // Group by category
  const categories = new Map<string, ExpertProfile[]>()
  for (const expert of experts) {
    const category = expert.expertise[0] || 'other'
    if (!categories.has(category)) {
      categories.set(category, [])
    }
    categories.get(category)!.push(expert)
  }

  // Position nodes in clusters
  let clusterIndex = 0
  for (const [category, categoryExperts] of categories.entries()) {
    const angle = (clusterIndex / categories.size) * 2 * Math.PI
    const clusterX = Math.cos(angle) * 100
    const clusterY = Math.sin(angle) * 100

    for (let i = 0; i < categoryExperts.length; i++) {
      const expert = categoryExperts[i]!
      const subAngle = (i / categoryExperts.length) * 2 * Math.PI
      const x = clusterX + Math.cos(subAngle) * 30
      const y = clusterY + Math.sin(subAngle) * 30

      // Find connections (experts with overlapping expertise)
      const connections = experts
        .filter((other) => {
          if (other.id === expert.id) return false
          return expert.expertise.some((e) => other.expertise.includes(e))
        })
        .map((e) => e.id)

      nodes.push({
        id: expert.id,
        name: expert.name,
        x,
        y,
        category,
        connections,
      })
    }

    clusterIndex++
  }

  return nodes
}

/**
 * Renderiza constelación como Mermaid graph
 */
export function renderConstellationMermaid(nodes: ConstellationNode[]): string {
  let mermaid = 'graph TD\n'

  // Add nodes
  for (const node of nodes) {
    const label = node.name.replace(/\s+/g, '_')
    mermaid += `  ${node.id}[${label}]\n`
  }

  // Add connections (limit to avoid clutter)
  const addedConnections = new Set<string>()
  for (const node of nodes) {
    for (const connId of node.connections.slice(0, 2)) {
      const key = [node.id, connId].sort().join('-')
      if (!addedConnections.has(key)) {
        mermaid += `  ${node.id} -.-> ${connId}\n`
        addedConnections.add(key)
      }
    }
  }

  // Style by category
  const categories = new Set(nodes.map((n) => n.category))
  const colors = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336']
  let colorIndex = 0
  for (const category of categories) {
    const color = colors[colorIndex % colors.length]
    const categoryNodes = nodes.filter((n) => n.category === category)
    for (const node of categoryNodes) {
      mermaid += `  style ${node.id} fill:${color}\n`
    }
    colorIndex++
  }

  return mermaid
}

/**
 * Renderiza constelación como ASCII art
 */
export function renderConstellationASCII(nodes: ConstellationNode[]): string {
  const width = 80
  const height = 30
  const grid: string[][] = Array<string[]>(height)
    .fill([])
    .map(() => Array<string>(width).fill(' '))

  // Normalize coordinates to grid
  const minX = Math.min(...nodes.map((n) => n.x))
  const maxX = Math.max(...nodes.map((n) => n.x))
  const minY = Math.min(...nodes.map((n) => n.y))
  const maxY = Math.max(...nodes.map((n) => n.y))

  for (const node of nodes) {
    const x = Math.round(((node.x - minX) / (maxX - minX)) * (width - 1))
    const y = Math.round(((node.y - minY) / (maxY - minY)) * (height - 1))

    if (x >= 0 && x < width && y >= 0 && y < height) {
      grid[y]![x] = '●'
    }
  }

  return '\n🌌 Expert Constellation\n\n' + grid.map((row) => row.join('')).join('\n') + '\n'
}

// ============================================================================
// ARGUMENT FLOW DIAGRAM (SANKEY)
// ============================================================================

export interface FlowNode {
  id: string
  label: string
  value: number
}

export interface FlowLink {
  source: string
  target: string
  value: number
}

/**
 * Genera diagrama de flujo de argumentos
 */
export function generateArgumentFlow(result: DebateResult): {
  nodes: FlowNode[]
  links: FlowLink[]
} {
  const nodes: FlowNode[] = []
  const links: FlowLink[] = []

  // Extract experts and their positions
  const expertPositions = new Map<string, string>()

  for (const round of result.rounds) {
    for (const message of round.messages) {
      if (message.agentKey === 'meta_moderator') continue

      // Extract position from message (simplified)
      const position = extractPosition(message.content, result.finalRanking)
      expertPositions.set(message.agentKey, position)
    }
  }

  // Create nodes for experts
  for (const [expertId, position] of expertPositions.entries()) {
    nodes.push({
      id: expertId,
      label: expertId
        .split('_')
        .map((w) => w[0]?.toUpperCase() + w.slice(1))
        .join(' '),
      value: 1,
    })

    // Create link to position
    links.push({
      source: expertId,
      target: position,
      value: 1,
    })
  }

  // Create nodes for positions
  const positions = new Set(expertPositions.values())
  for (const position of positions) {
    if (!nodes.some((n) => n.id === position)) {
      nodes.push({
        id: position,
        label: position,
        value: Array.from(expertPositions.values()).filter((p) => p === position).length,
      })
    }
  }

  return { nodes, links }
}

function extractPosition(content: string, ranking: Array<string | { option: string }>): string {
  for (const opt of ranking) {
    const option = typeof opt === 'string' ? opt : opt.option
    if (content.toLowerCase().includes(option.toLowerCase())) {
      return option
    }
  }
  return typeof ranking[0] === 'string' ? ranking[0] : ranking[0]?.option || 'Unknown'
}

/**
 * Renderiza flow como Mermaid Sankey
 */
export function renderArgumentFlowMermaid(result: DebateResult): string {
  const { nodes, links } = generateArgumentFlow(result)

  let mermaid = 'graph LR\n'

  for (const link of links) {
    const sourceLabel = nodes.find((n) => n.id === link.source)?.label || link.source
    const targetLabel = nodes.find((n) => n.id === link.target)?.label || link.target
    mermaid += `  ${link.source}[${sourceLabel}] -->|${link.value}| ${link.target}[${targetLabel}]\n`
  }

  // Style consensus node
  const consensusOption =
    typeof result.finalRanking[0] === 'string'
      ? result.finalRanking[0]
      : result.finalRanking[0]?.option || 'Unknown'
  mermaid += `  style ${consensusOption.replace(/\s+/g, '_')} fill:#4caf50,stroke:#2e7d32,stroke-width:3px\n`

  return mermaid
}

/**
 * Renderiza flow como ASCII
 */
export function renderArgumentFlowASCII(result: DebateResult): string {
  const { nodes, links } = generateArgumentFlow(result)

  let output = '\n📊 Argument Flow\n\n'

  // Group links by target
  const targetGroups = new Map<string, FlowLink[]>()
  for (const link of links) {
    if (!targetGroups.has(link.target)) {
      targetGroups.set(link.target, [])
    }
    targetGroups.get(link.target)!.push(link)
  }

  for (const [target, targetLinks] of targetGroups.entries()) {
    const targetNode = nodes.find((n) => n.id === target)
    output += `\n${targetNode?.label || target} (${targetNode?.value || 0} supporters):\n`

    for (const link of targetLinks) {
      const sourceNode = nodes.find((n) => n.id === link.source)
      output += `  ├─ ${sourceNode?.label || link.source}\n`
    }
  }

  return output
}

// ============================================================================
// SENTIMENT WAVE (ADVANCED)
// ============================================================================

/**
 * Genera visualización avanzada de onda de sentimiento
 */
export function generateAdvancedSentimentWave(result: DebateResult): string {
  let output = '\n📈 Advanced Sentiment Wave\n\n'
  const sentiments: Array<{ round: number; score: number; trend: number }> = []

  for (let i = 0; i < result.rounds.length; i++) {
    const round = result.rounds[i]!
    const scores = round.messages.map((msg) => calculateSentimentScore(msg.content))
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length

    sentiments.push({
      round: i + 1,
      score: avg,
      trend: i > 0 ? avg - (sentiments[i - 1]?.score || 0) : 0,
    })
  }

  // Create wave visualization
  const maxScore = 1
  const minScore = -1
  const height = 10

  for (let level = height; level >= 0; level--) {
    const threshold = minScore + ((maxScore - minScore) / height) * level
    let line = `${threshold.toFixed(1).padStart(5)} │ `

    for (const sentiment of sentiments) {
      if (sentiment.score >= threshold) {
        line += sentiment.trend > 0 ? '╱' : sentiment.trend < 0 ? '╲' : '─'
      } else {
        line += ' '
      }
      line += ' '
    }

    output += line + '\n'
  }

  // X-axis
  output += '      └─' + '──'.repeat(sentiments.length) + '\n'
  output += '        '
  for (let i = 0; i < sentiments.length; i++) {
    output += `R${i + 1} `
  }
  output += '\n'

  return output
}

function calculateSentimentScore(text: string): number {
  const positiveWords = [
    'good',
    'great',
    'excellent',
    'strong',
    'best',
    'recommend',
    'agree',
    'perfect',
    'optimal',
  ]
  const negativeWords = [
    'bad',
    'poor',
    'weak',
    'worst',
    'disagree',
    'concern',
    'risk',
    'problem',
    'fail',
  ]

  const lowerText = text.toLowerCase()
  const positiveCount = positiveWords.filter((w) => lowerText.includes(w)).length
  const negativeCount = negativeWords.filter((w) => lowerText.includes(w)).length

  return (positiveCount - negativeCount) / Math.max(1, positiveCount + negativeCount)
}

// ============================================================================
// EXPERT VOICE PROFILE
// ============================================================================

export interface VoiceProfile {
  expertId: string
  expertName: string
  style: {
    dataVsPhilosophical: number // 0-100 (0=philosophical, 100=data-driven)
    analyticalVsCreative: number // 0-100
    directVsDiplomatic: number // 0-100
  }
  favoriteTopics: Array<{ topic: string; frequency: number }>
  debateHistory: {
    totalDebates: number
    winRate: number
    avgQuality: number
  }
}

/**
 * Genera perfil de voz de un experto
 */
export function generateVoiceProfile(expertId: string, debates: DebateResult[]): VoiceProfile {
  const expertDebates = debates.filter((d) =>
    d.rounds.some((r) => r.messages.some((m) => m.agentKey === expertId))
  )

  const expertMessages = expertDebates.flatMap((d) =>
    d.rounds.flatMap((r) => r.messages.filter((m) => m.agentKey === expertId))
  )

  // Analyze style
  const dataWords = ['data', 'metrics', 'numbers', 'statistics', 'research', 'study']
  const philosophicalWords = ['believe', 'think', 'philosophy', 'principle', 'value']
  const analyticalWords = ['analyze', 'breakdown', 'systematic', 'framework', 'structure']
  const creativeWords = ['imagine', 'innovate', 'creative', 'unique', 'novel']

  let dataScore = 0
  let philosophicalScore = 0
  let analyticalScore = 0
  let creativeScore = 0

  for (const msg of expertMessages) {
    const lower = msg.content.toLowerCase()
    dataScore += dataWords.filter((w) => lower.includes(w)).length
    philosophicalScore += philosophicalWords.filter((w) => lower.includes(w)).length
    analyticalScore += analyticalWords.filter((w) => lower.includes(w)).length
    creativeScore += creativeWords.filter((w) => lower.includes(w)).length
  }

  const dataVsPhilosophical = (dataScore / Math.max(1, dataScore + philosophicalScore)) * 100
  const analyticalVsCreative =
    (analyticalScore / Math.max(1, analyticalScore + creativeScore)) * 100

  // Calculate win rate
  const wins = expertDebates.filter((d) => {
    const expertPosition = extractExpertPosition(d, expertId)
    const winningPosition =
      typeof d.finalRanking[0] === 'string' ? d.finalRanking[0] : d.finalRanking[0]?.option
    return expertPosition === winningPosition
  }).length

  return {
    expertId,
    expertName: expertId
      .split('_')
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(' '),
    style: {
      dataVsPhilosophical,
      analyticalVsCreative,
      directVsDiplomatic: 50, // placeholder
    },
    favoriteTopics: [],
    debateHistory: {
      totalDebates: expertDebates.length,
      winRate: expertDebates.length > 0 ? (wins / expertDebates.length) * 100 : 0,
      avgQuality: 75, // placeholder
    },
  }
}

function extractExpertPosition(debate: DebateResult, expertId: string): string {
  for (const round of debate.rounds) {
    for (const message of round.messages) {
      if (message.agentKey === expertId) {
        return extractPosition(message.content, debate.finalRanking)
      }
    }
  }
  return 'Unknown'
}

/**
 * Renderiza perfil de voz
 */
export function renderVoiceProfile(profile: VoiceProfile): string {
  let output = `\n🎤 Voice Profile: ${profile.expertName}\n\n`

  output += '━━━ Style ━━━\n\n'
  output += `Data-driven    ${generateBar(profile.style.dataVsPhilosophical, 100)}  Philosophical\n`
  output += `               ${profile.style.dataVsPhilosophical.toFixed(0)}%\n\n`
  output += `Analytical     ${generateBar(profile.style.analyticalVsCreative, 100)}  Creative\n`
  output += `               ${profile.style.analyticalVsCreative.toFixed(0)}%\n\n`

  output += '━━━ Debate History ━━━\n\n'
  output += `Total Debates: ${profile.debateHistory.totalDebates}\n`
  output += `Win Rate: ${profile.debateHistory.winRate.toFixed(0)}%\n`
  output += `Avg Quality: ${profile.debateHistory.avgQuality.toFixed(0)}/100\n`

  return output
}

function generateBar(value: number, max: number): string {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const filled = Math.round(percentage / 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const omgVisuals = {
  generateExpertConstellation,
  renderConstellationMermaid,
  renderConstellationASCII,
  generateArgumentFlow,
  renderArgumentFlowMermaid,
  renderArgumentFlowASCII,
  generateAdvancedSentimentWave,
  generateVoiceProfile,
  renderVoiceProfile,
}
