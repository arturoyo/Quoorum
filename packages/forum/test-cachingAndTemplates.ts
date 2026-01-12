/**
 * Test script for Caching System and Templates
 *
 * Ejecutar: tsx packages/forum/test-cachingAndTemplates.ts
 */

import {
  generateCacheKey,
  getCachedDebate,
  cacheDebate,
  getCacheStats,
  clearExpiredCache,
  cacheExpertResponse,
  getCachedExpertResponse,
  cacheEmbedding,
  getCachedEmbedding,
  clearAllCache,
  getCacheRecommendations,
} from './src/caching.ts'

import {
  createTemplate,
  getTemplate,
  listTemplates,
  renderTemplate,
  deleteTemplate,
  initializePredefinedTemplates,
  getPopularTemplates,
  PREDEFINED_TEMPLATES,
} from './src/custom-templates.ts'

import {
  ALL_TEMPLATES,
  getTemplatesByIndustry,
  getTemplatesByCategory,
  getTemplateById,
  searchTemplates,
} from './src/templates.ts'

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

async function testCaching() {
  log('\n🧪 TEST: Caching System\n', colors.cyan)

  let passedTests = 0
  let totalTests = 0

  // Clear cache before tests
  await clearAllCache()

  // Test 1: generateCacheKey
  totalTests++
  log('1. Testing generateCacheKey()...', colors.yellow)
  try {
    const key1 = generateCacheKey('Test question?')
    const key2 = generateCacheKey('TEST QUESTION?')
    const key3 = generateCacheKey('Different question')

    if (key1 === key2 && key1 !== key3) {
      log('   ✅ generateCacheKey() normalizes questions correctly', colors.green)
      passedTests++
    } else {
      log('   ❌ Key normalization failed', colors.red)
    }
  } catch (error) {
    log(`   ❌ generateCacheKey() failed: ${error}`, colors.red)
  }

  // Test 2: cacheDebate and getCachedDebate
  totalTests++
  log('\n2. Testing cacheDebate/getCachedDebate()...', colors.yellow)
  try {
    const mockResult = { consensusScore: 0.85, question: 'Test' }
    await cacheDebate('Cache test question', mockResult)
    const cached = await getCachedDebate('Cache test question')

    if (cached && cached.consensusScore === 0.85) {
      log('   ✅ cacheDebate/getCachedDebate() work correctly', colors.green)
      passedTests++
    } else {
      log('   ❌ Cache retrieval failed', colors.red)
    }
  } catch (error) {
    log(`   ❌ cacheDebate/getCachedDebate() failed: ${error}`, colors.red)
  }

  // Test 3: getCacheStats
  totalTests++
  log('\n3. Testing getCacheStats()...', colors.yellow)
  try {
    const stats = await getCacheStats()

    if (stats.entriesCount >= 1) {
      log(`   ✅ getCacheStats() returns valid stats (entries: ${stats.entriesCount})`, colors.green)
      passedTests++
    } else {
      log('   ❌ Cache stats incorrect', colors.red)
    }
  } catch (error) {
    log(`   ❌ getCacheStats() failed: ${error}`, colors.red)
  }

  // Test 4: cacheExpertResponse
  totalTests++
  log('\n4. Testing cacheExpertResponse/getCachedExpertResponse()...', colors.yellow)
  try {
    await cacheExpertResponse('patrick-campbell', 'pricing question', 'Expert response here')
    const response = await getCachedExpertResponse('patrick-campbell', 'pricing question')

    if (response === 'Expert response here') {
      log('   ✅ Expert response caching works', colors.green)
      passedTests++
    } else {
      log('   ❌ Expert response caching failed', colors.red)
    }
  } catch (error) {
    log(`   ❌ cacheExpertResponse failed: ${error}`, colors.red)
  }

  // Test 5: cacheEmbedding
  totalTests++
  log('\n5. Testing cacheEmbedding/getCachedEmbedding()...', colors.yellow)
  try {
    const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5]
    await cacheEmbedding('test text', mockEmbedding)
    const cached = await getCachedEmbedding('test text')

    if (cached && cached.length === 5 && cached[0] === 0.1) {
      log('   ✅ Embedding caching works', colors.green)
      passedTests++
    } else {
      log('   ❌ Embedding caching failed', colors.red)
    }
  } catch (error) {
    log(`   ❌ cacheEmbedding failed: ${error}`, colors.red)
  }

  // Test 6: getCacheRecommendations
  totalTests++
  log('\n6. Testing getCacheRecommendations()...', colors.yellow)
  try {
    const recommendations = await getCacheRecommendations()

    if (Array.isArray(recommendations)) {
      log(`   ✅ getCacheRecommendations() returns ${recommendations.length} recommendations`, colors.green)
      passedTests++
    } else {
      log('   ❌ Recommendations format invalid', colors.red)
    }
  } catch (error) {
    log(`   ❌ getCacheRecommendations() failed: ${error}`, colors.red)
  }

  // Test 7: clearExpiredCache
  totalTests++
  log('\n7. Testing clearExpiredCache()...', colors.yellow)
  try {
    const cleared = await clearExpiredCache()

    if (typeof cleared === 'number') {
      log(`   ✅ clearExpiredCache() cleared ${cleared} entries`, colors.green)
      passedTests++
    } else {
      log('   ❌ Clear expired cache failed', colors.red)
    }
  } catch (error) {
    log(`   ❌ clearExpiredCache() failed: ${error}`, colors.red)
  }

  return { passed: passedTests, total: totalTests }
}

