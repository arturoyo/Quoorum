/**
 * Test script para verificar runDebate() end-to-end
 *
 * Ejecutar: tsx packages/forum/test-runDebate.ts
 */

import { runDebate } from './src/runner-dynamic.ts'
import type { LoadedContext } from './src/types.ts'

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

async function testRunDebate() {
  log('\n🧪 TEST: runDebate() end-to-end\n', colors.cyan)

  const testQuestion = '¿Debería Wallie subir precios?'
  const testContext: LoadedContext = {
    sources: [
      {
        type: 'manual',
        content: 'Wallie es un CRM de WhatsApp con IA. Precio actual: 29€/mes. Competidores: HubSpot, Pipedrive.',
      },
    ],
    combinedContext: 'Wallie es un CRM de WhatsApp con IA. Precio actual: 29€/mes.',
  }

  log(`📝 Pregunta: "${testQuestion}"`, colors.yellow)
  log(`📄 Contexto: ${testContext.combinedContext}\n`)

  try {
    log('⏳ Ejecutando runDebate()...', colors.yellow)

    const startTime = Date.now()

    const result = await runDebate({
      sessionId: `test-${Date.now()}`,
      question: testQuestion,
      context: testContext,
      forceMode: 'static', // Forzar modo estático para test simple
      onRoundComplete: async (round) => {
        log(`  ✅ Round ${round.round} completado con ${round.messages.length} mensajes`, colors.green)
      },
      onMessageGenerated: async (message) => {
        log(`    → ${message.agentName}: ${message.content.substring(0, 50)}...`, colors.reset)
      },
    })

    const duration = Date.now() - startTime

    log('\n✅ runDebate() COMPLETADO!', colors.green)
    log(`\n📊 Resultados:`, colors.cyan)
    log(`  - Status: ${result.status}`)
    log(`  - Rounds: ${result.totalRounds}`)
    log(`  - Consensus: ${(result.consensusScore * 100).toFixed(1)}%`)
    log(`  - Cost: $${result.totalCostUsd.toFixed(4)}`)
    log(`  - Duration: ${duration}ms`)

    if (result.finalRanking.length > 0) {
      log(`\n🏆 Top Options:`, colors.yellow)
      for (const option of result.finalRanking.slice(0, 3)) {
        log(`  - ${option.option}: ${option.successRate}%`)
      }
    }

    log('\n✅ TEST PASSED\n', colors.green)
    return true
  } catch (error) {
    log('\n❌ runDebate() FALLÓ!', colors.red)
    log(`\nError: ${error instanceof Error ? error.message : String(error)}`, colors.red)

    if (error instanceof Error && error.stack) {
      log('\nStack trace:', colors.yellow)
      log(error.stack, colors.reset)
    }

    log('\n❌ TEST FAILED - NECESITA FIX\n', colors.red)
    return false
  }
}

// Ejecutar test
testRunDebate()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
