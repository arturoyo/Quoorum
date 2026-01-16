/**
 * Script de prueba para verificar los fixes del sistema de debates
 *
 * Fixes a verificar:
 * 1. Mensajes visibles en tiempo real con expand/collapse
 * 2. Ranking relevante (respuestas directas a la pregunta)
 * 3. Mensajes legibles (no emoji-comprimidos)
 */

import { runDebate } from './packages/quoorum/src/runner-dynamic'

async function testDebate() {
  console.log('🧪 Iniciando debate de prueba...\n')
  console.log('Pregunta: "¿Qué es mejor ChatGPT o Perplexity para programar?"\n')
  console.log('Esperando agentes deliberen...\n')

  const result = await runDebate({
    sessionId: `test-${Date.now()}`,
    question: '¿Qué es mejor ChatGPT o Perplexity para programar?',
    context: {
      sources: [
        {
          type: 'manual',
          content: 'Contexto: Estamos evaluando herramientas de IA para programación.'
        }
      ],
      combinedContext: 'Contexto: Estamos evaluando herramientas de IA para programación.'
    },
    forceMode: 'dynamic',
    onProgress: async (progress) => {
      console.log(`📊 [${progress.phase}] ${progress.message} (${progress.progress}%)`)
      if (progress.currentRound) {
        console.log(`   Ronda ${progress.currentRound}/${progress.totalRounds}`)
      }
    },
    onMessageGenerated: async (message) => {
      console.log(`\n💬 ${message.agentName} (${message.modelId}):`)
      console.log(`   "${message.content}"`)
      console.log(`   Tokens: ${message.tokensUsed}, Cost: $${message.costUsd.toFixed(6)}`)
    },
    onRoundComplete: async (round) => {
      console.log(`\n✅ Ronda ${round.round} completada`)
      if (round.consensusCheck) {
        console.log(`   Consenso: ${round.consensusCheck.consensusScore.toFixed(2)}`)
        console.log(`   Continuar: ${round.consensusCheck.shouldContinue}`)
      }
    },
  })

  console.log('\n\n🎯 RESULTADO FINAL\n')
  console.log('━'.repeat(60))
  console.log(`Status: ${result.status}`)
  console.log(`Rondas totales: ${result.totalRounds}`)
  console.log(`Costo total: $${result.totalCostUsd.toFixed(4)}`)
  console.log(`Score de consenso: ${result.consensusScore.toFixed(2)}`)

  console.log('\n📊 RANKING DE OPCIONES:\n')
  result.finalRanking.forEach((option, index) => {
    console.log(`${index + 1}. ${option.option}`)
    console.log(`   Success Rate: ${option.successRate}%`)
    console.log(`   Confidence: ${(option.confidence * 100).toFixed(0)}%`)
    console.log(`   Supporters: ${option.supporters.join(', ')}`)
    console.log(`   Pros: ${option.pros.join(', ')}`)
    console.log(`   Cons: ${option.cons.join(', ')}`)
    console.log()
  })

  console.log('━'.repeat(60))

  // Verificaciones
  console.log('\n✅ VERIFICACIONES:\n')

  // 1. Verificar que hay múltiples agentes (no solo crítico)
  const uniqueAgents = new Set(result.rounds.flatMap(r => r.messages.map(m => m.agentKey)))
  console.log(`✓ Agentes participantes: ${uniqueAgents.size} (${Array.from(uniqueAgents).join(', ')})`)
  if (uniqueAgents.size === 1) {
    console.log('  ⚠️  ADVERTENCIA: Solo participó 1 agente')
  }

  // 2. Verificar legibilidad de mensajes (no emojis excesivos)
  const sampleMessage = result.rounds[0]?.messages[0]?.content || ''
  const emojiCount = (sampleMessage.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length
  const wordCount = sampleMessage.split(' ').length
  console.log(`✓ Muestra de mensaje: "${sampleMessage.substring(0, 100)}..."`)
  console.log(`  Emojis: ${emojiCount}, Palabras: ${wordCount}`)
  if (emojiCount > wordCount / 2) {
    console.log('  ⚠️  ADVERTENCIA: Mensaje parece estar emoji-comprimido')
  }

  // 3. Verificar relevancia del ranking
  const question = '¿Qué es mejor ChatGPT o Perplexity para programar?'
  const expectedKeywords = ['chatgpt', 'perplexity', 'ambos', 'depende']
  const hasRelevantOptions = result.finalRanking.some(opt =>
    expectedKeywords.some(kw => opt.option.toLowerCase().includes(kw))
  )
  console.log(`✓ Ranking relevante: ${hasRelevantOptions ? 'SÍ' : 'NO'}`)
  if (!hasRelevantOptions) {
    console.log('  ⚠️  ADVERTENCIA: Opciones no parecen responder directamente la pregunta')
  }

  console.log('\n🎉 Prueba completada!')
}

// Ejecutar
testDebate().catch(console.error)
