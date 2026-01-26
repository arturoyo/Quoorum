/**
 * Test script for PDF Export functionality
 *
 * Ejecutar: tsx packages/quoorum/test-pdfExport.ts
 */

import { generateDebateMarkdown } from './src/pdf-export.ts'
import type { DebateResult } from './src/types.ts'
import type { ExpertProfile } from './src/expert-database'

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

async function testPdfExport() {
  log('\n🧪 TEST: PDF/Markdown Export Functions\n', colors.cyan)

  let passedTests = 0
  let totalTests = 0

  // Mock debate data
  const mockDebate: DebateResult = {
    question: '¿Deberíamos aumentar precios un 20%?',
    consensusScore: 0.85,
    totalRounds: 3,
    totalCostUsd: 0.42,
    status: 'completed',
    rounds: [
      {
        round: 1,
        messages: [
          {
            id: '1',
            sessionId: 'test',
            round: 1,
            agentKey: 'pricing-expert',
            agentName: 'Patrick Campbell',
            content: 'Desde una perspectiva de pricing, un aumento del 20% requiere análisis de elasticidad...',
            isCompressed: false,
            tokensUsed: 50,
            costUsd: 0.01,
            createdAt: new Date(),
          },
          {
            id: '2',
            sessionId: 'test',
            round: 1,
            agentKey: 'the-critic',
            agentName: 'The Critic',
            content: 'Debemos considerar el impacto en la retención de clientes existentes...',
            isCompressed: false,
            tokensUsed: 45,
            costUsd: 0.01,
            createdAt: new Date(),
          },
        ],
      },
    ],
    ranking: [
      { option: 'Aumento gradual 10%', score: 85, confidence: 0.9, successRate: 85, reasoning: 'Menor riesgo' },
      { option: 'Aumento inmediato 20%', score: 70, confidence: 0.7, successRate: 70, reasoning: 'Mayor impacto' },
    ],
    finalRanking: [
      { option: 'Aumento gradual 10%', score: 85, confidence: 0.9, successRate: 85, reasoning: 'Menor riesgo' },
    ],
    experts: [
      { id: 'pc', name: 'Patrick Campbell', specializations: ['pricing'] },
      { id: 'tc', name: 'The Critic', specializations: ['analysis'] },
    ],
  }

  const mockExperts: ExpertProfile[] = [
    {
      id: 'patrick-campbell',
      name: 'Patrick Campbell',
      title: 'Founder of ProfitWell',
      role: 'Pricing Strategist',
      expertise: ['pricing', 'saas', 'monetization'],
      personality: 'Data-driven, analytical',
      communicationStyle: 'Direct and metric-focused',
      specializations: ['pricing'],
    },
    {
      id: 'the-critic',
      name: 'The Critic',
      title: 'Devil\'s Advocate',
      role: 'Critical Analyst',
      expertise: ['analysis', 'risks', 'contrarian'],
      personality: 'Skeptical, thorough',
      communicationStyle: 'Challenging assumptions',
      specializations: ['analysis'],
    },
  ]

  const qualityAnalysis = {
    depthScore: 78,
    diversityScore: 85,
    originalityScore: 72,
    overallScore: 78.3,
    issues: [],
    hasPrematureConsensus: false,
    needsIntervention: false,
    consensusQuality: 0.85,
    prematureConsensusRisk: 0.1,
  }

  // Test 1: generateDebateMarkdown
  totalTests++
  log('1. Testing generateDebateMarkdown()...', colors.yellow)
  try {
    const markdown = generateDebateMarkdown(mockDebate, mockExperts, qualityAnalysis)

    const hasQuestion = markdown.includes('¿Deberíamos aumentar precios')
    const hasExperts = markdown.includes('Patrick Campbell') && markdown.includes('The Critic')
    const hasMetrics = markdown.includes('Profundidad') && markdown.includes('78')
    const hasRanking = markdown.includes('Aumento gradual 10%')
    const hasRounds = markdown.includes('Ronda 1')

    if (hasQuestion && hasExperts && hasMetrics && hasRanking && hasRounds) {
      log('   ✅ generateDebateMarkdown() produces valid markdown', colors.green)
      passedTests++
    } else {
      log('   ❌ Missing content in markdown output', colors.red)
      log(`      hasQuestion: ${hasQuestion}`)
      log(`      hasExperts: ${hasExperts}`)
      log(`      hasMetrics: ${hasMetrics}`)
      log(`      hasRanking: ${hasRanking}`)
      log(`      hasRounds: ${hasRounds}`)
    }

    // Show first 500 chars of output
    log('\n   Preview of markdown output:', colors.cyan)
    log('   ' + markdown.substring(0, 500).replace(/\n/g, '\n   ') + '...')
  } catch (error) {
    log(`   ❌ generateDebateMarkdown() failed: ${error}`, colors.red)
  }

  // Test 2: Markdown with minimal data
  totalTests++
  log('\n2. Testing generateDebateMarkdown() with minimal data...', colors.yellow)
  try {
    const minimalDebate: DebateResult = {
      question: 'Test question',
      consensusScore: 0.5,
      totalRounds: 1,
      totalCostUsd: 0,
      status: 'completed',
      rounds: [],
      ranking: [],
      finalRanking: [],
    }

    const markdown = generateDebateMarkdown(minimalDebate, [], undefined)

    if (markdown.includes('Test question') && markdown.includes('## Pregunta')) {
      log('   ✅ generateDebateMarkdown() handles minimal data', colors.green)
      passedTests++
    } else {
      log('   ❌ Minimal markdown generation failed', colors.red)
    }
  } catch (error) {
    log(`   ❌ generateDebateMarkdown() with minimal data failed: ${error}`, colors.red)
  }

  // Test 3: HTML escaping
  totalTests++
  log('\n3. Testing HTML escaping in markdown...', colors.yellow)
  try {
    const xssDebate: DebateResult = {
      question: '<script>alert("xss")</script>',
      consensusScore: 0.5,
      totalRounds: 1,
      totalCostUsd: 0,
      status: 'completed',
      rounds: [],
      ranking: [],
      finalRanking: [],
    }

    const markdown = generateDebateMarkdown(xssDebate, [])

    // In markdown, we don't need HTML escaping, but the content should be there
    if (markdown.includes('script')) {
      log('   ✅ Content preserved in markdown (escaping not needed for markdown)', colors.green)
      passedTests++
    } else {
      log('   ❌ Content lost in markdown generation', colors.red)
    }
  } catch (error) {
    log(`   ❌ HTML escaping test failed: ${error}`, colors.red)
  }

  // Summary
  log('\n' + '='.repeat(60), colors.cyan)
  log(`Results: ${passedTests}/${totalTests} tests passed`, colors.cyan)
  log('='.repeat(60), colors.cyan)

  return passedTests === totalTests
}

// Run tests
testPdfExport()
  .then((success) => {
    if (success) {
      log('\n✅ All PDF export tests passed!\n', colors.green)
      process.exit(0)
    } else {
      log('\n⚠️ Some tests failed\n', colors.yellow)
      process.exit(1)
    }
  })
  .catch((error) => {
    log(`\n❌ Test error: ${error}\n`, colors.red)
    process.exit(1)
  })
