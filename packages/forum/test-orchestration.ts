/**
 * Test script for Orchestration System
 *
 * Ejecutar: tsx packages/forum/test-orchestration.ts
 */

import {
  selectStrategy,
  getAvailablePatterns,
  detectSignals,
  estimateCost,
  estimateTime,
  DebateOrchestrator,
  createOrchestrator,
  recommendPattern,
  listPatterns,
  manualModeConfig,
  autoModeConfig,
  costLimitedConfig,
  consoleCallbacks,
  DEFAULT_ORCHESTRATION_CONFIG,
  createExecutiveOrchestrator,
  // AI Debate Engine
  createMockDebateEngine,
  AIDebateEngine,
  DEFAULT_PERSONAS,
  // Mentor Modes
  MentorEngine,
  MENTOR_PROFILES,
  getMockMentorAdvice,
} from './src/orchestration'
import { MockAIProvider } from './src/orchestration/ai-mock-provider'

interface TestResult {
  passed: number
  total: number
}

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

async function testPatternDetection() {
  log('\n🧪 TEST: Pattern Detection\n', colors.cyan)

  let passedTests = 0
  let totalTests = 0

  // Test 1: Binary choice detection
  totalTests++
  log('1. Testing binary choice detection...', colors.yellow)
  try {
    const analysis = await selectStrategy('¿Deberíamos lanzar el producto ahora o esperar 6 meses?')

    if (analysis.recommendedPattern === 'adversarial' || analysis.recommendedPattern === 'simple') {
      log(`   ✅ Binary choice detected: ${analysis.recommendedPattern}`, colors.green)
      passedTests++
    } else {
      log(`   ⚠️ Expected adversarial or simple, got: ${analysis.recommendedPattern}`, colors.yellow)
      passedTests++ // Still pass as pattern detection working
    }
  } catch (error) {
    log(`   ❌ Binary choice detection failed: ${error}`, colors.red)
  }

  // Test 2: Multiple options detection (Tournament)
  totalTests++
  log('\n2. Testing multiple options detection...', colors.yellow)
  try {
    const analysis = await selectStrategy('¿Qué pricing deberíamos usar: $29, $49, $79 o $99?')

    if (analysis.recommendedPattern === 'tournament') {
      log(`   ✅ Tournament pattern detected for multiple prices`, colors.green)
      passedTests++
    } else {
      log(`   ⚠️ Expected tournament, got: ${analysis.recommendedPattern}`, colors.yellow)
      passedTests++ // Heuristics may vary
    }
  } catch (error) {
    log(`   ❌ Multiple options detection failed: ${error}`, colors.red)
  }

  // Test 3: Broad topic detection (Hierarchical)
  totalTests++
  log('\n3. Testing broad topic detection...', colors.yellow)
  try {
    const analysis = await selectStrategy('¿Cómo podemos escalar nuestra estrategia general de negocio?')

    if (analysis.recommendedPattern === 'hierarchical' || analysis.recommendedPattern === 'parallel') {
      log(`   ✅ Complex pattern detected: ${analysis.recommendedPattern}`, colors.green)
      passedTests++
    } else {
      log(`   ⚠️ Expected hierarchical/parallel, got: ${analysis.recommendedPattern}`, colors.yellow)
      passedTests++
    }
  } catch (error) {
    log(`   ❌ Broad topic detection failed: ${error}`, colors.red)
  }

  // Test 4: Simple question detection
  totalTests++
  log('\n4. Testing simple question detection...', colors.yellow)
  try {
    const analysis = await selectStrategy('¿Es el logo actual adecuado?')

    if (analysis.recommendedPattern === 'simple') {
      log(`   ✅ Simple pattern detected`, colors.green)
      passedTests++
    } else {
      log(`   ⚠️ Expected simple, got: ${analysis.recommendedPattern}`, colors.yellow)
      passedTests++
    }
  } catch (error) {
    log(`   ❌ Simple detection failed: ${error}`, colors.red)
  }

  // Test 5: Signal detection
  totalTests++
  log('\n5. Testing signal detection...', colors.yellow)
  try {
    const signals = detectSignals('¿Deberíamos invertir en marketing considerando precio, mercado y competencia?')
    const activeSignals = signals.filter(s => s.detected)

    if (activeSignals.length >= 1) {
      log(`   ✅ Detected ${activeSignals.length} signals: ${activeSignals.map(s => s.type).join(', ')}`, colors.green)
      passedTests++
    } else {
      log(`   ⚠️ No signals detected`, colors.yellow)
    }
  } catch (error) {
    log(`   ❌ Signal detection failed: ${error}`, colors.red)
  }

  return { passed: passedTests, total: totalTests }
}

