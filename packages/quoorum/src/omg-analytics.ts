/**
 * Forum OMG Analytics & Entertainment
 *
 * Quick OMGs: DNA, Chemistry, ROI, Roast Mode, Bingo
 */

import type { DebateResult } from './types'
import { quoorumLogger } from './logger'

// ============================================================================
// DEBATE DNA / FINGERPRINT
// ============================================================================

export interface DebateDNA {
  complexity: number // 0-10
  controversy: number // 0-10
  dataDriven: number // 0-10
  creativity: number // 0-10
  emotionalIntensity: number // 0-10
  consensus: number // 0-10
}

/**
 * Genera DNA/fingerprint del debate
 */
export function generateDebateDNA(result: DebateResult): DebateDNA {
  // Analyze all messages
  const allMessages = result.rounds.flatMap((r) =>
    r.messages.filter((m) => m.agentKey !== 'meta_moderator')
  )

  // Complexity: based on message length and vocabulary
  const avgLength = allMessages.reduce((sum, m) => sum + m.content.length, 0) / allMessages.length
  const complexity = Math.min(10, Math.round((avgLength / 300) * 10))

  // Controversy: based on disagreement
  const controversy = Math.round((1 - result.consensusScore) * 10)

  // Data-driven: count data-related words
  const dataWords = ['data', 'metrics', 'numbers', 'statistics', 'research', 'study', 'analysis']
  let dataCount = 0
  for (const msg of allMessages) {
    const lower = msg.content.toLowerCase()
    dataCount += dataWords.filter((w) => lower.includes(w)).length
  }
  const dataDriven = Math.min(10, Math.round((dataCount / allMessages.length) * 2))

  // Creativity: count creative words
  const creativeWords = ['imagine', 'innovate', 'creative', 'unique', 'novel', 'breakthrough']
  let creativeCount = 0
  for (const msg of allMessages) {
    const lower = msg.content.toLowerCase()
    creativeCount += creativeWords.filter((w) => lower.includes(w)).length
  }
  const creativity = Math.min(10, Math.round((creativeCount / allMessages.length) * 3))

  // Emotional intensity: count emotional words
  const emotionalWords = [
    'love',
    'hate',
    'excited',
    'worried',
    'concerned',
    'passionate',
    'critical',
  ]
  let emotionalCount = 0
  for (const msg of allMessages) {
    const lower = msg.content.toLowerCase()
    emotionalCount += emotionalWords.filter((w) => lower.includes(w)).length
  }
  const emotionalIntensity = Math.min(10, Math.round((emotionalCount / allMessages.length) * 3))

  // Consensus
  const consensus = Math.round(result.consensusScore * 10)

  return {
    complexity,
    controversy,
    dataDriven,
    creativity,
    emotionalIntensity,
    consensus,
  }
}

/**
 * Renderiza DNA
 */
export function renderDebateDNA(dna: DebateDNA): string {
  let output = '\n🧬 Debate DNA / Fingerprint\n\n'

  output += `Complexity:          ${generateBar(dna.complexity, 10)} ${dna.complexity}/10\n`
  output += `Controversy:         ${generateBar(dna.controversy, 10)} ${dna.controversy}/10\n`
  output += `Data-driven:         ${generateBar(dna.dataDriven, 10)} ${dna.dataDriven}/10\n`
  output += `Creativity:          ${generateBar(dna.creativity, 10)} ${dna.creativity}/10\n`
  output += `Emotional Intensity: ${generateBar(dna.emotionalIntensity, 10)} ${dna.emotionalIntensity}/10\n`
  output += `Consensus:           ${generateBar(dna.consensus, 10)} ${dna.consensus}/10\n`

  return output
}

