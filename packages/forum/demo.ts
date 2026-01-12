/* eslint-disable no-console */
/**
 * Demo del Sistema Dinámico de Expertos de Forum
 *
 * Ejecutar: pnpm tsx packages/forum/demo.ts
 */

import { analyzeQuestion } from './src/question-analyzer'
import { matchExperts } from './src/expert-matcher'
import { analyzeDebateQuality, summarizeQuality } from './src/quality-monitor'
import { shouldIntervene, generateIntervention, summarizeIntervention } from './src/meta-moderator'
import type { DebateMessage } from './src/types'

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function separator() {
  log('\n' + '═'.repeat(80) + '\n', colors.dim)
}

function header(title: string) {
  separator()
  log(`  ${title}`, colors.bright + colors.cyan)
  separator()
}

// Preguntas de ejemplo de Wallie
const WALLIE_QUESTIONS = [
  {
    id: 1,
    question: '¿Debo lanzar Wallie a 29€, 49€ o 79€?',
    description: 'Decisión de pricing estratégico',
  },
  {
    id: 2,
    question: '¿Qué feature construir primero: Forum, Voice Analytics, o AI Coaching?',
    description: 'Priorización de roadmap',
  },
  {
    id: 3,
    question: '¿Cómo posicionar Wallie: "WhatsApp CRM" o "AI Sales Assistant"?',
    description: 'Estrategia de positioning',
  },
  {
    id: 4,
    question: '¿Debo enfocarme en inmobiliarias o expandir a otros verticales?',
    description: 'Estrategia de go-to-market',
  },
]

// Mensajes de debate simulados para demostrar quality monitor
const SIMULATED_DEBATE_MESSAGES: DebateMessage[] = [
  {
    id: 'msg-1',
    sessionId: 'demo-session',
    round: 1,
    agentKey: 'patrick_campbell',
    agentName: 'Patrick Campbell',
    content:
      'Según datos de SaaS pricing, 49€ captura el segmento de mayor valor. El análisis de willingness-to-pay muestra que empresas con >10 empleados pagan 2-3x más que SMBs. Con 77% de margen, el LTV justifica el precio premium.',
    isCompressed: false,
    tokensUsed: 150,
    costUsd: 0.001,
    createdAt: new Date(),
  },
  {
    id: 'msg-2',
    sessionId: 'demo-session',
    round: 1,
    agentKey: 'alex_hormozi',
    agentName: 'Alex Hormozi',
    content:
      'El valor percibido es clave. Si Wallie ahorra 10h/semana a un vendedor (€25/h), el ROI mensual es €1000. Un precio de 49€ es solo 5% del valor generado, lo cual es psicológicamente aceptable.',
    isCompressed: false,
    tokensUsed: 120,
    costUsd: 0.0008,
    createdAt: new Date(),
  },
  {
    id: 'msg-3',
    sessionId: 'demo-session',
    round: 1,
    agentKey: 'critic',
    agentName: 'The Critic',
    content:
      'Riesgo: 49€ puede alejar early adopters price-sensitive. Competencia en España ofrece CRMs desde 15€/mes. ¿Tenemos validación de que el mercado español paga premium por AI?',
    isCompressed: false,
    tokensUsed: 110,
    costUsd: 0.0007,
    createdAt: new Date(),
  },
  {
    id: 'msg-4',
    sessionId: 'demo-session',
    round: 2,
    agentKey: 'patrick_campbell',
    agentName: 'Patrick Campbell',
    content: 'Estoy de acuerdo con el análisis.',
    isCompressed: false,
    tokensUsed: 30,
    costUsd: 0.0002,
    createdAt: new Date(),
  },
  {
    id: 'msg-5',
    sessionId: 'demo-session',
    round: 2,
    agentKey: 'alex_hormozi',
    agentName: 'Alex Hormozi',
    content: 'Sí, correcto.',
    isCompressed: false,
    tokensUsed: 20,
    costUsd: 0.0001,
    createdAt: new Date(),
  },
]

async function demoQuestionAnalysis(question: string) {
  log(`\n📝 Pregunta: "${question}"`, colors.bright)
  log('\n🔍 Analizando pregunta...', colors.cyan)

  const analysis = await analyzeQuestion(question)

  log('\n✅ Análisis completado:', colors.green)
  log(`\n  Complejidad: ${analysis.complexity}/10`, colors.yellow)
  log(`  Tipo de decisión: ${analysis.decisionType}`, colors.yellow)

  log('\n  Áreas identificadas:', colors.magenta)
  for (const area of analysis.areas) {
    log(`    • ${area.area} (peso: ${area.weight}%) - ${area.reasoning}`, colors.dim)
  }

  if (analysis.topics.length > 0) {
    log('\n  Temáticas detectadas:', colors.magenta)
    for (const topic of analysis.topics) {
      log(`    • ${topic.name} (relevancia: ${topic.relevance}%)`, colors.dim)
    }
  }

  return analysis
}