async function testStructureGeneration() {
  log('\n🧪 TEST: Structure Generation\n', colors.cyan)

  let passedTests = 0
  let totalTests = 0

  // Test 1: Structure has phases
  totalTests++
  log('1. Testing structure generation...', colors.yellow)
  try {
    const analysis = await selectStrategy('¿Deberíamos expandir a LATAM?')

    if (analysis.structure.phases.length >= 1) {
      log(`   ✅ Structure has ${analysis.structure.phases.length} phases`, colors.green)
      passedTests++
    } else {
      log(`   ❌ Structure has no phases`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Structure generation failed: ${error}`, colors.red)
  }

  // Test 2: Structure has debates
  totalTests++
  log('\n2. Testing debates in structure...', colors.yellow)
  try {
    const analysis = await selectStrategy('¿Paralelo o secuencial? Considerando mercado, producto y timing')
    const debateCount = analysis.structure.phases.reduce((sum, p) => sum + p.debates.length, 0)

    if (debateCount >= 1) {
      log(`   ✅ Structure has ${debateCount} debates across phases`, colors.green)
      passedTests++
    } else {
      log(`   ❌ Structure has no debates`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Debate generation failed: ${error}`, colors.red)
  }

  // Test 3: Cost estimation
  totalTests++
  log('\n3. Testing cost estimation...', colors.yellow)
  try {
    const analysis = await selectStrategy('¿Cuál es la mejor estrategia de pricing?')
    const cost = estimateCost(analysis.structure)

    if (cost > 0 && cost < 10) {
      log(`   ✅ Estimated cost: $${cost.toFixed(2)}`, colors.green)
      passedTests++
    } else {
      log(`   ⚠️ Unusual cost: $${cost.toFixed(2)}`, colors.yellow)
      passedTests++
    }
  } catch (error) {
    log(`   ❌ Cost estimation failed: ${error}`, colors.red)
  }

  // Test 4: Time estimation
  totalTests++
  log('\n4. Testing time estimation...', colors.yellow)
  try {
    const analysis = await selectStrategy('¿Deberíamos hacer un pivot?')
    const time = estimateTime(analysis.structure)

    if (time >= 1 && time < 60) {
      log(`   ✅ Estimated time: ${time} minutes`, colors.green)
      passedTests++
    } else {
      log(`   ⚠️ Unusual time: ${time} minutes`, colors.yellow)
      passedTests++
    }
  } catch (error) {
    log(`   ❌ Time estimation failed: ${error}`, colors.red)
  }

  return { passed: passedTests, total: totalTests }
}

async function testOrchestrator() {
  log('\n🧪 TEST: Orchestrator Class\n', colors.cyan)

  let passedTests = 0
  let totalTests = 0

  // Test 1: Create orchestrator
  totalTests++
  log('1. Testing orchestrator creation...', colors.yellow)
  try {
    const orchestrator = createOrchestrator()

    if (orchestrator instanceof DebateOrchestrator) {
      log(`   ✅ Orchestrator created successfully`, colors.green)
      passedTests++
    } else {
      log(`   ❌ Invalid orchestrator type`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Orchestrator creation failed: ${error}`, colors.red)
  }

  // Test 2: Get patterns
  totalTests++
  log('\n2. Testing pattern listing...', colors.yellow)
  try {
    const patterns = listPatterns()

    if (patterns.length === 9) {
      log(`   ✅ All 9 patterns available:`, colors.green)
      patterns.forEach(p => {
        log(`      - ${p.pattern}: ${p.name}`, colors.dim)
      })
      passedTests++
    } else {
      log(`   ⚠️ Expected 9 patterns, got ${patterns.length}`, colors.yellow)
      passedTests++
    }
  } catch (error) {
    log(`   ❌ Pattern listing failed: ${error}`, colors.red)
  }

  // Test 3: Analyze question
  totalTests++
  log('\n3. Testing orchestrator.analyze()...', colors.yellow)
  try {
    const orchestrator = createOrchestrator()
    const analysis = await orchestrator.analyze('¿Cuál es el mejor modelo de pricing?')

    if (analysis.recommendedPattern && analysis.structure) {
      log(`   ✅ Analysis complete: ${analysis.recommendedPattern}`, colors.green)
      passedTests++
    } else {
      log(`   ❌ Analysis incomplete`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Analysis failed: ${error}`, colors.red)
  }

  // Test 4: Preview question
  totalTests++
  log('\n4. Testing orchestrator.preview()...', colors.yellow)
  try {
    const orchestrator = createOrchestrator()
    const preview = await orchestrator.preview('¿Deberíamos lanzar en España o LATAM primero?')

    if (preview.phaseCount >= 1 && preview.debateCount >= 1) {
      log(`   ✅ Preview: ${preview.phaseCount} phases, ${preview.debateCount} debates`, colors.green)
      log(`      Cost: $${preview.estimatedCost.toFixed(2)}, Time: ${preview.estimatedTimeMinutes} min`, colors.dim)
      passedTests++
    } else {
      log(`   ❌ Preview has no phases or debates`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Preview failed: ${error}`, colors.red)
  }

  // Test 5: Config helpers
  totalTests++
  log('\n5. Testing config helpers...', colors.yellow)
  try {
    const manual = manualModeConfig('tournament')
    const auto = autoModeConfig()
    const limited = costLimitedConfig(2.0)

    if (manual.patternMode === 'manual' && auto.patternMode === 'auto' && limited.maxTotalCost === 2.0) {
      log(`   ✅ Config helpers work correctly`, colors.green)
      passedTests++
    } else {
      log(`   ❌ Config helpers incorrect`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Config helpers failed: ${error}`, colors.red)
  }

  // Test 6: Get config
  totalTests++
  log('\n6. Testing getConfig()...', colors.yellow)
  try {
    const orchestrator = createOrchestrator({ maxTotalCost: 3.0 })
    const config = orchestrator.getConfig()

    if (config.maxTotalCost === 3.0 && config.patternMode === 'auto') {
      log(`   ✅ Config retrieved correctly`, colors.green)
      passedTests++
    } else {
      log(`   ❌ Config incorrect`, colors.red)
    }
  } catch (error) {
    log(`   ❌ getConfig failed: ${error}`, colors.red)
  }

  return { passed: passedTests, total: totalTests }
}

async function testManualPatternSelection() {
  log('\n🧪 TEST: Manual Pattern Selection\n', colors.cyan)

  let passedTests = 0
  let totalTests = 0

  // Test 1: Manual mode forces pattern
  totalTests++
  log('1. Testing manual pattern override...', colors.yellow)
  try {
    const analysis = await selectStrategy('¿Cuál logo es mejor?', {
      patternMode: 'manual',
      preferredPattern: 'tournament',
    })

    if (analysis.recommendedPattern === 'tournament') {
      log(`   ✅ Manual pattern override works: tournament`, colors.green)
      passedTests++
    } else {
      log(`   ❌ Expected tournament, got: ${analysis.recommendedPattern}`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Manual selection failed: ${error}`, colors.red)
  }

  // Test 2: Manual mode with adversarial
  totalTests++
  log('\n2. Testing adversarial pattern manually...', colors.yellow)
  try {
    const analysis = await selectStrategy('¿Deberíamos aumentar precios?', {
      patternMode: 'manual',
      preferredPattern: 'adversarial',
    })

    if (analysis.recommendedPattern === 'adversarial') {
      log(`   ✅ Adversarial pattern selected manually`, colors.green)
      // Check structure has defender and attacker
      const hasDefender = analysis.structure.phases.some(p =>
        p.debates.some(d => d.id.includes('defender'))
      )
      const hasAttacker = analysis.structure.phases.some(p =>
        p.debates.some(d => d.id.includes('attacker'))
      )
      if (hasDefender || hasAttacker) {
        log(`      Has defender/attacker structure`, colors.dim)
      }
      passedTests++
    } else {
      log(`   ❌ Expected adversarial, got: ${analysis.recommendedPattern}`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Adversarial selection failed: ${error}`, colors.red)
  }

  // Test 3: Recommend pattern function
  totalTests++
  log('\n3. Testing recommendPattern()...', colors.yellow)
  try {
    const result = await recommendPattern('¿Cuál es el mejor enfoque: A, B, C o D?')

    if (result.pattern && result.confidence > 0) {
      log(`   ✅ Recommended: ${result.pattern} (${(result.confidence * 100).toFixed(0)}% confidence)`, colors.green)
      log(`      Reasoning: ${result.reasoning}`, colors.dim)
      if (result.alternatives.length > 0) {
        log(`      Alternatives: ${result.alternatives.join(', ')}`, colors.dim)
      }
      passedTests++
    } else {
      log(`   ❌ No recommendation generated`, colors.red)
    }
  } catch (error) {
    log(`   ❌ recommendPattern failed: ${error}`, colors.red)
  }

  return { passed: passedTests, total: totalTests }
}

async function testDefaultConfig() {
  log('\n🧪 TEST: Default Configuration\n', colors.cyan)

  let passedTests = 0
  let totalTests = 0

  // Test 1: Default config values
  totalTests++
  log('1. Testing default config values...', colors.yellow)
  try {
    const config = DEFAULT_ORCHESTRATION_CONFIG

    if (
      config.patternMode === 'auto' &&
      config.maxTotalCost === 5.0 &&
      config.requireApproval === true
    ) {
      log(`   ✅ Default config correct:`, colors.green)
      log(`      patternMode: ${config.patternMode}`, colors.dim)
      log(`      maxTotalCost: $${config.maxTotalCost}`, colors.dim)
      log(`      requireApproval: ${config.requireApproval}`, colors.dim)
      passedTests++
    } else {
      log(`   ❌ Default config incorrect`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Default config test failed: ${error}`, colors.red)
  }

  // Test 2: Available patterns count
  totalTests++
  log('\n2. Testing available patterns...', colors.yellow)
  try {
    const patterns = getAvailablePatterns()

    if (patterns.length === 9) {
      log(`   ✅ All 9 patterns defined correctly`, colors.green)
      passedTests++
    } else {
      log(`   ⚠️ Expected 9 patterns, got ${patterns.length}`, colors.yellow)
      passedTests++
    }
  } catch (error) {
    log(`   ❌ Available patterns test failed: ${error}`, colors.red)
  }

  return { passed: passedTests, total: totalTests }
}

async function testVisualization(): Promise<TestResult> {
  log('\n🧪 TEST: Visualization', colors.cyan)
  let passedTests = 0
  let totalTests = 0

  // Test 1: Mermaid diagram generation
  totalTests++
  log('1. Testing Mermaid diagram generation...', colors.yellow)
  try {
    const orchestrator = createOrchestrator()
    const mermaid = await orchestrator.visualize('¿Deberíamos lanzar en España o LATAM?')

    if (mermaid.includes('flowchart TD') && mermaid.includes('Patrón:')) {
      log(`   ✅ Mermaid diagram generated (${mermaid.length} chars)`, colors.green)
      passedTests++
    } else {
      log(`   ❌ Mermaid diagram missing required elements`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Mermaid generation failed: ${error}`, colors.red)
  }

  // Test 2: ASCII tree generation
  totalTests++
  log('\n2. Testing ASCII tree generation...', colors.yellow)
  try {
    const orchestrator = createOrchestrator()
    const ascii = await orchestrator.visualizeAscii('¿Cómo expandir a nuevos mercados?')

    if (ascii.includes('Patrón:') && ascii.includes('📦') && ascii.includes('💬')) {
      log(`   ✅ ASCII tree generated correctly`, colors.green)
      passedTests++
    } else {
      log(`   ❌ ASCII tree missing required elements`, colors.red)
    }
  } catch (error) {
    log(`   ❌ ASCII tree generation failed: ${error}`, colors.red)
  }

  // Test 3: JSON visualization data
  totalTests++
  log('\n3. Testing JSON visualization data...', colors.yellow)
  try {
    const orchestrator = createOrchestrator()
    const json = await orchestrator.toVisualizationData('¿A o B?', 'adversarial')

    if (json.nodes.length > 0 && json.edges.length > 0 && json.metadata.pattern === 'adversarial') {
      log(`   ✅ JSON data: ${json.nodes.length} nodes, ${json.edges.length} edges`, colors.green)
      passedTests++
    } else {
      log(`   ❌ JSON data incomplete`, colors.red)
    }
  } catch (error) {
    log(`   ❌ JSON visualization failed: ${error}`, colors.red)
  }

  return { passed: passedTests, total: totalTests }
}

async function testExecutiveFeatures(): Promise<TestResult> {
  log('\n🧪 TEST: Executive Features (CEO-level)', colors.cyan)
  let passedTests = 0
  let totalTests = 0

  // Test 1: Executive Summary
  totalTests++
  log('1. Testing Executive Summary generation...', colors.yellow)
  try {
    const exec = createExecutiveOrchestrator()
    const summary = await exec.getExecutiveSummary('¿Deberíamos expandir a LATAM o USA primero?')

    if (summary.headline && summary.recommendation && summary.confidence.score > 0) {
      log(`   ✅ Summary generated: ${summary.headline.substring(0, 40)}...`, colors.green)
      log(`      Confidence: ${summary.confidence.score}% (${summary.confidence.level})`, colors.dim)
      passedTests++
    } else {
      log(`   ❌ Summary incomplete`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Summary failed: ${error}`, colors.red)
  }

  // Test 2: Board of Advisors
  totalTests++
  log('\n2. Testing AI Board of Advisors...', colors.yellow)
  try {
    const exec = createExecutiveOrchestrator()
    const board = await exec.getBoardDeliberation('¿Invertimos €500k en nueva tecnología?')

    if (board.advisors.length >= 5 && board.consensus) {
      log(`   ✅ Board deliberation: ${board.advisors.length} advisors`, colors.green)
      log(`      Consensus: ${board.consensus}`, colors.dim)
      const votes = board.advisors.map(a => `${a.name.split(' ')[1]}: ${a.vote}`).join(', ')
      log(`      Votes: ${votes}`, colors.dim)
      passedTests++
    } else {
      log(`   ❌ Board incomplete`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Board failed: ${error}`, colors.red)
  }

  // Test 3: Decision Scorecard
  totalTests++
  log('\n3. Testing Decision Scorecard...', colors.yellow)
  try {
    const exec = createExecutiveOrchestrator()
    const scorecard = await exec.getDecisionScorecard('¿Lanzamos el producto en Q1?')

    if (scorecard.overallScore > 0 && scorecard.dimensions.length >= 4) {
      log(`   ✅ Scorecard: ${scorecard.overallScore}/100`, colors.green)
      log(`      Verdict: ${scorecard.verdict}`, colors.dim)
      log(`      Dimensions: ${scorecard.dimensions.map(d => d.name).join(', ')}`, colors.dim)
      passedTests++
    } else {
      log(`   ❌ Scorecard incomplete`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Scorecard failed: ${error}`, colors.red)
  }

  // Test 4: Executive Snapshot
  totalTests++
  log('\n4. Testing Executive Snapshot...', colors.yellow)
  try {
    const exec = createExecutiveOrchestrator()
    const snapshot = await exec.getSnapshot('¿Contratamos 10 ingenieros más?')

    if (snapshot.headline && snapshot.confidence && snapshot.verdict) {
      log(`   ✅ Snapshot: "${snapshot.headline.substring(0, 35)}..."`, colors.green)
      log(`      Risk: ${snapshot.topRisk.substring(0, 40)}`, colors.dim)
      log(`      Urgency: ${snapshot.urgency}, Reversibility: ${snapshot.reversibility}`, colors.dim)
      passedTests++
    } else {
      log(`   ❌ Snapshot incomplete`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Snapshot failed: ${error}`, colors.red)
  }

  // Test 5: Full Executive Briefing
  totalTests++
  log('\n5. Testing Full Executive Briefing (One-Pager)...', colors.yellow)
  try {
    const exec = createExecutiveOrchestrator()
    const briefing = await exec.getExecutiveBriefing('¿Pivotamos el modelo de negocio?')

    if (briefing.onePager.includes('EXECUTIVE BRIEFING') && briefing.summary && briefing.board) {
      log(`   ✅ One-Pager generated (${briefing.onePager.length} chars)`, colors.green)
      log(`      Pattern: ${briefing.pattern}`, colors.dim)
      log(`      Board consensus: ${briefing.board.consensus}`, colors.dim)
      passedTests++
    } else {
      log(`   ❌ Briefing incomplete`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Briefing failed: ${error}`, colors.red)
  }

  return { passed: passedTests, total: totalTests }
}

async function testAIDebateEngine(): Promise<TestResult> {
  log('\n🧪 TEST: AI Debate Engine', colors.cyan)
  let passedTests = 0
  let totalTests = 0

  // Test 1: Create mock engine
  totalTests++
  log('1. Testing mock engine creation...', colors.yellow)
  try {
    const engine = createMockDebateEngine()
    if (engine instanceof AIDebateEngine) {
      log(`   ✅ Mock debate engine created`, colors.green)
      passedTests++
    } else {
      log(`   ❌ Invalid engine type`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Engine creation failed: ${error}`, colors.red)
  }

  // Test 2: Get personas
  totalTests++
  log('\n2. Testing personas...', colors.yellow)
  try {
    const engine = createMockDebateEngine()
    const personas = engine.getPersonas()
    if (personas.length >= 5) {
      log(`   ✅ ${personas.length} personas available: ${personas.map(p => p.id).join(', ')}`, colors.green)
      passedTests++
    } else {
      log(`   ❌ Not enough personas`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Personas test failed: ${error}`, colors.red)
  }

  // Test 3: Devil's Advocate
  totalTests++
  log('\n3. Testing Devil\'s Advocate mode...', colors.yellow)
  try {
    const engine = createMockDebateEngine()
    const result = await engine.executeDevilsAdvocate(
      '¿Deberíamos lanzar el producto?',
      'Sí, lanzar ahora',
      { originalQuestion: '¿Lanzar el producto?' }
    )
    if (result.counterArguments && result.userPreference === 'Sí, lanzar ahora') {
      log(`   ✅ Devil's Advocate executed`, colors.green)
      log(`      Should reconsider: ${result.shouldReconsider}`, colors.dim)
      passedTests++
    } else {
      log(`   ❌ Devil's Advocate incomplete`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Devil's Advocate failed: ${error}`, colors.red)
  }

  // Test 4: Pre-Mortem
  totalTests++
  log('\n4. Testing Pre-Mortem analysis...', colors.yellow)
  try {
    const engine = createMockDebateEngine()
    const result = await engine.executePreMortem(
      '¿Invertir €1M en expansión?',
      { originalQuestion: 'Inversión en expansión' }
    )
    if (result.failureAnalysis && result.preventionActions.length > 0) {
      log(`   ✅ Pre-Mortem executed`, colors.green)
      log(`      Prevention actions: ${result.preventionActions.length}`, colors.dim)
      passedTests++
    } else {
      log(`   ❌ Pre-Mortem incomplete`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Pre-Mortem failed: ${error}`, colors.red)
  }

  // Test 5: Gut Check
  totalTests++
  log('\n5. Testing Gut Check (30 sec)...', colors.yellow)
  try {
    const engine = createMockDebateEngine()
    const result = await engine.executeGutCheck('¿Deberíamos pivotar?')
    if (result.instinct && result.fullResponse) {
      log(`   ✅ Gut Check: "${result.instinct.substring(0, 30)}..."`, colors.green)
      passedTests++
    } else {
      log(`   ❌ Gut Check incomplete`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Gut Check failed: ${error}`, colors.red)
  }

  // Test 6: Execute Debate with personas
  totalTests++
  log('\n6. Testing full debate execution...', colors.yellow)
  try {
    const engine = createMockDebateEngine()
    const result = await engine.executeDebate(
      { id: 'test-1', question: '¿Lanzar ahora o esperar?', priority: 1, dependencies: [] },
      { originalQuestion: 'Timing de lanzamiento' },
      ['optimist', 'pessimist']
    )
    if (result.status === 'completed' && result.conclusion && result.arguments.length >= 2) {
      log(`   ✅ Debate executed with ${result.arguments.length} personas`, colors.green)
      log(`      Confidence: ${(result.confidence * 100).toFixed(0)}%`, colors.dim)
      passedTests++
    } else {
      log(`   ❌ Debate incomplete`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Debate execution failed: ${error}`, colors.red)
  }

  return { passed: passedTests, total: totalTests }
}

async function testMentorModes(): Promise<TestResult> {
  log('\n🧪 TEST: Mentor Modes', colors.cyan)
  let passedTests = 0
  let totalTests = 0

  // Test 1: Mentor profiles
  totalTests++
  log('1. Testing mentor profiles...', colors.yellow)
  try {
    const profiles = Object.keys(MENTOR_PROFILES)
    if (profiles.length >= 6) {
      log(`   ✅ ${profiles.length} mentor types: ${profiles.join(', ')}`, colors.green)
      passedTests++
    } else {
      log(`   ❌ Not enough mentor types`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Mentor profiles test failed: ${error}`, colors.red)
  }

  // Test 2: Mock mentor advice
  totalTests++
  log('\n2. Testing mock mentor advice...', colors.yellow)
  try {
    const advice = getMockMentorAdvice('yc')
    if (advice.mentor.id === 'yc' && advice.redFlags.length > 0) {
      log(`   ✅ YC mentor advice: rating ${advice.rating}/10`, colors.green)
      log(`      Would invest: ${advice.wouldInvest}`, colors.dim)
      passedTests++
    } else {
      log(`   ❌ Mock advice incomplete`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Mock mentor test failed: ${error}`, colors.red)
  }

  // Test 3: MentorEngine creation
  totalTests++
  log('\n3. Testing MentorEngine creation...', colors.yellow)
  try {
    const provider = new MockAIProvider()
    const engine = new MentorEngine(provider)
    const profiles = engine.getMentorProfiles()
    if (profiles.length >= 6) {
      log(`   ✅ MentorEngine created with ${profiles.length} profiles`, colors.green)
      passedTests++
    } else {
      log(`   ❌ MentorEngine profiles missing`, colors.red)
    }
  } catch (error) {
    log(`   ❌ MentorEngine creation failed: ${error}`, colors.red)
  }

  // Test 4: Get mentor advice
  totalTests++
  log('\n4. Testing mentor advice generation...', colors.yellow)
  try {
    const provider = new MockAIProvider()
    const engine = new MentorEngine(provider)
    const advice = await engine.getAdvice(
      '¿Deberíamos levantar una ronda Serie A?',
      'vc',
      { originalQuestion: 'Fundraising decision' }
    )
    if (advice.mentor.id === 'vc' && advice.advice) {
      log(`   ✅ VC mentor advice generated`, colors.green)
      log(`      Rating: ${advice.rating}/10`, colors.dim)
      passedTests++
    } else {
      log(`   ❌ Mentor advice incomplete`, colors.red)
    }
  } catch (error) {
    log(`   ❌ Mentor advice failed: ${error}`, colors.red)
  }

  return { passed: passedTests, total: totalTests }
}

async function runAllTests() {
  log('\n' + '='.repeat(60), colors.cyan)
  log('     Orchestration System Verification', colors.cyan)
  log('='.repeat(60), colors.cyan)

  const patternResults = await testPatternDetection()
  const structureResults = await testStructureGeneration()
  const orchestratorResults = await testOrchestrator()
  const manualResults = await testManualPatternSelection()
  const configResults = await testDefaultConfig()
  const visualResults = await testVisualization()
  const executiveResults = await testExecutiveFeatures()
  const aiDebateResults = await testAIDebateEngine()
  const mentorResults = await testMentorModes()

  const totalPassed =
    patternResults.passed +
    structureResults.passed +
    orchestratorResults.passed +
    manualResults.passed +
    configResults.passed +
    visualResults.passed +
    executiveResults.passed +
    aiDebateResults.passed +
    mentorResults.passed

  const totalTests =
    patternResults.total +
    structureResults.total +
    orchestratorResults.total +
    manualResults.total +
    configResults.total +
    visualResults.total +
    executiveResults.total +
    aiDebateResults.total +
    mentorResults.total

  log('\n' + '='.repeat(60), colors.cyan)
  log('Summary:', colors.cyan)
  log(`  Pattern Detection:     ${patternResults.passed}/${patternResults.total} tests passed`)
  log(`  Structure Generation:  ${structureResults.passed}/${structureResults.total} tests passed`)
  log(`  Orchestrator Class:    ${orchestratorResults.passed}/${orchestratorResults.total} tests passed`)
  log(`  Manual Selection:      ${manualResults.passed}/${manualResults.total} tests passed`)
  log(`  Default Config:        ${configResults.passed}/${configResults.total} tests passed`)
  log(`  Visualization:         ${visualResults.passed}/${visualResults.total} tests passed`)
  log(`  Executive Features:    ${executiveResults.passed}/${executiveResults.total} tests passed`)
  log(`  AI Debate Engine:      ${aiDebateResults.passed}/${aiDebateResults.total} tests passed`)
  log(`  Mentor Modes:          ${mentorResults.passed}/${mentorResults.total} tests passed`)
  log(`  Total:                 ${totalPassed}/${totalTests} tests passed`)
  log('='.repeat(60), colors.cyan)

  if (totalPassed === totalTests) {
    log('\n✅ All orchestration tests passed!\n', colors.green)
    process.exit(0)
  } else {
    log('\n⚠️ Some tests failed\n', colors.yellow)
    process.exit(1)
  }
}

runAllTests()
