/**
 * Forum Advanced Visualizations
 *
 * Quick WOWs visuales e interactivos para el sistema dinámico
 */

import type { DebateResult, DebateRound } from './types'
import type { QualityAnalysis } from './quality-monitor'
import { quoorumLogger } from './logger'

// ============================================================================
// ASCII ART DASHBOARD
// ============================================================================

export interface DashboardData {
  mode: 'static' | 'dynamic'
  complexity: number
  expertCount: number
  currentRound: number
  totalRounds: number
  quality: number
  consensus: number
  cost: number
}

/**
 * Genera dashboard ASCII art en terminal
 */
export function renderDashboard(data: DashboardData): string {
  const modeIcon = data.mode === 'dynamic' ? '🧠' : '⚡'
  const modeLabel = data.mode === 'dynamic' ? 'DYNAMIC' : 'STATIC'

  const complexityBar = generateBar(data.complexity, 10)
  const qualityBar = generateBar(data.quality, 100)
  const consensusBar = generateBar(data.consensus, 100)
  const progressBar = generateBar((data.currentRound / data.totalRounds) * 100, 100)

  return `
╔══════════════════════════════════════════════════════════╗
║  QUOORUM - DYNAMIC EXPERT SYSTEM                        ║
╠══════════════════════════════════════════════════════════╣
║  Mode: ${modeIcon} ${modeLabel.padEnd(47)}║
║  Complexity: ${complexityBar} ${data.complexity}/10${' '.repeat(30)}║
║  Experts: ${data.expertCount} 👥${' '.repeat(44)}║
║                                                          ║
║  Progress: ${progressBar} ${data.currentRound}/${data.totalRounds}${' '.repeat(30)}║
║  Quality: ${qualityBar} ${data.quality}/100 ${data.quality >= 80 ? '✨' : data.quality >= 60 ? '👍' : '⚠️'}${' '.repeat(25)}║
║  Consensus: ${consensusBar} ${data.consensus}/100 ${data.consensus >= 80 ? '🎯' : ''}${' '.repeat(23)}║
║                                                          ║
║  Cost: $${data.cost.toFixed(2)} 💰${' '.repeat(42)}║
╚══════════════════════════════════════════════════════════╝
`.trim()
}