function generateBar(value: number, max: number): string {
  const filled = Math.round((value / max) * 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

/**
 * Imprime DNA en consola
 */
export function printDebateDNA(result: DebateResult): void {
  const dna = generateDebateDNA(result)
  quoorumLogger.debug('Debate DNA', {
    sessionId: result.sessionId,
    dna,
  })
}

// ============================================================================
// EXPERT CHEMISTRY SCORE
// ============================================================================

export interface ChemistryScore {
  expert1: string
  expert2: string
  score: number // 0-100
  factors: {
    complementaryPerspectives: number
    buildOnIdeas: number
    historicalCollaboration: number
  }
  description: string
}

/**
 * Calcula química entre dos expertos
 */
export function calculateExpertChemistry(
  expert1Id: string,
  expert2Id: string,
  debates: DebateResult[]
): ChemistryScore {
  // Find debates where both participated
  const sharedDebates = debates.filter((d) => {
    const participants = new Set(d.rounds.flatMap((r) => r.messages.map((m) => m.agentKey)))
    return participants.has(expert1Id) && participants.has(expert2Id)
  })

  // Calculate factors
  const complementaryPerspectives = 70 + Math.random() * 30 // Mock
  const buildOnIdeas = 60 + Math.random() * 40 // Mock
  const historicalCollaboration = Math.min(100, sharedDebates.length * 10)

  const score = Math.round((complementaryPerspectives + buildOnIdeas + historicalCollaboration) / 3)

  let description = ''
  if (score >= 80) {
    description = 'Excellent chemistry! These experts work very well together.'
  } else if (score >= 60) {
    description = 'Good chemistry. Complementary perspectives with occasional synergy.'
  } else if (score >= 40) {
    description = 'Moderate chemistry. Sometimes align, sometimes diverge.'
  } else {
    description = 'Low chemistry. Different frameworks and approaches.'
  }

  return {
    expert1: expert1Id,
    expert2: expert2Id,
    score,
    factors: {
      complementaryPerspectives: Math.round(complementaryPerspectives),
      buildOnIdeas: Math.round(buildOnIdeas),
      historicalCollaboration: Math.round(historicalCollaboration),
    },
    description,
  }
}

/**
 * Renderiza chemistry score
 */
export function renderExpertChemistry(chemistry: ChemistryScore): string {
  const expert1Name = chemistry.expert1
    .split('_')
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ')
  const expert2Name = chemistry.expert2
    .split('_')
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ')

  const fires = Math.round(chemistry.score / 20)
  const fireBar = '🔥'.repeat(fires) + '░░'.repeat(5 - fires)

  let output = `\n🤝 Expert Chemistry Score\n\n`
  output += `${expert1Name} + ${expert2Name}\n\n`
  output += `${fireBar} ${chemistry.score}/100\n\n`

  output += 'Factors:\n'
  output += `  • Complementary perspectives: ${chemistry.factors.complementaryPerspectives}%\n`
  output += `  • Build on each other's ideas: ${chemistry.factors.buildOnIdeas}%\n`
  output += `  • Historical collaboration: ${chemistry.factors.historicalCollaboration}%\n\n`

  output += `${chemistry.description}\n`

  return output
}

/**
 * Imprime chemistry en consola
 */
export function printExpertChemistry(
  expert1: string,
  expert2: string,
  debates: DebateResult[]
): void {
  const chemistry = calculateExpertChemistry(expert1, expert2, debates)
  quoorumLogger.debug('Expert chemistry', {
    expert1,
    expert2,
    debateCount: debates.length,
    chemistry,
  })
}

// ============================================================================
// DEBATE ROI CALCULATOR
// ============================================================================

export interface DebateROI {
  debateCost: number
  decisionValue: number
  roi: number
  timeSaved: number // hours
  costPerInsight: number
  valuePerInsight: number
  insights: number
}

/**
 * Calcula ROI del debate
 */
export function calculateDebateROI(
  result: DebateResult,
  decisionValue: number,
  manualResearchHours: number = 8
): DebateROI {
  // Estimate debate cost (mock)
  const debateCost = result.rounds.length * 0.05 // $0.05 per round

  // Calculate insights
  const insights = result.rounds.flatMap((r) => r.messages).length

  const roi = decisionValue > 0 ? decisionValue / debateCost : 0
  const costPerInsight = insights > 0 ? debateCost / insights : 0
  const valuePerInsight = insights > 0 ? decisionValue / insights : 0

  return {
    debateCost,
    decisionValue,
    roi,
    timeSaved: manualResearchHours,
    costPerInsight,
    valuePerInsight,
    insights,
  }
}

/**
 * Renderiza ROI
 */
export function renderDebateROI(roi: DebateROI): string {
  let output = '\n💰 Debate ROI Calculator\n\n'

  output += `Debate Cost: $${roi.debateCost.toFixed(2)}\n`
  output += `Decision Value: $${roi.decisionValue.toLocaleString()}\n`
  output += `ROI: ${roi.roi.toLocaleString()}x\n\n`

  output += `Time saved vs manual research: ${roi.timeSaved} hours\n`
  output += `Cost per insight: $${roi.costPerInsight.toFixed(2)}\n`
  output += `Value per insight: $${roi.valuePerInsight.toLocaleString()}\n`
  output += `Total insights: ${roi.insights}\n`

  return output
}

/**
 * Imprime ROI en consola
 */
export function printDebateROI(result: DebateResult, decisionValue: number): void {
  const roi = calculateDebateROI(result, decisionValue)
  quoorumLogger.info('Debate ROI', {
    sessionId: result.sessionId,
    decisionValue,
    roi,
  })
}

// ============================================================================
// EXPERT ROAST MODE
// ============================================================================

/**
 * Genera "roast" humorístico de argumentos débiles
 */
export function roastWeakArguments(result: DebateResult): string[] {
  const roasts: string[] = []

  // Find short messages (weak arguments)
  for (const round of result.rounds) {
    for (const message of round.messages) {
      if (message.agentKey === 'meta_moderator') continue

      if (message.content.length < 100) {
        const expertName = message.agentKey
          .split('_')
          .map((w) => w[0]?.toUpperCase() + w.slice(1))
          .join(' ')
        roasts.push(
          `${expertName}'s argument is shorter than a tweet. Come on, give us something to work with! 🤷`
        )
      }

      // Find vague arguments
      const vagueWords = ['maybe', 'possibly', 'perhaps', 'might', 'could']
      const vagueness = vagueWords.filter((w) => message.content.toLowerCase().includes(w)).length
      if (vagueness >= 3) {
        const expertName = message.agentKey
          .split('_')
          .map((w) => w[0]?.toUpperCase() + w.slice(1))
          .join(' ')
        roasts.push(
          `${expertName} is playing it so safe, they're practically invisible. Commit to a position! 😴`
        )
      }

      // Find arguments without data
      const hasData = /\d+/.test(message.content)
      if (!hasData && message.content.length > 200) {
        const expertName = message.agentKey
          .split('_')
          .map((w) => w[0]?.toUpperCase() + w.slice(1))
          .join(' ')
        roasts.push(
          `${expertName} wrote a novel but forgot to include any actual numbers. Where's the data? 📊`
        )
      }
    }
  }

  return roasts.slice(0, 5) // Top 5 roasts
}

/**
 * Renderiza roasts
 */
export function renderRoasts(roasts: string[]): string {
  let output = '\n🔥 Expert Roast Mode (Humor)\n\n'

  if (roasts.length === 0) {
    output += 'No weak arguments found! Everyone brought their A-game. 💪\n'
  } else {
    for (let i = 0; i < roasts.length; i++) {
      output += `${i + 1}. ${roasts[i]}\n\n`
    }
  }

  return output
}

/**
 * Imprime roasts en consola
 */
export function printRoasts(result: DebateResult): void {
  const roasts = roastWeakArguments(result)
  quoorumLogger.debug('Debate roasts', {
    sessionId: result.sessionId,
    roastCount: roasts.length,
    roasts,
  })
}

// ============================================================================
// DEBATE BINGO
// ============================================================================

export interface BingoCard {
  squares: string[]
  marked: boolean[]
}

/**
 * Genera tarjeta de bingo para el debate
 */
export function generateDebateBingo(): BingoCard {
  const squares = [
    '"Data shows..."',
    '"In my experience..."',
    '"Let me play devil\'s advocate..."',
    '"The real question is..."',
    'Meta-moderator intervention',
    'Expert changes opinion',
    'Mention of competitors',
    'Reference to case study',
    '"It depends..."',
    'Pricing discussion',
    'ROI calculation',
    'Market size estimate',
    '"Best practice is..."',
    'Mention of A/B test',
    'Quote from book/research',
    'Disagreement on definition',
  ]

  return {
    squares,
    marked: Array<boolean>(squares.length).fill(false),
  }
}

/**
 * Marca squares del bingo basado en el debate
 */
export function markBingoSquares(card: BingoCard, result: DebateResult): BingoCard {
  const allContent = result.rounds
    .flatMap((r) => r.messages)
    .map((m) => m.content.toLowerCase())
    .join(' ')

  const marked = card.squares.map((square) => {
    const lowerSquare = square.toLowerCase()

    // Special cases
    if (square === 'Meta-moderator intervention') {
      return result.rounds.some((r) => r.messages.some((m) => m.agentKey === 'meta_moderator'))
    }

    // Check if square text appears in content
    return allContent.includes(lowerSquare.replace(/['"]/g, ''))
  })

  return { ...card, marked }
}

/**
 * Renderiza bingo card
 */
export function renderBingoCard(card: BingoCard): string {
  let output = '\n🎯 Debate Bingo\n\n'

  for (let i = 0; i < card.squares.length; i++) {
    const square = card.squares[i]!
    const isMarked = card.marked[i]
    const checkbox = isMarked ? '☑' : '☐'

    output += `${checkbox} ${square}\n`
  }

  const markedCount = card.marked.filter((m) => m).length
  output += `\n${markedCount}/${card.squares.length} squares marked\n`

  if (markedCount === card.squares.length) {
    output += '\n🎉 BINGO! All squares marked!\n'
  }

  return output
}

/**
 * Imprime bingo en consola
 */
export function printDebateBingo(result: DebateResult): void {
  const card = generateDebateBingo()
  const markedCard = markBingoSquares(card, result)
  quoorumLogger.debug('Debate bingo', {
    sessionId: result.sessionId,
    markedCard,
  })
}

// ============================================================================
// DEBATE DIFFICULTY LEVELS
// ============================================================================

export interface DifficultyLevel {
  name: string
  icon: string
  expertCount: number
  roundCount: number
  estimatedCost: number
  description: string
}

/**
 * Define niveles de dificultad del debate
 */
export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    name: 'Easy',
    icon: '🟢',
    expertCount: 3,
    roundCount: 3,
    estimatedCost: 0.1,
    description: 'Quick consensus, straightforward questions',
  },
  {
    name: 'Normal',
    icon: '🟡',
    expertCount: 5,
    roundCount: 5,
    estimatedCost: 0.25,
    description: 'Balanced debate, moderate complexity',
  },
  {
    name: 'Hard',
    icon: '🔴',
    expertCount: 7,
    roundCount: 8,
    estimatedCost: 0.5,
    description: 'Deep analysis, high complexity',
  },
  {
    name: 'Nightmare',
    icon: '⚫',
    expertCount: 10,
    roundCount: 12,
    estimatedCost: 1.0,
    description: 'Maximum depth, strategic decisions',
  },
]

/**
 * Recomienda nivel de dificultad basado en la pregunta
 */
export function recommendDifficultyLevel(complexity: number): DifficultyLevel {
  if (complexity <= 3) return DIFFICULTY_LEVELS[0]!
  if (complexity <= 6) return DIFFICULTY_LEVELS[1]!
  if (complexity <= 8) return DIFFICULTY_LEVELS[2]!
  return DIFFICULTY_LEVELS[3]!
}

/**
 * Renderiza niveles de dificultad
 */
export function renderDifficultyLevels(): string {
  let output = '\n🎮 Debate Difficulty Levels\n\n'

  for (const level of DIFFICULTY_LEVELS) {
    output += `${level.icon} ${level.name} Mode:\n`
    output += `   ${level.expertCount} experts • ${level.roundCount} rounds • $${level.estimatedCost.toFixed(2)}\n`
    output += `   ${level.description}\n\n`
  }

  return output
}

/**
 * Imprime niveles de dificultad
 */
export function printDifficultyLevels(): void {
  quoorumLogger.debug('Difficulty levels', {})
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const omgAnalytics = {
  generateDebateDNA,
  renderDebateDNA,
  printDebateDNA,
  calculateExpertChemistry,
  renderExpertChemistry,
  printExpertChemistry,
  calculateDebateROI,
  renderDebateROI,
  printDebateROI,
  roastWeakArguments,
  renderRoasts,
  printRoasts,
  generateDebateBingo,
  markBingoSquares,
  renderBingoCard,
  printDebateBingo,
  DIFFICULTY_LEVELS,
  recommendDifficultyLevel,
  renderDifficultyLevels,
  printDifficultyLevels,
}
