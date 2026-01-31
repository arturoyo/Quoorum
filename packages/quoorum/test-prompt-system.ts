/**
 * Test Script: AI Prompt Management System
 *
 * Verifica que el sistema de prompts dinámicos funciona correctamente:
 * - getPromptTemplate() resuelve prompts correctamente
 * - Selecciona modelos según performance level
 * - Fallback a configs hardcodeados funciona
 */

import { getPromptTemplate } from './src/lib/prompt-manager'

async function testPromptSystem() {
  console.log('🧪 Testing AI Prompt Management System\n')
  console.log('=' .repeat(50))

  // Test 1: Get prompt for each performance level
  console.log('\n📊 Test 1: Performance Levels')
  console.log('-'.repeat(50))

  const promptSlug = 'analyze-question'
  const variables = {
    question: '¿Deberíamos expandir a nuevos mercados?',
    context: 'Startup SaaS B2B con $2M ARR'
  }

  for (const level of ['economic', 'balanced', 'performance'] as const) {
    try {
      const resolved = await getPromptTemplate(promptSlug, variables, level)
      console.log(`\n✅ ${level.toUpperCase()}:`)
      console.log(`   Model: ${resolved.model}`)
      console.log(`   Temperature: ${resolved.temperature}`)
      console.log(`   MaxTokens: ${resolved.maxTokens}`)
      console.log(`   Template length: ${resolved.template.length} chars`)
      console.log(`   Variables replaced: ${resolved.template.includes('${') ? '❌ No' : '✅ Yes'}`)
    } catch (error) {
      console.log(`\n❌ ${level.toUpperCase()}: FAILED`)
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Test 2: Test framework prompts
  console.log('\n\n📊 Test 2: Framework Prompts')
  console.log('-'.repeat(50))

  const frameworkPrompts = [
    'framework-swot-strengths',
    'framework-pros',
    'framework-eisenhower-classifier',
  ]

  for (const slug of frameworkPrompts) {
    try {
      const resolved = await getPromptTemplate(slug, {}, 'balanced')
      console.log(`\n✅ ${slug}:`)
      console.log(`   Model: ${resolved.model}`)
    } catch (error) {
      console.log(`\n❌ ${slug}: FAILED`)
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Test 3: Test special mode prompts
  console.log('\n\n📊 Test 3: Special Mode Prompts')
  console.log('-'.repeat(50))

  const specialModes = [
    'special-mode-devils-advocate',
    'special-mode-pre-mortem',
    'special-mode-gut-check',
  ]

  for (const slug of specialModes) {
    try {
      const resolved = await getPromptTemplate(slug, {
        question: 'Test question',
        userPreference: 'Option A',
        companyContext: 'Test context'
      }, 'balanced')
      console.log(`\n✅ ${slug}:`)
      console.log(`   Model: ${resolved.model}`)
    } catch (error) {
      console.log(`\n❌ ${slug}: FAILED`)
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Test 4: Test final synthesis
  console.log('\n\n📊 Test 4: Final Synthesis Prompt')
  console.log('-'.repeat(50))

  try {
    const resolved = await getPromptTemplate('final-synthesis', {}, 'balanced')
    console.log(`\n✅ final-synthesis:`)
    console.log(`   Model: ${resolved.model}`)
    console.log(`   Template length: ${resolved.template.length} chars`)
  } catch (error) {
    console.log(`\n❌ final-synthesis: FAILED`)
    console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`)
  }

  console.log('\n\n' + '='.repeat(50))
  console.log('✅ Tests completed!')
  console.log('='.repeat(50))
}

// Run tests
testPromptSystem().catch((error) => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