async function demoExpertMatching(question: string) {
  log('\n👥 Seleccionando expertos...', colors.cyan)

  const analysis = await analyzeQuestion(question)
  const matches = matchExperts(analysis, {
    minExperts: 5,
    maxExperts: 7,
  })

  log('\n✅ Expertos seleccionados:', colors.green)

  const primaryExperts = matches.filter((m) => m.suggestedRole === 'primary')
  const secondaryExperts = matches.filter((m) => m.suggestedRole === 'secondary')
  const critic = matches.find((m) => m.suggestedRole === 'critic')

  if (primaryExperts.length > 0) {
    log('\n  🌟 Expertos Principales:', colors.bright + colors.green)
    for (const match of primaryExperts) {
      log(
        `    • ${match.expert.name} (${match.expert.title}) - Score: ${match.score}/100`,
        colors.dim
      )
      log(`      Expertise: ${match.expert.expertise.join(', ')}`, colors.dim)
    }
  }

  if (secondaryExperts.length > 0) {
    log('\n  📋 Expertos de Soporte:', colors.yellow)
    for (const match of secondaryExperts) {
      log(
        `    • ${match.expert.name} (${match.expert.title}) - Score: ${match.score}/100`,
        colors.dim
      )
    }
  }

  if (critic) {
    log('\n  🔍 Pensamiento Crítico:', colors.red)
    log(
      `    • ${critic.expert.name} (${critic.expert.title}) - Score: ${critic.score}/100`,
      colors.dim
    )
  }

  return matches
}

function demoQualityMonitoring() {
  log('\n📊 Monitoreando calidad del debate...', colors.cyan)

  const quality = analyzeDebateQuality(SIMULATED_DEBATE_MESSAGES)

  log('\n✅ Análisis de calidad completado:', colors.green)
  log(summarizeQuality(quality), colors.dim)

  if (quality.issues.length > 0) {
    log('\n⚠️  Problemas detectados:', colors.yellow)
    for (const issue of quality.issues) {
      log(`    • ${issue.type} (severidad: ${issue.severity}/10): ${issue.description}`, colors.dim)
    }
  }

  if (quality.recommendations.length > 0) {
    log('\n💡 Recomendaciones:', colors.blue)
    for (const rec of quality.recommendations) {
      log(`    • ${rec}`, colors.dim)
    }
  }

  return quality
}

function demoMetaModerator() {
  log('\n🤖 Meta-Moderador evaluando necesidad de intervención...', colors.cyan)

  const quality = analyzeDebateQuality(SIMULATED_DEBATE_MESSAGES)

  if (shouldIntervene(quality)) {
    log('\n⚠️  Intervención necesaria!', colors.red)

    const intervention = generateIntervention(quality)

    log('\n' + summarizeIntervention(intervention), colors.yellow)
    log('\n📢 Prompt de intervención:', colors.magenta)
    log('\n' + intervention.prompt, colors.dim)
  } else {
    log('\n✅ Calidad del debate es aceptable. No se requiere intervención.', colors.green)
  }
}

async function runDemo() {
  header('🚀 DEMO: Sistema Dinámico de Expertos de Forum')

  log('Este demo muestra cómo funciona el sistema dinámico con preguntas reales de Wallie.\n')
  log('Componentes demostrados:', colors.bright)
  log('  1. Question Analyzer - Análisis automático de preguntas')
  log('  2. Expert Matcher - Selección inteligente de expertos')
  log('  3. Quality Monitor - Monitoreo de calidad del debate')
  log('  4. Meta-Moderator - Intervenciones para elevar calidad\n')

  // Demo de cada pregunta
  for (const { id, question, description } of WALLIE_QUESTIONS) {
    header(`PREGUNTA ${id}: ${description}`)

    // 1. Análisis de pregunta
    await demoQuestionAnalysis(question)

    // 2. Matching de expertos
    await demoExpertMatching(question)

    if (id === 1) {
      // Solo para la primera pregunta, mostrar quality monitor y meta-moderator
      separator()

      // 3. Quality monitoring
      demoQualityMonitoring()

      separator()

      // 4. Meta-moderator
      demoMetaModerator()
    }

    log('\n')
  }

  header('✅ DEMO COMPLETADO')

  log('El sistema dinámico está listo para:', colors.bright)
  log('  • Analizar cualquier pregunta estratégica')
  log('  • Seleccionar los expertos más relevantes')
  log('  • Monitorear la calidad del debate en tiempo real')
  log('  • Intervenir para prevenir consenso prematuro\n')

  log('Próximo paso: Integración con runner.ts para debates reales', colors.cyan)
  log('Comando: pnpm tsx packages/forum/demo.ts\n', colors.dim)
}

// Ejecutar demo
void runDemo().catch((error: unknown) => {
  console.error('Error en demo:', error)
  process.exit(1)
})
