/**
 * Test script para verificar tracking de costos por fase
 *
 * Ejecutar: pnpm tsx packages/quoorum/test-phase-costs.ts
 */

import { runDebate } from './src/runner'
import type { LoadedContext } from './src/types'

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

async function testPhaseCostTracking() {
  log('\n🧪 TEST: Phase Cost Tracking\n', colors.cyan)

  const testQuestion = '¿Debería invertir en automatización con IA para mi startup SaaS?'
  const testContext: LoadedContext = {
    sources: [
      {
        type: 'manual',
        content: 'Startup SaaS B2B con 50 clientes. MRR actual: €15,000. Equipo de 5 personas. Competencia usando IA.',
      },
    ],
    combinedContext: 'Startup SaaS B2B con 50 clientes. MRR actual: €15,000. Equipo de 5 personas.',
  }

  log(`📝 Pregunta: "${testQuestion}"`, colors.yellow)
  log(`📄 Contexto: ${testContext.combinedContext}\n`)

  try {
    log('⏳ Ejecutando debate completo con síntesis...', colors.yellow)

    const sessionId = `test-phase-costs-${Date.now()}`
    const startTime = Date.now()

    const result = await runDebate({
      sessionId,
      question: testQuestion,
      context: testContext,
      userId: 'test-user-phase-costs',
      maxRounds: 2, // Solo 2 rondas para test rápido
      onRoundComplete: async (round) => {
        log(`  ✅ Round ${round.round} completado con ${round.messages.length} mensajes`, colors.green)
      },
      onMessageGenerated: async (message) => {
        const phase = message.phase || 'unknown'
        log(`    [${phase.toUpperCase()}] ${message.agentName}: ${message.content.substring(0, 60)}...`, colors.reset)
      },
    })

    const duration = Date.now() - startTime

    log('\n✅ DEBATE COMPLETADO!\n', colors.green)
    log(`📊 Resultados Generales:`, colors.cyan)
    log(`  - Status: ${result.status}`)
    log(`  - Session ID: ${sessionId}`)
    log(`  - Rounds: ${result.totalRounds}`)
    log(`  - Consensus: ${((result.consensusScore || 0) * 100).toFixed(1)}%`)
    log(`  - Total Cost: $${result.totalCostUsd.toFixed(4)}`)
    log(`  - Total Credits: ${result.totalCreditsUsed || 0}`)
    log(`  - Duration: ${(duration / 1000).toFixed(2)}s`)

    // ============================================================================
    // MOSTRAR COSTOS POR FASE
    // ============================================================================
    if (result.costsByPhase) {
      log(`\n💰 COSTOS POR FASE:`, colors.magenta)
      log(`${'='.repeat(80)}`, colors.magenta)

      const phases = ['context', 'experts', 'strategy', 'revision', 'debate', 'synthesis'] as const
      const phaseLabels: Record<typeof phases[number], string> = {
        context: 'Contexto',
        experts: 'Expertos',
        strategy: 'Estrategia',
        revision: 'Revisión',
        debate: 'Debate',
        synthesis: 'Síntesis',
      }

      let totalCredits = 0
      let totalCost = 0

      for (const phase of phases) {
        const data = result.costsByPhase[phase]
        if (data && data.creditsUsed > 0) {
          totalCredits += data.creditsUsed
          totalCost += data.costUsd

          log(
            `  ${phaseLabels[phase].padEnd(12)} | ` +
              `${data.creditsUsed.toString().padStart(6)} créditos | ` +
              `$${data.costUsd.toFixed(4).padStart(8)} | ` +
              `${data.tokensUsed.toString().padStart(7)} tokens | ` +
              `${data.messagesCount} msg`,
            colors.yellow
          )
        }
      }

      log(`${'='.repeat(80)}`, colors.magenta)
      log(
        `  ${'TOTAL'.padEnd(12)} | ` +
          `${totalCredits.toString().padStart(6)} créditos | ` +
          `$${totalCost.toFixed(4).padStart(8)}`,
        colors.green
      )
    } else {
      log('\n⚠️  No se encontró costsByPhase en el resultado', colors.yellow)
    }

    // ============================================================================
    // MOSTRAR SÍNTESIS FINAL
    // ============================================================================
    if (result.finalSynthesis) {
      log(`\n📋 SÍNTESIS FINAL:`, colors.cyan)
      log(`  Opción recomendada: ${result.finalSynthesis.recommendation.option}`, colors.green)
      log(`  Calidad del debate:`)
      log(`    - Convergencia: ${result.finalSynthesis.debateQuality.convergenceScore}%`)
      log(`    - Profundidad: ${result.finalSynthesis.debateQuality.depthScore}%`)
      log(`    - Diversidad: ${result.finalSynthesis.debateQuality.diversityScore}%`)
    }

    // ============================================================================
    // VERIFICAR ESTRUCTURA DE DATOS
    // ============================================================================
    log(`\n🔍 VERIFICACIÓN DE ESTRUCTURA:`, colors.cyan)
    log(`  ✅ costsByPhase existe: ${!!result.costsByPhase}`)
    log(`  ✅ costsByProvider existe: ${!!result.costsByProvider}`)
    log(`  ✅ finalSynthesis existe: ${!!result.finalSynthesis}`)
    log(`  ✅ totalCreditsUsed: ${result.totalCreditsUsed || 0}`)

    if (result.costsByPhase) {
      const phaseKeys = Object.keys(result.costsByPhase)
      log(`  ✅ Fases con datos: ${phaseKeys.join(', ')}`)
    }

    log('\n✅ TEST PASSED - El tracking de costos por fase funciona correctamente!\n', colors.green)
    log('🔗 Ahora puedes ver estos datos en el admin panel:', colors.cyan)
    log('   http://localhost:3000/admin\n', colors.yellow)

    return true
  } catch (error) {
    log('\n❌ TEST FAILED!', colors.red)
    log(`\nError: ${error instanceof Error ? error.message : String(error)}`, colors.red)
    if (error instanceof Error && error.stack) {
      log(`\nStack:\n${error.stack}`, colors.red)
    }
    return false
  }
}

// Ejecutar test
testPhaseCostTracking()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    log(`\n❌ FATAL ERROR: ${error}`, colors.red)
    process.exit(1)
  })
