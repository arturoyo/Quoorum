/**
 * Quadratic Voting System
 * 
 * Sistema de votación cuadrática donde cada experto tiene puntos limitados
 * y puede "apostar fuerte" por opciones (el costo de votar crece cuadráticamente).
 * 
 * Ejemplo: Si tienes 100 puntos y quieres dar 10 puntos a una opción,
 * el costo es 10² = 100 puntos, no 10.
 */

import type { RankedOption } from '../types'
import { quoorumLogger } from '../logger'

// ============================================================================
// TYPES
// ============================================================================

export interface QuadraticVote {
  expertId: string
  expertName: string
  allocations: Map<string, number> // option -> points allocated
  totalPointsUsed: number
  totalPointsAvailable: number
}

export interface QuadraticVotingConfig {
  totalPointsPerExpert: number // Puntos totales disponibles por experto
  minPointsPerOption: number // Mínimo de puntos que se pueden asignar
  maxPointsPerOption: number // Máximo de puntos que se pueden asignar a una sola opción
  allowPartialAllocation: boolean // Si false, debe usar todos los puntos
}

export interface QuadraticVotingResult {
  rankedOptions: RankedOption[]
  votes: QuadraticVote[]
  totalVotes: number
  participationRate: number // % de expertos que votaron
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

export const DEFAULT_QUADRATIC_VOTING_CONFIG: QuadraticVotingConfig = {
  totalPointsPerExpert: 100,
  minPointsPerOption: 1,
  maxPointsPerOption: 50, // Máximo 50 puntos por opción (costo = 2500)
  allowPartialAllocation: false, // Debe usar todos los puntos
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Calcula ranking de opciones usando votación cuadrática
 * 
 * @param votes - Map de expertId -> Map de option -> points
 * @param options - Lista de opciones disponibles
 * @param config - Configuración de votación cuadrática
 */
export function calculateQuadraticVote(
  votes: Map<string, Map<string, number>>, // expertId -> (option -> points)
  options: string[],
  config: QuadraticVotingConfig = DEFAULT_QUADRATIC_VOTING_CONFIG
): QuadraticVotingResult {
  quoorumLogger.info('Calculating quadratic vote', {
    expertCount: votes.size,
    optionCount: options.length,
  })

  // Validate votes
  const validatedVotes: QuadraticVote[] = []
  for (const [expertId, allocations] of votes.entries()) {
    const vote = validateAndNormalizeVote(
      expertId,
      allocations,
      options,
      config
    )
    if (vote) {
      validatedVotes.push(vote)
    }
  }

  // Calculate quadratic scores for each option
  const optionScores = new Map<string, number>()

  for (const option of options) {
    let totalQuadraticScore = 0

    for (const vote of validatedVotes) {
      const points = vote.allocations.get(option) || 0
      // Quadratic cost: score = sqrt(points) (inverse of cost)
      // More points = higher score, but with diminishing returns
      const quadraticScore = Math.sqrt(points)
      totalQuadraticScore += quadraticScore
    }

    optionScores.set(option, totalQuadraticScore)
  }

  // Convert to ranked options
  const rankedOptions: RankedOption[] = Array.from(optionScores.entries())
    .map(([option, score]) => ({
      option,
      successRate: normalizeScore(score, optionScores), // 0-100
      score: score,
      pros: [],
      cons: [],
      supporters: validatedVotes
        .filter((v) => (v.allocations.get(option) || 0) > 0)
        .map((v) => v.expertName),
      confidence: calculateConfidence(validatedVotes, option),
      reasoning: `Votación cuadrática: ${score.toFixed(2)} puntos cuadráticos de ${validatedVotes.length} expertos`,
    }))
    .sort((a, b) => b.successRate - a.successRate)

  const participationRate =
    validatedVotes.length > 0 ? validatedVotes.length / votes.size : 0

  return {
    rankedOptions,
    votes: validatedVotes,
    totalVotes: validatedVotes.length,
    participationRate,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Valida y normaliza un voto individual
 */
function validateAndNormalizeVote(
  expertId: string,
  allocations: Map<string, number>,
  options: string[],
  config: QuadraticVotingConfig
): QuadraticVote | null {
  let totalPointsUsed = 0
  const normalizedAllocations = new Map<string, number>()

  // Validate each allocation
  for (const [option, points] of allocations.entries()) {
    if (!options.includes(option)) {
      quoorumLogger.warn('Invalid option in vote', { expertId, option })
      continue
    }

    if (points < config.minPointsPerOption) {
      quoorumLogger.warn('Points below minimum', {
        expertId,
        option,
        points,
        min: config.minPointsPerOption,
      })
      continue
    }

    if (points > config.maxPointsPerOption) {
      quoorumLogger.warn('Points above maximum, capping', {
        expertId,
        option,
        points,
        max: config.maxPointsPerOption,
      })
      normalizedAllocations.set(option, config.maxPointsPerOption)
      totalPointsUsed += config.maxPointsPerOption * config.maxPointsPerOption // Quadratic cost
    } else {
      normalizedAllocations.set(option, points)
      totalPointsUsed += points * points // Quadratic cost
    }
  }

  // Check if total points used exceeds available
  if (totalPointsUsed > config.totalPointsPerExpert * config.totalPointsPerExpert) {
    quoorumLogger.warn('Total points exceed available, scaling down', {
      expertId,
      totalPointsUsed,
      available: config.totalPointsPerExpert * config.totalPointsPerExpert,
    })

    // Scale down proportionally
    const scaleFactor =
      (config.totalPointsPerExpert * config.totalPointsPerExpert) / totalPointsUsed
    const scaledAllocations = new Map<string, number>()

    for (const [option, points] of normalizedAllocations.entries()) {
      const scaledPoints = Math.floor(points * scaleFactor)
      if (scaledPoints >= config.minPointsPerOption) {
        scaledAllocations.set(option, scaledPoints)
      }
    }

    normalizedAllocations.clear()
    for (const [option, points] of scaledAllocations.entries()) {
      normalizedAllocations.set(option, points)
    }

    // Recalculate total
    totalPointsUsed = 0
    for (const points of normalizedAllocations.values()) {
      totalPointsUsed += points * points
    }
  }

  // Check if must use all points
  if (!config.allowPartialAllocation) {
    const availablePoints = config.totalPointsPerExpert * config.totalPointsPerExpert
    if (totalPointsUsed < availablePoints * 0.9) {
      // Less than 90% used, warn but allow
      quoorumLogger.warn('Vote uses less than 90% of available points', {
        expertId,
        totalPointsUsed,
        availablePoints,
      })
    }
  }

  return {
    expertId,
    expertName: expertId, // In production, lookup expert name
    allocations: normalizedAllocations,
    totalPointsUsed,
    totalPointsAvailable: config.totalPointsPerExpert * config.totalPointsPerExpert,
  }
}

/**
 * Normaliza score a rango 0-100
 */
function normalizeScore(score: number, allScores: Map<string, number>): number {
  const scores = Array.from(allScores.values())
  const maxScore = Math.max(...scores, 1) // Avoid division by zero
  const minScore = Math.min(...scores, 0)

  if (maxScore === minScore) return 100

  return ((score - minScore) / (maxScore - minScore)) * 100
}

/**
 * Calcula confianza basada en participación y distribución de votos
 */
function calculateConfidence(
  votes: QuadraticVote[],
  option: string
): number {
  if (votes.length === 0) return 0

  const votersForOption = votes.filter(
    (v) => (v.allocations.get(option) || 0) > 0
  ).length

  const participationRate = votersForOption / votes.length

  // Calculate variance in allocations (lower variance = higher confidence)
  const allocations = votes
    .map((v) => v.allocations.get(option) || 0)
    .filter((p) => p > 0)

  if (allocations.length === 0) return 0

  const mean = allocations.reduce((a, b) => a + b, 0) / allocations.length
  const variance =
    allocations.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) /
    allocations.length

  // Confidence combines participation and consistency
  const participationWeight = 0.6
  const consistencyWeight = 0.4
  const consistency = Math.max(0, 1 - variance / (mean * mean + 1)) // Normalized variance

  return participationRate * participationWeight + consistency * consistencyWeight
}

// ============================================================================
// POINTS-BASED VOTING (Alternative)
// ============================================================================

/**
 * Votación por puntos simple (no cuadrática)
 * Cada experto asigna puntos directamente sin costo cuadrático
 */
export function calculatePointsVote(
  votes: Map<string, Map<string, number>>, // expertId -> (option -> points)
  options: string[],
  totalPointsPerExpert: number = 100
): RankedOption[] {
  const optionScores = new Map<string, number>()

  for (const option of options) {
    let totalScore = 0
    let voterCount = 0

    for (const [expertId, allocations] of votes.entries()) {
      const points = allocations.get(option) || 0
      if (points > 0) {
        totalScore += points
        voterCount++
      }
    }

    // Average score weighted by participation
    const avgScore = voterCount > 0 ? totalScore / voterCount : 0
    optionScores.set(option, avgScore)
  }

  // Normalize to 0-100
  const maxScore = Math.max(...Array.from(optionScores.values()), 1)
  const normalizedScores = new Map<string, number>()

  for (const [option, score] of optionScores.entries()) {
    normalizedScores.set(option, (score / maxScore) * 100)
  }

  return Array.from(normalizedScores.entries())
    .map(([option, successRate]) => ({
      option,
      successRate,
      score: successRate,
      pros: [],
      cons: [],
      supporters: [],
      confidence: 0.7, // Default confidence for points voting
      reasoning: `Votación por puntos: ${successRate.toFixed(1)}%`,
    }))
    .sort((a, b) => b.successRate - a.successRate)
}
