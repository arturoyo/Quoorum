#!/usr/bin/env npx ts-node
/**
 * Forum Package Exports Test
 *
 * Tests that the forum package exports are correctly set up for tRPC router integration.
 * Run with: FORUM_MOCK_MODE=true npx ts-node test-packageExports.ts
 */

async function testPackageExports() {
  console.log('='.repeat(60))
  console.log('Forum Package Exports Test')
  console.log('='.repeat(60))

  let passedTests = 0
  let totalTests = 0

  // Test 1: Main exports
  totalTests++
  console.log('\n1. Testing main index exports...')
  try {
    const mainExports = await import('./src/index.ts')
    const requiredExports = [
      'runDebate',
      'runDynamicDebate',
      'analyzeQuestion',
      'matchExperts',
      'analyzeDebateQuality',
      'shouldIntervene',
      'generateIntervention',
      'EXPERT_DATABASE',
    ]

    const missingExports = requiredExports.filter(exp => !(exp in mainExports))
    if (missingExports.length === 0) {
      console.log('   [OK] All required exports found')
      passedTests++
    } else {
      console.log(`   [ERROR] Missing exports: ${missingExports.join(', ')}`)
    }
  } catch (error) {
    console.log(`   [ERROR] Import failed: ${error}`)
  }

  // Test 2: Runner export
  totalTests++
  console.log('\n2. Testing runner export...')
  try {
    const runner = await import('./src/runner.ts')
    if ('runDebate' in runner && typeof runner.runDebate === 'function') {
      console.log('   [OK] runDebate function exported correctly')
      passedTests++
    } else {
      console.log('   [ERROR] runDebate not found or not a function')
    }
  } catch (error) {
    console.log(`   [ERROR] Import failed: ${error}`)
  }

  // Test 3: Runner-dynamic export
  totalTests++
  console.log('\n3. Testing runner-dynamic export...')
  try {
    const runnerDynamic = await import('./src/runner-dynamic.ts')
    if ('runDebate' in runnerDynamic && typeof runnerDynamic.runDebate === 'function') {
      console.log('   [OK] runDebate (dynamic) function exported correctly')
      passedTests++
    } else {
      console.log('   [ERROR] runDebate (dynamic) not found or not a function')
    }
  } catch (error) {
    console.log(`   [ERROR] Import failed: ${error}`)
  }

  // Test 4: Expert database export
  totalTests++
  console.log('\n4. Testing expert database export...')
  try {
    const expertDb = await import('./src/expert-database/index.ts')
    if ('EXPERT_DATABASE' in expertDb && typeof expertDb.EXPERT_DATABASE === 'object') {
      const expertCount = Object.keys(expertDb.EXPERT_DATABASE).length
      console.log(`   [OK] EXPERT_DATABASE exported with ${expertCount} experts`)
      passedTests++
    } else {
      console.log('   [ERROR] EXPERT_DATABASE not found or not an object')
    }
  } catch (error) {
    console.log(`   [ERROR] Import failed: ${error}`)
  }

  // Test 5: Quality monitor export
  totalTests++
  console.log('\n5. Testing quality monitor export...')
  try {
    const qualityMonitor = await import('./src/quality-monitor.ts')
    if ('analyzeDebateQuality' in qualityMonitor) {
      console.log('   [OK] Quality monitor functions exported')
      passedTests++
    } else {
      console.log('   [ERROR] analyzeDebateQuality not found')
    }
  } catch (error) {
    console.log(`   [ERROR] Import failed: ${error}`)
  }

  // Test 6: Meta-moderator export
  totalTests++
  console.log('\n6. Testing meta-moderator export...')
  try {
    const metaMod = await import('./src/meta-moderator.ts')
    if ('shouldIntervene' in metaMod && 'generateIntervention' in metaMod) {
      console.log('   [OK] Meta-moderator functions exported')
      passedTests++
    } else {
      console.log('   [ERROR] Meta-moderator functions not found')
    }
  } catch (error) {
    console.log(`   [ERROR] Import failed: ${error}`)
  }

  // Test 7: Learning system export
  totalTests++
  console.log('\n7. Testing learning system export...')
  try {
    const learning = await import('./src/learning-system.ts')
    if ('getExpertPerformance' in learning && 'updateExpertPerformance' in learning) {
      console.log('   [OK] Learning system functions exported')
      passedTests++
    } else {
      console.log('   [ERROR] Learning system functions not found')
    }
  } catch (error) {
    console.log(`   [ERROR] Import failed: ${error}`)
  }

  // Test 8: Types export
  totalTests++
  console.log('\n8. Testing types export...')
  try {
    const types = await import('./src/types.ts')
    const requiredTypes = ['DebateResult', 'DebateRound', 'DebateMessage']
    // Note: Types are compile-time only, we just verify the module loads
    console.log('   [OK] Types module loads correctly')
    passedTests++
  } catch (error) {
    console.log(`   [ERROR] Import failed: ${error}`)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log(`Results: ${passedTests}/${totalTests} tests passed`)
  console.log('='.repeat(60))

  return passedTests === totalTests
}

// Run tests
testPackageExports()
  .then(success => {
    if (!success) {
      process.exit(1)
    }
    console.log('\n[OK] All package export tests passed!\n')
  })
  .catch(error => {
    console.error('Test error:', error)
    process.exit(1)
  })
