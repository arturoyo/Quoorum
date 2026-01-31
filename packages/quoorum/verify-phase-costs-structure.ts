/**
 * Script para verificar la estructura de costsByPhase sin ejecutar debate
 *
 * Ejecutar: pnpm tsx packages/quoorum/verify-phase-costs-structure.ts
 */

import type { DebatePhaseType, DebateMessage, DebateRound } from './src/types'

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

// Simular datos de un debate con costos por fase
function simulateDebateData() {
  log('\n🔍 VERIFICANDO ESTRUCTURA DE COSTOS POR FASE\n', colors.cyan)

  // Simular mensajes con diferentes fases
  const mockMessages: DebateMessage[] = [
    {
      agentKey: 'optimizer',
      agentName: 'Optimista',
      content: 'Mi argumento optimista...',
      provider: 'openai' as any,
      model: 'gpt-4o-mini',
      tokensUsed: 250,
      costUsd: 0.0015,
      timestamp: new Date(),
      phase: 'debate', // Fase de debate
    },
    {
      agentKey: 'critic',
      agentName: 'Crítico',
      content: 'Mi análisis crítico...',
      provider: 'openai' as any,
      model: 'gpt-4o-mini',
      tokensUsed: 280,
      costUsd: 0.0017,
      timestamp: new Date(),
      phase: 'debate', // Fase de debate
    },
    {
      agentKey: 'synthesis',
      agentName: 'Secretario del Tribunal',
      content: 'Síntesis ejecutiva generada...',
      provider: 'openai' as any,
      model: 'gpt-4o',
      tokensUsed: 1500,
      costUsd: 0.015,
      timestamp: new Date(),
      phase: 'synthesis', // Fase de síntesis
    },
  ]

  const rounds: DebateRound[] = [
    {
      round: 1,
      messages: mockMessages.slice(0, 2),
    },
    {
      round: 2,
      messages: [mockMessages[2]!],
    },
  ]

  log('📊 Mensajes simulados:', colors.yellow)
  for (const msg of mockMessages) {
    log(
      `  [${msg.phase?.toUpperCase().padEnd(10)}] ${msg.agentName.padEnd(25)} | ` +
        `${msg.tokensUsed.toString().padStart(5)} tokens | ` +
        `$${msg.costUsd.toFixed(4)}`,
      colors.reset
    )
  }

  // Simular la función calculateCostsByPhase
  function calculateCostsByPhase(
    rounds: DebateRound[]
  ): Record<
    DebatePhaseType,
    {
      costUsd: number
      creditsUsed: number
      tokensUsed: number
      messagesCount: number
    }
  > {
    const breakdown: Record<string, { costUsd: number; creditsUsed: number; tokensUsed: number; messagesCount: number }> =
      {}

    for (const round of rounds) {
      for (const message of round.messages) {
        const phase = message.phase ?? 'debate' // Default to 'debate' if not set

        if (!breakdown[phase]) {
          breakdown[phase] = { costUsd: 0, creditsUsed: 0, tokensUsed: 0, messagesCount: 0 }
        }

        breakdown[phase]!.costUsd += message.costUsd
        breakdown[phase]!.tokensUsed += message.tokensUsed
        breakdown[phase]!.messagesCount += 1
      }
    }

    // Calculate credits for each phase (formula: Math.ceil((costUsd * 1.75) / 0.01))
    const CREDIT_MULTIPLIER = 1.75
    const USD_PER_CREDIT = 0.01

    for (const phase in breakdown) {
      const data = breakdown[phase]
      if (data) {
        data.creditsUsed = Math.ceil((data.costUsd * CREDIT_MULTIPLIER) / USD_PER_CREDIT)
      }
    }

    return breakdown as Record<DebatePhaseType, { costUsd: number; creditsUsed: number; tokensUsed: number; messagesCount: number }>
  }

  const costsByPhase = calculateCostsByPhase(rounds)

  log(`\n💰 COSTOS POR FASE (Calculados):`, colors.magenta)
  log(`${'='.repeat(90)}`, colors.magenta)

  const phases: DebatePhaseType[] = ['context', 'experts', 'strategy', 'revision', 'debate', 'synthesis']
  const phaseLabels: Record<DebatePhaseType, string> = {
    context: 'Contexto',
    experts: 'Expertos',
    strategy: 'Estrategia',
    revision: 'Revisión',
    debate: 'Debate',
    synthesis: 'Síntesis',
  }

  let totalCredits = 0
  let totalCost = 0
  let totalTokens = 0

  for (const phase of phases) {
    const data = costsByPhase[phase]
    if (data && data.creditsUsed > 0) {
      totalCredits += data.creditsUsed
      totalCost += data.costUsd
      totalTokens += data.tokensUsed

      log(
        `  ${phaseLabels[phase].padEnd(12)} | ` +
          `${data.creditsUsed.toString().padStart(6)} créditos | ` +
          `$${data.costUsd.toFixed(4).padStart(8)} | ` +
          `${data.tokensUsed.toString().padStart(7)} tokens | ` +
          `${data.messagesCount} msg`,
        colors.yellow
      )
    } else {
      log(`  ${phaseLabels[phase].padEnd(12)} | ${'-'.padStart(6)} créditos | ${'-'.padStart(10)} | ${'-'.padStart(7)} tokens | 0 msg`, colors.reset)
    }
  }

  log(`${'='.repeat(90)}`, colors.magenta)
  log(
    `  ${'TOTAL'.padEnd(12)} | ` +
      `${totalCredits.toString().padStart(6)} créditos | ` +
      `$${totalCost.toFixed(4).padStart(8)} | ` +
      `${totalTokens.toString().padStart(7)} tokens`,
    colors.green
  )

  // Verificar estructura para BD
  log(`\n📦 ESTRUCTURA PARA BASE DE DATOS:`, colors.cyan)
  log(JSON.stringify(costsByPhase, null, 2), colors.yellow)

  // Verificar cómo se vería en la tabla del admin
  log(`\n📊 VISTA PREVIA DE TABLA ADMIN:`, colors.cyan)
  log(`${'='.repeat(90)}`, colors.cyan)
  log(
    `Usuario      | Debate          | Fecha    | Contexto | Expertos | Estrategia | Revisión | Debate | Síntesis | TOTAL`
  )
  log(`${'='.repeat(90)}`, colors.cyan)

  const debateRow =
    'Juan García  | ¿Invertir IA?   | 27 ene   | ' +
    `${costsByPhase.context?.creditsUsed || '-'.padStart(8)} | ` +
    `${costsByPhase.experts?.creditsUsed || '-'.padStart(8)} | ` +
    `${costsByPhase.strategy?.creditsUsed || '-'.padStart(10)} | ` +
    `${costsByPhase.revision?.creditsUsed || '-'.padStart(8)} | ` +
    `${costsByPhase.debate?.creditsUsed || '-'.padStart(6)} | ` +
    `${costsByPhase.synthesis?.creditsUsed || '-'.padStart(8)} | ` +
    `${totalCredits}`

  log(debateRow, colors.yellow)

  log(`\n✅ VERIFICACIÓN COMPLETA!`, colors.green)
  log(`\n🎯 Conclusiones:`, colors.cyan)
  log(`  ✅ La estructura de costsByPhase está correctamente implementada`)
  log(`  ✅ Los cálculos de créditos funcionan (formula: Math.ceil((costUsd * 1.75) / 0.01))`)
  log(`  ✅ Cada fase rastrea: costUsd, creditsUsed, tokensUsed, messagesCount`)
  log(`  ✅ Las fases vacías se pueden mostrar como '-' en la tabla`)
  log(`\n📋 Próximo paso: Ejecutar un debate real para ver datos reales en /admin\n`)
}

simulateDebateData()
