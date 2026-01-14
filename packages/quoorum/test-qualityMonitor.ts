/**
 * Test script para verificar quality-monitor.ts funciona correctamente
 *
 * Ejecutar: tsx packages/quoorum/test-qualityMonitor.ts
 */

import { analyzeDebateQuality, detectPrematureConsensus, summarizeQuality } from './src/quality-monitor.ts'
import type { DebateMessage } from './src/types.ts'

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

// Helper para crear mensajes mock
function createMessage(content: string, agentKey: string, round: number): DebateMessage {
  return {
    id: crypto.randomUUID(),
    sessionId: 'test-session',
    round,
    agentKey,
    agentName: agentKey,
    content,
    isCompressed: false,
    tokensUsed: content.length / 4,
    costUsd: 0.001,
    createdAt: new Date(),
  }
}

async function testQualityMonitor() {
  log('\n=== TEST: Quality Monitor ===\n', colors.cyan)

  let passedTests = 0
  let totalTests = 0

  // Test 1: Debate de alta calidad
  totalTests++
  log('Test 1: Debate de alta calidad...', colors.yellow)
  try {
    const highQualityMessages: DebateMessage[] = [
      createMessage(
        'El precio de 49 euros representa un 70% de incremento versus el actual. Los datos muestran que el churn rate en SaaS es 25% cuando el precio sube mas del 50%. Por ejemplo, Slack perdio 15% de usuarios SMB al subir precios.',
        'analyst',
        1
      ),
      createMessage(
        'Debemos considerar el riesgo de perder early adopters. Sin embargo, los beneficios incluyen mayor margen y mejor calidad de cliente. El LTV/CAC mejora porque los clientes que pagan mas tienen menor churn.',
        'critic',
        1
      ),
      createMessage(
        'Desde la perspectiva del cliente, el valor percibido debe justificar el aumento. Propongo un A/B test con 10% de nuevos signups. Los datos de conversion nos diran si el mercado acepta 49 euros.',
        'optimizer',
        1
      ),
      createMessage(
        'En contraste con la opcion de subir a todos, podemos ofrecer grandfathering a clientes actuales. Esto reduce el riesgo de churn porque mantiene la confianza. Empresas como Netflix y Spotify usan esta estrategia.',
        'synthesizer',
        1
      ),
    ]

    const analysis = analyzeDebateQuality(highQualityMessages)
    log(`  Overall Quality: ${analysis.overallQuality}/100`)
    log(`  Depth: ${analysis.depthScore}, Diversity: ${analysis.diversityScore}, Originality: ${analysis.originalityScore}`)
    log(`  Issues: ${analysis.issues.length}`)
    log(`  Summary: ${summarizeQuality(analysis)}`)

    if (analysis.overallQuality >= 60 && analysis.issues.length <= 2) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: Calidad esperada >= 60', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 2: Debate de baja calidad (mensajes superficiales)
  totalTests++
  log('\nTest 2: Debate de baja calidad (superficial)...', colors.yellow)
  try {
    const lowQualityMessages: DebateMessage[] = [
      createMessage('Ok', 'agent1', 1),
      createMessage('Si', 'agent2', 1),
      createMessage('De acuerdo', 'agent3', 1),
      createMessage('Bien', 'agent4', 1),
    ]

    const analysis = analyzeDebateQuality(lowQualityMessages)
    log(`  Overall Quality: ${analysis.overallQuality}/100`)
    log(`  Needs Moderation: ${analysis.needsModeration}`)
    log(`  Issues: ${analysis.issues.map(i => i.type).join(', ')}`)

    if (analysis.overallQuality < 60 && analysis.needsModeration) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: Deberia detectar baja calidad', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 3: Detectar mensajes repetitivos
  totalTests++
  log('\nTest 3: Detectar repeticion...', colors.yellow)
  try {
    const repetitiveMessages: DebateMessage[] = [
      createMessage('El precio debe subir porque el valor es mayor', 'agent1', 1),
      createMessage('El precio debe subir porque el valor es mayor', 'agent2', 1),
      createMessage('El precio debe subir porque el valor es mayor', 'agent3', 1),
      createMessage('El precio debe subir porque el valor es mayor', 'agent4', 1),
    ]

    const analysis = analyzeDebateQuality(repetitiveMessages)
    log(`  Originality Score: ${analysis.originalityScore}/100`)
    log(`  Issues: ${analysis.issues.map(i => i.type).join(', ')}`)

    const hasRepetitiveIssue = analysis.issues.some(i => i.type === 'repetitive')
    if (hasRepetitiveIssue || analysis.originalityScore < 50) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: Deberia detectar repeticion', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 4: Detectar consenso prematuro
  totalTests++
  log('\nTest 4: Detectar consenso prematuro...', colors.yellow)
  try {
    const earlyConsensusMessages: DebateMessage[] = [
      createMessage('De acuerdo con subir el precio', 'agent1', 1),
      createMessage('Exacto, coincido totalmente', 'agent2', 1),
      createMessage('Si, apoyo la propuesta', 'agent3', 1),
      createMessage('Correcto, debemos proceder', 'agent4', 1),
    ]

    const isPremature = detectPrematureConsensus(earlyConsensusMessages, 1)
    log(`  Consenso Prematuro: ${isPremature}`)

    if (isPremature) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: Deberia detectar consenso prematuro', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 5: Pocos mensajes no generan issues
  totalTests++
  log('\nTest 5: Menos de 3 mensajes no genera issues...', colors.yellow)
  try {
    const fewMessages: DebateMessage[] = [
      createMessage('Primer mensaje', 'agent1', 1),
      createMessage('Segundo mensaje', 'agent2', 1),
    ]

    const analysis = analyzeDebateQuality(fewMessages)
    log(`  Overall Quality: ${analysis.overallQuality}/100`)
    log(`  Issues: ${analysis.issues.length}`)

    if (analysis.overallQuality === 100 && analysis.issues.length === 0) {
      passedTests++
      log('  PASS', colors.green)
    } else {
      log('  FAIL: No deberia analizar con pocos mensajes', colors.red)
    }
  } catch (error) {
    log(`  FAIL: ${error instanceof Error ? error.message : String(error)}`, colors.red)
  }

  // Test 6: summarizeQuality returns correct format
  totalTests++
  log('\nTest 6: summarizeQuality format...', colors.yellow)
  try {
    const messages: DebateMessage[] = [
      createMessage('Analisis con datos del 50% y comparacion versus competencia', 'agent1', 1),
      createMessage('El riesgo es alto porque implica cambio de modelo de negocio', 'agent2', 1),
      createMessage('Por ejemplo, empresas como Slack han tenido exito con esta estrategia', 'agent3', 1),
    ]

    const analysis = analyzeDebateQuality(messages)
    const summary = summarizeQuality(analysis)

    log(`  Summary: ${summary}`)

    if (summary.includes('Calidad:') && summary.includes('Profundidad:') && summary.includes('Diversidad:')) {
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
testQualityMonitor()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