function generateBar(value: number, max: number): string {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const filled = Math.round(percentage / 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

/**
 * Imprime dashboard usando logger
 */
export function printDashboard(data: DashboardData): void {
  quoorumLogger.debug('Dashboard visualization', { dashboardData: data })
}

// ============================================================================
// REAL-TIME PROGRESS BAR
// ============================================================================

export interface ProgressData {
  currentRound: number
  totalRounds: number
  quality: number
  expertCount: number
  cost: number
}

/**
 * Genera progress bar en una línea
 */
export function renderProgressBar(data: ProgressData): string {
  const percentage = (data.currentRound / data.totalRounds) * 100
  const filled = Math.round(percentage / 5)
  const empty = 20 - filled
  const bar = '█'.repeat(filled) + '░'.repeat(empty)

  const qualityIcon = data.quality >= 80 ? '✨' : data.quality >= 60 ? '👍' : '⚠️'

  return `Round ${data.currentRound}/${data.totalRounds} [${bar}] ${percentage.toFixed(0)}% | Quality: ${data.quality}/100 ${qualityIcon} | Experts: ${data.expertCount} 👥 | Cost: $${data.cost.toFixed(2)} 💰`
}

/**
 * Actualiza progress bar en consola (misma línea)
 */
export function updateProgressBar(data: ProgressData): void {
  process.stdout.write('\r' + renderProgressBar(data))
  if (data.currentRound === data.totalRounds) {
    process.stdout.write('\n')
  }
}

// ============================================================================
// DEBATE VISUALIZATION (MERMAID)
// ============================================================================

/**
 * Genera diagrama Mermaid del flujo del debate
 */
export function generateDebateFlowDiagram(result: DebateResult): string {
  let mermaid = 'graph TD\n'
  mermaid += '  Start[Question] --> Analysis[Question Analysis]\n'
  mermaid += '  Analysis --> Matching[Expert Matching]\n'

  // Rounds
  for (let i = 0; i < result.rounds.length; i++) {
    const round = result.rounds[i]!
    const roundId = `R${i + 1}`

    if (i === 0) {
      mermaid += `  Matching --> ${roundId}[Round ${i + 1}]\n`
    } else {
      mermaid += `  R${i} --> ${roundId}[Round ${i + 1}]\n`
    }

    // Check for interventions
    const hasIntervention = round.messages.some((m) => m.agentKey === 'meta_moderator')
    if (hasIntervention) {
      mermaid += `  ${roundId} -.->|Meta-Moderator| ${roundId}\n`
    }
  }

  // Final consensus
  const lastRound = `R${result.rounds.length}`
  const consensusText =
    typeof result.finalRanking[0] === 'string'
      ? result.finalRanking[0]
      : result.finalRanking[0]?.option || 'No consensus'
  mermaid += `  ${lastRound} --> Consensus[Consensus: ${consensusText}]\n`

  // Styling
  mermaid += '  style Start fill:#e1f5ff\n'
  mermaid += '  style Consensus fill:#c8e6c9\n'

  return mermaid
}

/**
 * Genera diagrama Mermaid de argumentos (Sankey-style)
 */
export function generateArgumentFlowDiagram(result: DebateResult): string {
  const topOption =
    typeof result.finalRanking[0] === 'string'
      ? result.finalRanking[0]
      : result.finalRanking[0]?.option || 'No consensus'

  let mermaid = 'graph LR\n'

  // Group messages by expert
  const expertOpinions = new Map<string, string>()

  for (const round of result.rounds) {
    for (const msg of round.messages) {
      if (msg.agentKey !== 'meta_moderator' && !expertOpinions.has(msg.agentKey)) {
        // Extract opinion from message (simplified)
        const opinion = extractOpinion(msg.content, result.finalRanking)
        expertOpinions.set(msg.agentKey, opinion)
      }
    }
  }

  // Create nodes
  for (const [expert, opinion] of expertOpinions.entries()) {
    const expertName = expert
      .split('_')
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(' ')
    mermaid += `  ${expert}[${expertName}] -->|supports| ${opinion.replace(/\s+/g, '_')}\n`
  }

  // Consensus node
  mermaid += `  ${topOption.replace(/\s+/g, '_')}[${topOption}]\n`
  mermaid += `  style ${topOption.replace(/\s+/g, '_')} fill:#4caf50,stroke:#2e7d32,stroke-width:3px\n`

  return mermaid
}

function extractOpinion(content: string, ranking: Array<string | { option: string }>): string {
  // Simple heuristic: look for first option mentioned
  for (const opt of ranking) {
    const option = typeof opt === 'string' ? opt : opt.option
    if (content.includes(option)) {
      return option
    }
  }
  return typeof ranking[0] === 'string' ? ranking[0] : ranking[0]?.option || 'Unknown'
}

// ============================================================================
// DEBATE HEATMAP
// ============================================================================

export interface HeatmapData {
  round: number
  intensity: number // 0-100
  hasIntervention: boolean
  quality: number
}

/**
 * Genera heatmap visual del debate
 */
export function generateDebateHeatmap(
  rounds: DebateRound[],
  _qualities: QualityAnalysis[]
): string {
  const heatmaps: HeatmapData[] = rounds.map((round, i) => ({
    round: i + 1,
    intensity: calculateIntensity(round),
    hasIntervention: round.messages.some((m) => m.agentKey === 'meta_moderator'),
    quality: 75, // Placeholder
  }))

  let output = '\n📊 Debate Intensity Heatmap\n\n'

  for (const data of heatmaps) {
    const fires = Math.round(data.intensity / 20)
    const emptyFires = 5 - fires
    const fireBar = '🔥'.repeat(fires) + '░░'.repeat(emptyFires)

    const intervention = data.hasIntervention ? ' ⚡ Meta-moderator!' : ''
    const qualityIcon = data.quality >= 80 ? ' ✨' : data.quality >= 60 ? ' 👍' : ' ⚠️'

    output += `Round ${data.round}: ${fireBar} (${data.intensity}/100)${intervention}${qualityIcon}\n`
  }

  return output
}

function calculateIntensity(round: DebateRound): number {
  // Heuristic: longer messages + more messages = higher intensity
  const avgLength =
    round.messages.reduce((sum, m) => sum + m.content.length, 0) / round.messages.length
  const messageCount = round.messages.length

  const lengthScore = Math.min(100, (avgLength / 500) * 100)
  const countScore = Math.min(100, (messageCount / 6) * 100)

  return Math.round((lengthScore + countScore) / 2)
}

/**
 * Imprime heatmap en consola
 */
export function printDebateHeatmap(rounds: DebateRound[], qualities: QualityAnalysis[]): void {
  const heatmap = generateDebateHeatmap(rounds, qualities)
  quoorumLogger.debug('Debate heatmap visualization', {
    rounds: rounds.length,
    qualities: qualities.length,
    heatmap,
  })
}

// ============================================================================
// SENTIMENT WAVE
// ============================================================================

export interface SentimentWaveData {
  round: number
  positive: number // 0-100
  neutral: number
  negative: number
}

/**
 * Genera visualización de onda de sentimiento
 */
export function generateSentimentWave(rounds: DebateRound[]): string {
  const waves: SentimentWaveData[] = rounds.map((round, i) => ({
    round: i + 1,
    ...calculateRoundSentiment(round),
  }))

  let output = '\n😊 Sentiment Wave\n\n'

  // Positive line
  output += '😊 Positive  '
  for (const wave of waves) {
    const height = Math.round(wave.positive / 20)
    output += height > 0 ? '╱' : '─'
  }
  output += '\n'

  // Neutral line
  output += '😐 Neutral   '
  for (const wave of waves) {
    const height = Math.round(wave.neutral / 20)
    output += height > 2 ? '─' : '╲'
  }
  output += '\n'

  // Negative line
  output += '😠 Negative  '
  for (const wave of waves) {
    const height = Math.round(wave.negative / 20)
    output += height > 0 ? '╲' : '─'
  }
  output += '\n'

  // Round labels
  output += '             '
  for (let i = 0; i < waves.length; i++) {
    output += `R${i + 1}`
  }
  output += '\n'

  return output
}

function calculateRoundSentiment(round: DebateRound): {
  positive: number
  neutral: number
  negative: number
} {
  const sentiments = round.messages.map((msg) => analyzeSentimentSimple(msg.content))

  const positive = (sentiments.filter((s) => s === 'positive').length / sentiments.length) * 100
  const negative = (sentiments.filter((s) => s === 'negative').length / sentiments.length) * 100
  const neutral = 100 - positive - negative

  return { positive, neutral, negative }
}

function analyzeSentimentSimple(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = [
    'good',
    'great',
    'excellent',
    'strong',
    'best',
    'recommend',
    'agree',
    'perfect',
  ]
  const negativeWords = ['bad', 'poor', 'weak', 'worst', 'disagree', 'concern', 'risk', 'problem']

  const lowerText = text.toLowerCase()
  const positiveCount = positiveWords.filter((w) => lowerText.includes(w)).length
  const negativeCount = negativeWords.filter((w) => lowerText.includes(w)).length

  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

/**
 * Imprime sentiment wave en consola
 */
export function printSentimentWave(rounds: DebateRound[]): void {
  const wave = generateSentimentWave(rounds)
  quoorumLogger.debug('Sentiment wave visualization', {
    rounds: rounds.length,
    wave,
  })
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const visualizations = {
  renderDashboard,
  printDashboard,
  renderProgressBar,
  updateProgressBar,
  generateDebateFlowDiagram,
  generateArgumentFlowDiagram,
  generateDebateHeatmap,
  printDebateHeatmap,
  generateSentimentWave,
  printSentimentWave,
}
