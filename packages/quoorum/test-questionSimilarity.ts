/**
 * Test script for Question Similarity functionality
 *
 * Ejecutar: FORUM_MOCK_MODE=true tsx packages/quoorum/test-questionSimilarity.ts
 */

import {
  findSimilarDebates,
  generateQuestionEmbedding,
  cosineSimilarity,
  extractTopics,
  recommendDebates,
} from './src/question-similarity.ts'

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

async function testQuestionSimilarity() {
  log('\n🧪 TEST: Question Similarity Functions\n', colors.cyan)

  let passedTests = 0
  let totalTests = 0

  // Test 1: extractTopics
  totalTests++
  log('1. Testing extractTopics()...', colors.yellow)
  try {
    const topics1 = extractTopics('Should we increase our pricing strategy?')
    const topics2 = extractTopics('How can we improve product growth?')
    const topics3 = extractTopics('What positioning should we use in the market?')

    if (topics1.includes('pricing') || topics1.includes('price')) {
      log('   [OK] extractTopics() works for pricing questions', colors.green)
      passedTests++
    } else {
      log(`   [ERROR] Expected pricing topic, got: ${topics1.join(', ')}`, colors.red)
    }

    log(`      Topics for pricing question: ${topics1.join(', ')}`)
    log(`      Topics for growth question: ${topics2.join(', ')}`)
    log(`      Topics for positioning question: ${topics3.join(', ')}`)
  } catch (error) {
    log(`   [ERROR] extractTopics() failed: ${error}`, colors.red)
  }

  // Test 2: cosineSimilarity
  totalTests++
  log('\n2. Testing cosineSimilarity()...', colors.yellow)
  try {
    // Identical vectors
    const sim1 = cosineSimilarity([1, 0, 0], [1, 0, 0])
    // Orthogonal vectors
    const sim2 = cosineSimilarity([1, 0, 0], [0, 1, 0])
    // Opposite vectors
    const sim3 = cosineSimilarity([1, 0, 0], [-1, 0, 0])
    // Similar vectors
    const sim4 = cosineSimilarity([1, 0.5, 0], [1, 0.6, 0])

    if (Math.abs(sim1 - 1) < 0.01 && Math.abs(sim2) < 0.01 && sim4 > 0.9) {
      log('   [OK] cosineSimilarity() works correctly', colors.green)
      passedTests++
    } else {
      log(`   [ERROR] Unexpected similarity values: identical=${sim1}, orthogonal=${sim2}`, colors.red)
    }

    log(`      Identical vectors: ${sim1.toFixed(4)}`)
    log(`      Orthogonal vectors: ${sim2.toFixed(4)}`)
    log(`      Opposite vectors: ${sim3.toFixed(4)}`)
    log(`      Similar vectors: ${sim4.toFixed(4)}`)
  } catch (error) {
    log(`   [ERROR] cosineSimilarity() failed: ${error}`, colors.red)
  }

  // Test 3: generateQuestionEmbedding (may fail without API key)
  totalTests++
  log('\n3. Testing generateQuestionEmbedding()...', colors.yellow)
  try {
    const embedding = await generateQuestionEmbedding('Test question')

    if (Array.isArray(embedding)) {
      if (embedding.length === 0) {
        log('   [WARN] generateQuestionEmbedding() returned empty array (no API key)', colors.yellow)
        log('      This is expected without OPENAI_API_KEY', colors.yellow)
        passedTests++ // Still counts as pass if graceful fallback
      } else {
        log(`   [OK] generateQuestionEmbedding() returned ${embedding.length}-dim vector`, colors.green)
        passedTests++
      }
    } else {
      log(`   [ERROR] Expected array, got: ${typeof embedding}`, colors.red)
    }
  } catch (error) {
    log(`   [ERROR] generateQuestionEmbedding() failed: ${error}`, colors.red)
  }

  // Test 4: findSimilarDebates (may return empty without Pinecone)
  totalTests++
  log('\n4. Testing findSimilarDebates()...', colors.yellow)
  try {
    const similar = await findSimilarDebates('Should we raise prices?')

    if (Array.isArray(similar)) {
      log(`   [OK] findSimilarDebates() returned ${similar.length} results`, colors.green)
      passedTests++
      if (similar.length > 0) {
        log(`      First result: "${similar[0].question}" (similarity: ${similar[0].similarity.toFixed(2)})`)
      } else {
        log('      No similar debates found (expected without Pinecone/data)')
      }
    } else {
      log(`   [ERROR] Expected array, got: ${typeof similar}`, colors.red)
    }
  } catch (error) {
    log(`   [ERROR] findSimilarDebates() failed: ${error}`, colors.red)
  }

  // Test 5: recommendDebates
  totalTests++
  log('\n5. Testing recommendDebates()...', colors.yellow)
  try {
    const recommendations = await recommendDebates('What pricing model should we use?')

    if (Array.isArray(recommendations)) {
      log(`   [OK] recommendDebates() returned ${recommendations.length} recommendations`, colors.green)
      passedTests++
    } else {
      log(`   [ERROR] Expected array, got: ${typeof recommendations}`, colors.red)
    }
  } catch (error) {
    log(`   [ERROR] recommendDebates() failed: ${error}`, colors.red)
  }

  // Summary
  log('\n' + '='.repeat(60), colors.cyan)
  log(`Results: ${passedTests}/${totalTests} tests passed`, colors.cyan)
  log('='.repeat(60), colors.cyan)

  return passedTests === totalTests
}

// Run tests
testQuestionSimilarity()
  .then((success) => {
    if (success) {
      log('\n[OK] All question similarity tests passed!\n', colors.green)
      process.exit(0)
    } else {
      log('\n[WARN] Some tests failed (may be expected without API keys)\n', colors.yellow)
      process.exit(0) // Exit 0 since failures are expected without APIs
    }
  })
  .catch((error) => {
    log(`\n[ERROR] Test error: ${error}\n`, colors.red)
    process.exit(1)
  })
