/**
 * Test script para verificar learning-system.ts funciona correctamente
 *
 * Ejecutar: tsx packages/quoorum/test-learningSystem.ts
 */

import {
  updateExpertPerformance,
  getExpertPerformance,
  getLearningInsights,
  calculateChemistry,
  recommendExpertCombination,
  adjustMatchingScores,
  identifySpecializations,
  analyzeABTest,
} from './src/learning-system.ts'
import type { ExpertPerformanceMetrics, ABTestConfig } from './src/learning-system.ts'
import type { DebateResult } from './src/types.ts'

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

// Helper para crear DebateResult mock
function createDebateResult(opts: {
  sessionId?: string
  quality?: number
  consensus?: number
  expertIds?: string[]
  rounds?: number
}): DebateResult {
  const expertIds = opts.expertIds ?? ['expert1', 'expert2']

  return {
    sessionId: opts.sessionId ?? 'test-session',
    status: 'completed',
    rounds: Array.from({ length: opts.rounds ?? 2 }, (_, i) => ({
      roundNumber: i + 1,
      messages: expertIds.map(id => ({
        expert: id,
        content: `Message from ${id} in round ${i + 1}. This is a detailed message with some content.`,
      })),
      quality: opts.quality ?? 75,
    })),
    finalRanking: [],
    totalCostUsd: 0.01,
    totalRounds: opts.rounds ?? 2,
    consensusScore: opts.consensus ?? 60,
    qualityMetrics: {
      depth: opts.quality ?? 75,
      diversity: 70,
      originality: 65,
    },
    experts: expertIds.map(id => ({
      id,
      name: id,
      specializations: ['pricing', 'strategy'],
    })),
  }
}

