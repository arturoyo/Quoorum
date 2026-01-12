/* eslint-disable no-console, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
/**
 * Demo Standalone del Sistema Dinámico de Expertos de Forum
 * (Sin llamadas a AI, solo muestra la lógica del sistema)
 *
 * Ejecutar: pnpm tsx packages/forum/demo-standalone.ts
 */
import { matchExperts } from './src/expert-matcher'
import type { QuestionAnalysis } from './src/question-analyzer'
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

// Preguntas de ejemplo de Wallie con análisis pre-calculados
const WALLIE_QUESTIONS = [
  {
    id: 1,
    question: '¿Debo lanzar Wallie a 29€, 49€ o 79€?',
    description: 'Decisión de pricing estratégico',
    analysis: {
      question: '¿Debo lanzar Wallie a 29€, 49€ o 79€?',
      areas: [
        { area: 'pricing', weight: 60, reasoning: 'Decisión principal de monetización' },
        { area: 'marketing', weight: 25, reasoning: 'Impacta posicionamiento y messaging' },
        { area: 'product', weight: 15, reasoning: 'Afecta percepción de valor del producto' },
      ],
      topics: [
        { name: 'SaaS', relevance: 95 },
        { name: 'B2B', relevance: 90 },
        { name: 'España', relevance: 85 },
      ],
      complexity: 8,
      decisionType: 'strategic' as const,
      recommendedExperts: ['patrick_campbell', 'alex_hormozi', 'april_dunford'],
      reasoning:
        'Decisión estratégica de alto impacto que requiere expertise en pricing SaaS, percepción de valor y posicionamiento en mercado español.',
    },
  },
  {
    id: 2,
    question: '¿Qué feature construir primero: Forum, Voice Analytics, o AI Coaching?',
    description: 'Priorización de roadmap',
    analysis: {
      question: '¿Qué feature construir primero: Forum, Voice Analytics, o AI Coaching?',
      areas: [
        { area: 'product', weight: 50, reasoning: 'Decisión core de product strategy' },
        { area: 'technical', weight: 30, reasoning: 'Complejidad técnica variable' },
        { area: 'marketing', weight: 20, reasoning: 'Impacto en go-to-market' },
      ],
      topics: [
        { name: 'AI', relevance: 90 },
        { name: 'SaaS', relevance: 85 },
        { name: 'product-market fit', relevance: 80 },
      ],
      complexity: 7,
      decisionType: 'strategic' as const,
      recommendedExperts: ['rahul_vohra', 'lenny_rachitsky', 'andrej_karpathy'],
      reasoning:
        'Decisión de priorización que requiere balance entre PMF, viabilidad técnica y diferenciación competitiva.',
    },
  },
  {
    id: 3,
    question: '¿Cómo posicionar Wallie: "WhatsApp CRM" o "AI Sales Assistant"?',
    description: 'Estrategia de positioning',
    analysis: {
      question: '¿Cómo posicionar Wallie: "WhatsApp CRM" o "AI Sales Assistant"?',
      areas: [
        { area: 'marketing', weight: 60, reasoning: 'Decisión central de positioning' },
        { area: 'product', weight: 25, reasoning: 'Afecta desarrollo de features' },
        { area: 'sales', weight: 15, reasoning: 'Impacta sales pitch y conversión' },
      ],
      topics: [
        { name: 'positioning', relevance: 95 },
        { name: 'B2B', relevance: 85 },
        { name: 'España', relevance: 80 },
      ],
      complexity: 8,
      decisionType: 'strategic' as const,
      recommendedExperts: ['april_dunford', 'peep_laja', 'steli_efti'],
      reasoning:
        'Decisión de positioning que define cómo el mercado percibe el producto y afecta toda la estrategia de go-to-market.',
    },
  },
  {
    id: 4,
    question: '¿Debo enfocarme en inmobiliarias o expandir a otros verticales?',
    description: 'Estrategia de go-to-market',
    analysis: {
      question: '¿Debo enfocarme en inmobiliarias o expandir a otros verticales?',
      areas: [
        { area: 'marketing', weight: 40, reasoning: 'Estrategia de segmentación' },
        { area: 'sales', weight: 35, reasoning: 'Impacto en sales motion' },
        { area: 'product', weight: 25, reasoning: 'Customización por vertical' },
      ],
      topics: [
        { name: 'B2B', relevance: 90 },
        { name: 'go-to-market', relevance: 85 },
        { name: 'España', relevance: 80 },
      ],
      complexity: 7,
      decisionType: 'strategic' as const,
      recommendedExperts: ['brian_balfour', 'steli_efti', 'april_dunford'],
      reasoning:
        'Decisión de expansión que requiere análisis de growth loops, sales efficiency y diferenciación por vertical.',
    },
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
      'Según datos de SaaS pricing, 49€ captura el segmento de mayor valor. El análisis de willingness-to-pay muestra que empresas con >10 empleados pagan 2-3x más que SMBs. Con 77% de margen, el LTV justifica el precio premium. Ejemplos: HubSpot empezó en $50/mes, Intercom en $49/mes.',
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
      'El valor percibido es clave. Si Wallie ahorra 10h/semana a un vendedor (€25/h), el ROI mensual es €1000. Un precio de 49€ es solo 5% del valor generado, lo cual es psicológicamente aceptable. Comparación: Calendly cobra $12/mes pero genera $500+ en valor.',
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
      'Riesgo: 49€ puede alejar early adopters price-sensitive. Competencia en España ofrece CRMs desde 15€/mes. ¿Tenemos validación de que el mercado español paga premium por AI? Datos de Capterra muestran que 65% de SMBs españolas buscan herramientas <30€/mes.',
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

function demoQuestionAnalysis(question: string, analysis: QuestionAnalysis) {
  log(`\n📝 Pregunta: "${question}"`, colors.bright)
  log('\n🔍 Análisis de pregunta:', colors.cyan)

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

  log('\n  Razonamiento:', colors.blue)
  log(`    ${analysis.reasoning}`, colors.dim)

  return analysis
}

function demoExpertMatching(analysis: QuestionAnalysis) {
  log('\n👥 Seleccionando expertos...', colors.cyan)

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
      log(`      Perspectiva: ${match.expert.perspective}`, colors.dim)
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

function runDemo() {
  header('🚀 DEMO: Sistema Dinámico de Expertos de Forum')

  log('Este demo muestra cómo funciona el sistema dinámico con preguntas reales de Wallie.\n')
  log('Componentes demostrados:', colors.bright)
  log('  1. Question Analyzer - Análisis automático de preguntas')
  log('  2. Expert Matcher - Selección inteligente de expertos')
  log('  3. Quality Monitor - Monitoreo de calidad del debate')
  log('  4. Meta-Moderator - Intervenciones para elevar calidad\n')

  // Demo de cada pregunta
  for (const { id, question, description, analysis } of WALLIE_QUESTIONS) {
    header(`PREGUNTA ${id}: ${description}`)

    // 1. Análisis de pregunta
    demoQuestionAnalysis(question, analysis)

    // 2. Matching de expertos
    demoExpertMatching(analysis)

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
  log('  • Seleccionar los expertos más relevantes (17+ perfiles)')
  log('  • Monitorear la calidad del debate en tiempo real')
  log('  • Intervenir para prevenir consenso prematuro\n')

  log('Próximo paso: Integración con runner.ts para debates reales', colors.cyan)
  log('Comando: pnpm tsx packages/forum/demo-standalone.ts\n', colors.dim)
}

// Ejecutar demo
runDemo()