async function testTemplates() {
  log('\n🧪 TEST: Templates System\n', colors.cyan)

  let passedTests = 0
  let totalTests = 0

  // Test 1: Industry Templates (ALL_TEMPLATES)
  totalTests++
  log('1. Testing ALL_TEMPLATES...', colors.yellow)
  try {
    if (ALL_TEMPLATES && ALL_TEMPLATES.length > 0) {
      log(`   ✅ ALL_TEMPLATES has ${ALL_TEMPLATES.length} templates`, colors.green)
      passedTests++
    } else {
      log('   ❌ ALL_TEMPLATES is empty or undefined', colors.red)
    }
  } catch (error) {
    log(`   ❌ ALL_TEMPLATES failed: ${error}`, colors.red)
  }

  // Test 2: getTemplatesByIndustry
  totalTests++
  log('\n2. Testing getTemplatesByIndustry()...', colors.yellow)
  try {
    const saasTemplates = getTemplatesByIndustry('SaaS')

    if (saasTemplates && saasTemplates.length > 0) {
      log(`   ✅ Found ${saasTemplates.length} SaaS templates`, colors.green)
      passedTests++
    } else {
      log('   ❌ No SaaS templates found', colors.red)
    }
  } catch (error) {
    log(`   ❌ getTemplatesByIndustry() failed: ${error}`, colors.red)
  }

  // Test 3: getTemplatesByCategory
  totalTests++
  log('\n3. Testing getTemplatesByCategory()...', colors.yellow)
  try {
    const pricingTemplates = getTemplatesByCategory('Pricing')

    if (pricingTemplates && pricingTemplates.length > 0) {
      log(`   ✅ Found ${pricingTemplates.length} Pricing templates`, colors.green)
      passedTests++
    } else {
      log('   ❌ No Pricing templates found', colors.red)
    }
  } catch (error) {
    log(`   ❌ getTemplatesByCategory() failed: ${error}`, colors.red)
  }

  // Test 4: searchTemplates
  totalTests++
  log('\n4. Testing searchTemplates()...', colors.yellow)
  try {
    const results = searchTemplates('pricing')

    if (results && results.length > 0) {
      log(`   ✅ searchTemplates() found ${results.length} results for "pricing"`, colors.green)
      passedTests++
    } else {
      log('   ❌ No search results found', colors.red)
    }
  } catch (error) {
    log(`   ❌ searchTemplates() failed: ${error}`, colors.red)
  }

  // Test 5: Custom Templates CRUD
  totalTests++
  log('\n5. Testing Custom Templates CRUD...', colors.yellow)
  try {
    const template = createTemplate('test-user', {
      name: 'Test Template',
      description: 'A test template',
      category: 'Test',
      questionTemplate: 'Should we {{action}}?',
      variables: [
        { name: 'action', label: 'Action', type: 'text', required: true },
      ],
      defaultMode: 'dynamic',
      defaultRounds: 5,
      tags: ['test'],
      isPublic: false,
    })

    const retrieved = getTemplate(template.id)
    const deleted = deleteTemplate(template.id)

    if (retrieved && retrieved.name === 'Test Template' && deleted) {
      log('   ✅ Custom template CRUD works', colors.green)
      passedTests++
    } else {
      log('   ❌ Custom template CRUD failed', colors.red)
    }
  } catch (error) {
    log(`   ❌ Custom templates CRUD failed: ${error}`, colors.red)
  }

  // Test 6: renderTemplate
  totalTests++
  log('\n6. Testing renderTemplate()...', colors.yellow)
  try {
    // Create a template first
    const template = createTemplate('test-user', {
      name: 'Render Test',
      description: 'Test rendering',
      category: 'Test',
      questionTemplate: 'Should we build {{feature}} for {{market}}?',
      variables: [
        { name: 'feature', label: 'Feature', type: 'text', required: true },
        { name: 'market', label: 'Market', type: 'text', required: true },
      ],
      defaultMode: 'dynamic',
      defaultRounds: 5,
      tags: ['test'],
      isPublic: false,
    })

    const rendered = renderTemplate(template.id, { feature: 'AI Assistant', market: 'SMB' })

    if (rendered && rendered.question === 'Should we build AI Assistant for SMB?') {
      log('   ✅ renderTemplate() works correctly', colors.green)
      passedTests++
    } else {
      log(`   ❌ renderTemplate() produced: ${rendered?.question}`, colors.red)
    }

    deleteTemplate(template.id)
  } catch (error) {
    log(`   ❌ renderTemplate() failed: ${error}`, colors.red)
  }

  // Test 7: Predefined Templates
  totalTests++
  log('\n7. Testing Predefined Templates...', colors.yellow)
  try {
    if (PREDEFINED_TEMPLATES && PREDEFINED_TEMPLATES.length > 0) {
      log(`   ✅ PREDEFINED_TEMPLATES has ${PREDEFINED_TEMPLATES.length} templates`, colors.green)
      passedTests++
    } else {
      log('   ❌ No predefined templates', colors.red)
    }
  } catch (error) {
    log(`   ❌ Predefined templates failed: ${error}`, colors.red)
  }

  return { passed: passedTests, total: totalTests }
}

async function runAllTests() {
  log('\n' + '='.repeat(60), colors.cyan)
  log('     Phase 7: Caching & Templates Verification', colors.cyan)
  log('='.repeat(60), colors.cyan)

  const cachingResults = await testCaching()
  const templatesResults = await testTemplates()

  const totalPassed = cachingResults.passed + templatesResults.passed
  const totalTests = cachingResults.total + templatesResults.total

  log('\n' + '='.repeat(60), colors.cyan)
  log('Summary:', colors.cyan)
  log(`  Caching:   ${cachingResults.passed}/${cachingResults.total} tests passed`)
  log(`  Templates: ${templatesResults.passed}/${templatesResults.total} tests passed`)
  log(`  Total:     ${totalPassed}/${totalTests} tests passed`)
  log('='.repeat(60), colors.cyan)

  if (totalPassed === totalTests) {
    log('\n✅ All Phase 7 tests passed!\n', colors.green)
    process.exit(0)
  } else {
    log('\n⚠️ Some tests failed\n', colors.yellow)
    process.exit(1)
  }
}

runAllTests()
