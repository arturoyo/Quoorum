#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Forum CLI Tool
 *
 * Herramienta de línea de comandos para testing rápido del sistema dinámico
 *
 * Uso:
 *   pnpm forum analyze "pregunta"
 *   pnpm forum experts "pregunta"
 *   pnpm forum mode "pregunta"
 *   pnpm forum cost "pregunta"
 *   pnpm forum validate "pregunta"
 */

import { analyzeQuestion } from './src/question-analyzer'
import { getDebateMode, getRecommendedExperts, estimateDebateCost, getQuestionInsights } from './src/helpers'
import { validateQuestion } from './src/helpers'

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function header(title: string) {
  log('\n' + '='.repeat(60), colors.bright)
  log(title, colors.bright + colors.cyan)
  log('='.repeat(60), colors.bright)
}

function section(title: string) {
  log(`\n${title}`, colors.bright + colors.yellow)
  log('-'.repeat(title.length), colors.dim)
}

// ============================================================================
// COMMANDS
// ============================================================================

async function analyzeCommand(question: string) {
  header('🔍 QUESTION ANALYSIS')

  log(`Question: "${question}"`, colors.bright)

  const analysis = await analyzeQuestion(question)

  section('📊 Complexity')
  log(`  Complexity: ${analysis.complexity}/10`)
  log(`  Decision Type: ${analysis.decisionType}`)

  section('🎯 Knowledge Areas')
  for (const area of analysis.areas) {
    log(`  • ${area.area} (${area.weight}%) - ${area.reasoning}`)
  }

  section('🏷️  Topics')
  for (const topic of analysis.topics) {
    log(`  • ${topic.name} (relevance: ${topic.relevance}%)`)
  }

  section('💡 Reasoning')
  log(`  ${analysis.reasoning}`)
}

async function expertsCommand(question: string) {
  header('👥 RECOMMENDED EXPERTS')

  log(`Question: "${question}"`, colors.bright)

  const experts = await getRecommendedExperts(question)

  section('🌟 Primary Experts')
  const primary = experts.filter((e) => e.role === 'primary')
  for (const expert of primary) {
    log(`  • ${expert.name} (${expert.title})`, colors.green)
    log(`    Score: ${expert.matchScore}/100`, colors.dim)
    log(`    Expertise: ${expert.expertise.join(', ')}`, colors.dim)
    log(`    Reasoning: ${expert.reasoning}`, colors.dim)
  }

  section('📋 Secondary Experts')
  const secondary = experts.filter((e) => e.role === 'secondary')
  for (const expert of secondary) {
    log(`  • ${expert.name} (${expert.title})`, colors.yellow)
    log(`    Score: ${expert.matchScore}/100`, colors.dim)
  }

  section('🔍 Critic')
  const critic = experts.find((e) => e.role === 'critic')
  if (critic) {
    log(`  • ${critic.name} (${critic.title})`, colors.magenta)
    log(`    Score: ${critic.matchScore}/100`, colors.dim)
  }
}

async function modeCommand(question: string) {
  header('🧠 DEBATE MODE DETECTION')

  log(`Question: "${question}"`, colors.bright)

  const modeInfo = await getDebateMode(question)

  section('🎯 Mode')
  const modeColor = modeInfo.mode === 'dynamic' ? colors.green : colors.yellow
  log(`  Mode: ${modeInfo.mode.toUpperCase()}`, modeColor)
  log(`  Reason: ${modeInfo.reason}`)

  section('📊 Analysis')
  log(`  Complexity: ${modeInfo.complexity}/10`)
  log(`  Areas: ${modeInfo.areas}`)
  log(`  Estimated Rounds: ${modeInfo.estimatedRounds}`)
  log(`  Estimated Cost: $${modeInfo.estimatedCostUsd.toFixed(3)}`)
}

