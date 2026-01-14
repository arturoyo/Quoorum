/**
 * Test script para verificar meta-moderator.ts funciona correctamente
 *
 * Ejecutar: tsx packages/quoorum/test-metaModerator.ts
 */

import {
  shouldIntervene,
  generateIntervention,
  generateMultipleInterventions,
  getInterventionFrequency,
  summarizeIntervention,
  wasInterventionEffective,
} from './src/meta-moderator.ts'
import type { QualityAnalysis, QualityIssue } from './src/quality-monitor.ts'

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

// Helper para crear QualityAnalysis mock
function createQualityAnalysis(opts: {
  overallQuality: number
  depthScore: number
  diversityScore: number
  originalityScore: number
  issues?: QualityIssue[]
  needsModeration?: boolean
}): QualityAnalysis {
  return {
    overallQuality: opts.overallQuality,
    depthScore: opts.depthScore,
    diversityScore: opts.diversityScore,
    originalityScore: opts.originalityScore,
    issues: opts.issues ?? [],
    recommendations: [],
    needsModeration: opts.needsModeration ?? opts.overallQuality < 60,
  }
}

async function testMetaModerator() {
  log('\n=== TEST: Meta-Moderator ===\n', colors.cyan)

  let passedTests = 0
  let totalTests = 0

  // Test 1: shouldIntervene returns true when needsModeration
  totalTests++
  log('Test 1: shouldIntervene detecta necesidad de moderacion...', colors.yellow)
  try {
    const lowQualityAnalysis = createQualityAnalysis({
      overallQuality: 40,
      depthScore: 30,
      diversityScore: 50,
      originalityScore: 40,
      needsModeration: true,
    })

    const highQualityAnalysis = createQualityAnalysis({
      overallQuality: 85,
      depthScore: 80,
      diversityScore: 90,
      originalityScore: 85,
      needsModeration: false,
    })

    const shouldInterveneLow = shouldIntervene(lowQualityAnalysis)
    const shouldInterveneHigh = shouldIntervene(highQualityAnalysis)

    log(`  Baja calidad (40/100): shouldIntervene = ${shouldInterveneLow}`)
    log(`  Alta calidad (85/100): shouldIntervene = ${shouldInterveneHigh}`)

    if (shouldInterveneLow && !shouldInterveneHigh) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: shouldIntervene no funciona correctamente', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 2: generateIntervention for shallow issue
  totalTests++
  log('\nTest 2: generateIntervention para issue shallow...', colors.yellow)
  try {
    const analysisWithShallow = createQualityAnalysis({
      overallQuality: 45,
      depthScore: 25,
      diversityScore: 60,
      originalityScore: 50,
      issues: [
        {
          type: 'shallow',
          severity: 8,
          description: 'Mensajes carecen de profundidad',
          affectedMessages: [0, 1, 2],
        },
      ],
      needsModeration: true,
    })

    const intervention = generateIntervention(analysisWithShallow)

    log(`  Type: ${intervention.type}`)
    log(`  Severity: ${intervention.severity}`)
    log(`  Prompt includes 'profundidad': ${intervention.prompt.includes('profundidad')}`)

    if (intervention.type === 'challenge_depth' && intervention.severity === 8) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: Intervencion incorrecta para shallow issue', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 3: generateIntervention for repetitive issue
  totalTests++
  log('\nTest 3: generateIntervention para issue repetitive...', colors.yellow)
  try {
    const analysisWithRepetitive = createQualityAnalysis({
      overallQuality: 50,
      depthScore: 60,
      diversityScore: 60,
      originalityScore: 30,
      issues: [
        {
          type: 'repetitive',
          severity: 6,
          description: 'Mensajes repiten conceptos',
          affectedMessages: [2, 3, 4],
        },
      ],
      needsModeration: true,
    })

    const intervention = generateIntervention(analysisWithRepetitive)

    log(`  Type: ${intervention.type}`)
    log(`  Prompt includes 'NUEVAS': ${intervention.prompt.includes('NUEVAS')}`)

    if (intervention.type === 'explore_alternatives') {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: Intervencion incorrecta para repetitive issue', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 4: generateMultipleInterventions
  totalTests++
  log('\nTest 4: generateMultipleInterventions para issues multiples...', colors.yellow)
  try {
    const analysisWithMultipleIssues = createQualityAnalysis({
      overallQuality: 35,
      depthScore: 20,
      diversityScore: 30,
      originalityScore: 25,
      issues: [
        {
          type: 'shallow',
          severity: 8,
          description: 'Mensajes superficiales',
          affectedMessages: [0, 1],
        },
        {
          type: 'lack_of_diversity',
          severity: 7,
          description: 'Falta diversidad',
          affectedMessages: [],
        },
        {
          type: 'repetitive',
          severity: 5,
          description: 'Contenido repetitivo',
          affectedMessages: [2, 3],
        },
      ],
      needsModeration: true,
    })

    const interventions = generateMultipleInterventions(analysisWithMultipleIssues, 2)

    log(`  Interventions generadas: ${interventions.length}`)
    log(`  Types: ${interventions.map(i => i.type).join(', ')}`)

    // Should get interventions for the 2 most severe issues (severity 8 and 7)
    if (interventions.length === 2 && interventions[0]!.severity >= interventions[1]!.severity) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: No genera intervenciones multiples correctamente', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 5: getInterventionFrequency
  totalTests++
  log('\nTest 5: getInterventionFrequency segun calidad...', colors.yellow)
  try {
    const highQuality = createQualityAnalysis({ overallQuality: 85, depthScore: 80, diversityScore: 90, originalityScore: 85 })
    const mediumQuality = createQualityAnalysis({ overallQuality: 70, depthScore: 65, diversityScore: 75, originalityScore: 70 })
    const lowQuality = createQualityAnalysis({ overallQuality: 45, depthScore: 40, diversityScore: 50, originalityScore: 45 })

    const highFreq = getInterventionFrequency(highQuality)
    const mediumFreq = getInterventionFrequency(mediumQuality)
    const lowFreq = getInterventionFrequency(lowQuality)

    log(`  Alta calidad (85): cada ${highFreq} rondas`)
    log(`  Media calidad (70): cada ${mediumFreq} rondas`)
    log(`  Baja calidad (45): cada ${lowFreq} rondas`)

    if (highFreq === 5 && mediumFreq === 3 && lowFreq === 2) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: Frecuencias incorrectas', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 6: wasInterventionEffective
  totalTests++
  log('\nTest 6: wasInterventionEffective detecta mejora...', colors.yellow)
  try {
    const before = createQualityAnalysis({ overallQuality: 40, depthScore: 30, diversityScore: 50, originalityScore: 40 })
    const afterImproved = createQualityAnalysis({ overallQuality: 70, depthScore: 65, diversityScore: 75, originalityScore: 70 })
    const afterSame = createQualityAnalysis({ overallQuality: 42, depthScore: 32, diversityScore: 52, originalityScore: 42 })

    const wasEffectiveImproved = wasInterventionEffective(before, afterImproved)
    const wasEffectiveSame = wasInterventionEffective(before, afterSame)

    log(`  Mejora significativa: ${wasEffectiveImproved}`)
    log(`  Sin mejora: ${wasEffectiveSame}`)

    if (wasEffectiveImproved && !wasEffectiveSame) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: wasInterventionEffective no detecta correctamente', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 7: summarizeIntervention format
  totalTests++
  log('\nTest 7: summarizeIntervention format...', colors.yellow)
  try {
    const analysisWithIssue = createQualityAnalysis({
      overallQuality: 45,
      depthScore: 30,
      diversityScore: 50,
      originalityScore: 40,
      issues: [{ type: 'shallow', severity: 8, description: 'Test', affectedMessages: [] }],
      needsModeration: true,
    })

    const intervention = generateIntervention(analysisWithIssue)
    const summary = summarizeIntervention(intervention)

    log(`  Summary: ${summary}`)

    if (summary.includes('Intervención:') && summary.includes('Severidad:') && summary.includes('Razón:')) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: Summary format incorrecto', colors.red)
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
testMetaModerator()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