async function testLearningSystem() {
  log('\n=== TEST: Learning System ===\n', colors.cyan)

  let passedTests = 0
  let totalTests = 0

  // Test 1: getExpertPerformance returns default metrics
  totalTests++
  log('Test 1: getExpertPerformance returns default metrics...', colors.yellow)
  try {
    const metrics = await getExpertPerformance('test-expert')

    log(`  Expert ID: ${metrics?.expertId}`)
    log(`  Total Debates: ${metrics?.totalDebates}`)
    log(`  Has lastUpdated: ${metrics?.lastUpdated instanceof Date}`)

    if (metrics && metrics.expertId === 'test-expert' && metrics.totalDebates === 0) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: Should return default metrics', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 2: updateExpertPerformance doesn't throw
  totalTests++
  log('\nTest 2: updateExpertPerformance executes without error...', colors.yellow)
  try {
    const debate = createDebateResult({ quality: 80, consensus: 70, expertIds: ['expert1', 'expert2'] })

    await updateExpertPerformance('expert1', debate, true)

    passedTests++
    log('  PASS', colors.green)
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 3: getLearningInsights returns expected structure
  totalTests++
  log('\nTest 3: getLearningInsights returns insights structure...', colors.yellow)
  try {
    const insights = await getLearningInsights()

    log(`  Top Experts count: ${insights.topExperts.length}`)
    log(`  Best Combinations count: ${insights.bestCombinations.length}`)
    log(`  Recommendations count: ${insights.recommendations.length}`)

    if (
      Array.isArray(insights.topExperts) &&
      Array.isArray(insights.bestCombinations) &&
      insights.recommendations.length > 0
    ) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: Insights structure incorrect', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 4: calculateChemistry with no joint debates
  totalTests++
  log('\nTest 4: calculateChemistry returns neutral for no joint debates...', colors.yellow)
  try {
    const debates: DebateResult[] = [
      createDebateResult({ expertIds: ['expert1', 'expert3'] }),
      createDebateResult({ expertIds: ['expert2', 'expert4'] }),
    ]

    const chemistry = calculateChemistry('expert1', 'expert2', debates)

    log(`  Chemistry score (no joint): ${chemistry}`)

    if (chemistry === 50) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: Should return 50 for no joint debates', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 5: calculateChemistry with joint debates
  totalTests++
  log('\nTest 5: calculateChemistry calculates from joint debates...', colors.yellow)
  try {
    const debates: DebateResult[] = [
      createDebateResult({ quality: 80, expertIds: ['expert1', 'expert2'] }),
      createDebateResult({ quality: 90, expertIds: ['expert1', 'expert2'] }),
    ]

    const chemistry = calculateChemistry('expert1', 'expert2', debates)

    log(`  Chemistry score (joint): ${chemistry}`)

    // Should be average of 80 and 90 = 85
    if (chemistry === 85) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log(`  FAIL: Expected 85, got ${chemistry}`, colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 6: recommendExpertCombination
  totalTests++
  log('\nTest 6: recommendExpertCombination returns experts...', colors.yellow)
  try {
    const recommended = await recommendExpertCombination(['pricing', 'positioning', 'growth'], 4)

    log(`  Recommended experts: ${recommended.join(', ')}`)
    log(`  Includes the-critic: ${recommended.includes('the-critic')}`)

    if (
      recommended.includes('the-critic') &&
      recommended.includes('patrick-campbell') &&
      recommended.length <= 4
    ) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: Should include the-critic and domain experts', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 7: adjustMatchingScores without performance data
  totalTests++
  log('\nTest 7: adjustMatchingScores without performance keeps base scores...', colors.yellow)
  try {
    const baseScores = { expert1: 50, expert2: 60, expert3: 70 }
    const performance: Record<string, ExpertPerformanceMetrics> = {}

    const adjusted = adjustMatchingScores(baseScores, performance)

    log(`  Adjusted scores: ${JSON.stringify(adjusted)}`)

    if (adjusted.expert1 === 50 && adjusted.expert2 === 60 && adjusted.expert3 === 70) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: Should keep base scores without performance data', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 8: adjustMatchingScores with performance data
  totalTests++
  log('\nTest 8: adjustMatchingScores boosts with performance data...', colors.yellow)
  try {
    const baseScores = { expert1: 50 }
    const performance: Record<string, ExpertPerformanceMetrics> = {
      expert1: {
        expertId: 'expert1',
        totalDebates: 10,
        avgQualityScore: 100, // Max quality -> +20 boost
        avgConsensusScore: 80,
        avgDepthContribution: 500,
        winRate: 1.0, // 100% win rate -> +10 boost
        chemistryScores: {},
        specializations: [],
        lastUpdated: new Date(),
      },
    }

    const adjusted = adjustMatchingScores(baseScores, performance)

    log(`  Base score: 50`)
    log(`  Adjusted score: ${adjusted.expert1}`)

    // 50 base + 20 (quality 100%) + 10 (win rate 100%) = 80
    if (adjusted.expert1 === 80) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log(`  FAIL: Expected 80, got ${adjusted.expert1}`, colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 9: identifySpecializations returns array
  totalTests++
  log('\nTest 9: identifySpecializations returns array (placeholder)...', colors.yellow)
  try {
    const specializations = await identifySpecializations('test-expert')

    log(`  Specializations: ${JSON.stringify(specializations)}`)

    if (Array.isArray(specializations)) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: Should return array', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 10: analyzeABTest with insufficient data
  totalTests++
  log('\nTest 10: analyzeABTest returns inconclusive with little data...', colors.yellow)
  try {
    const config: ABTestConfig = {
      variantA: ['expert1'],
      variantB: ['expert2'],
      metric: 'quality',
      sampleSize: 100,
      currentResults: {
        variantA: { count: 5, avgMetric: 80 },
        variantB: { count: 5, avgMetric: 70 },
      },
    }

    const result = analyzeABTest(config)

    log(`  Winner: ${result.winner}`)
    log(`  Recommendation: ${result.recommendation}`)

    if (result.winner === 'inconclusive') {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: Should be inconclusive with <10 samples', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 11: analyzeABTest with sufficient data
  totalTests++
  log('\nTest 11: analyzeABTest determines winner with sufficient data...', colors.yellow)
  try {
    const config: ABTestConfig = {
      variantA: ['expert1'],
      variantB: ['expert2'],
      metric: 'quality',
      sampleSize: 100,
      currentResults: {
        variantA: { count: 20, avgMetric: 90 },
        variantB: { count: 20, avgMetric: 70 },
      },
    }

    const result = analyzeABTest(config)

    log(`  Winner: ${result.winner}`)
    log(`  Confidence: ${result.confidence}%`)
    log(`  Recommendation: ${result.recommendation}`)

    if (result.winner === 'A' && result.confidence > 0) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: Should determine A as winner', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 12: analyzeABTest with small difference
  totalTests++
  log('\nTest 12: analyzeABTest inconclusive with <5% difference...', colors.yellow)
  try {
    const config: ABTestConfig = {
      variantA: ['expert1'],
      variantB: ['expert2'],
      metric: 'quality',
      sampleSize: 100,
      currentResults: {
        variantA: { count: 20, avgMetric: 80 },
        variantB: { count: 20, avgMetric: 78 }, // Only 2.5% difference
      },
    }

    const result = analyzeABTest(config)

    log(`  Winner: ${result.winner}`)
    log(`  Recommendation: ${result.recommendation}`)

    if (result.winner === 'inconclusive') {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: Should be inconclusive with <5% difference', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Final results
  log('\n=== RESULTADOS ===', colors.cyan)
  log(`Tests pasados: ${passedTests}/${totalTests}`)

  if (passedTests === totalTests) {
    log('\nTODOS LOS TESTS PASARON', colors.green)
    return true
  } else {
    log(`\n${totalTests - passedTests} TESTS FALLARON`, colors.red)
    return false
  }
}

// Ejecutar tests
testLearningSystem()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