async function costCommand(question: string) {
  header('💰 COST ESTIMATION')

  log(`Question: "${question}"`, colors.bright)

  const cost = await estimateDebateCost(question)

  section('💵 Estimated Cost')
  log(`  Expected: $${cost.expectedCostUsd.toFixed(3)}`, colors.green)
  log(`  Min: $${cost.minCostUsd.toFixed(3)}`, colors.dim)
  log(`  Max: $${cost.maxCostUsd.toFixed(3)}`, colors.dim)

  section('📊 Breakdown')
  log(`  Analysis: $${cost.breakdown.analysis.toFixed(3)}`)
  log(`  Matching: $${cost.breakdown.matching.toFixed(3)}`)
  log(`  Debate: $${cost.breakdown.debate.toFixed(3)}`)
  log(`  Consensus: $${cost.breakdown.consensus.toFixed(3)}`)
}

async function validateCommand(question: string) {
  header('✅ QUESTION VALIDATION')

  log(`Question: "${question}"`, colors.bright)

  const validation = validateQuestion(question)

  if (validation.valid) {
    log('\n✅ Question is valid!', colors.green)
  } else {
    log('\n❌ Question is invalid', colors.red)
  }

  if (validation.errors.length > 0) {
    section('❌ Errors')
    for (const error of validation.errors) {
      log(`  • ${error}`, colors.red)
    }
  }

  if (validation.warnings.length > 0) {
    section('⚠️  Warnings')
    for (const warning of validation.warnings) {
      log(`  • ${warning}`, colors.yellow)
    }
  }

  if (validation.suggestions.length > 0) {
    section('💡 Suggestions')
    for (const suggestion of validation.suggestions) {
      log(`  • ${suggestion}`, colors.cyan)
    }
  }
}

async function insightsCommand(question: string) {
  header('💡 QUESTION INSIGHTS')

  log(`Question: "${question}"`, colors.bright)

  const insights = await getQuestionInsights(question)

  section('📊 Overview')
  log(`  Complexity: ${insights.complexityLabel} (${insights.complexity}/10)`)
  log(`  Decision Type: ${insights.decisionTypeLabel}`)
  log(`  Recommended Mode: ${insights.recommendedMode.toUpperCase()}`)

  section('🎯 Areas & Topics')
  log(`  Primary Area: ${insights.primaryArea}`)
  log(`  All Areas: ${insights.allAreas.join(', ')}`)
  log(`  Topics: ${insights.topics.join(', ')}`)

  section('💭 Summary')
  log(`  ${insights.summary}`)
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    log('Forum CLI Tool', colors.bright + colors.cyan)
    log('\nUsage:', colors.bright)
    log('  pnpm forum analyze "question"   - Analyze question complexity and areas')
    log('  pnpm forum experts "question"   - Show recommended experts')
    log('  pnpm forum mode "question"      - Detect debate mode (static vs dynamic)')
    log('  pnpm forum cost "question"      - Estimate debate cost')
    log('  pnpm forum validate "question"  - Validate question')
    log('  pnpm forum insights "question"  - Get question insights')
    log('\nExamples:')
    log('  pnpm forum analyze "¿Debo lanzar Wallie a 29€, 49€ o 79€?"')
    log('  pnpm forum experts "¿Cómo posicionar Wallie en el mercado?"')
    process.exit(0)
  }

  const command = args[0]
  const question = args.slice(1).join(' ')

  if (!question) {
    log('❌ Error: Question is required', colors.red)
    process.exit(1)
  }

  try {
    switch (command) {
      case 'analyze':
        await analyzeCommand(question)
        break
      case 'experts':
        await expertsCommand(question)
        break
      case 'mode':
        await modeCommand(question)
        break
      case 'cost':
        await costCommand(question)
        break
      case 'validate':
        await validateCommand(question)
        break
      case 'insights':
        await insightsCommand(question)
        break
      default:
        log(`❌ Unknown command: ${command}`, colors.red)
        log('Run "pnpm forum" to see available commands')
        process.exit(1)
    }
  } catch (error) {
    log(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`, colors.red)
    process.exit(1)
  }
}

main()
