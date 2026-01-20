/**
 * Test Manual del Auto-Healer
 *
 * Ejecutar: pnpm tsx scripts/test-auto-healer.ts
 */

import {
  parseTypeScriptErrors,
  parseESLintErrors,
  parseBuildErrors,
} from '../packages/workers/src/lib/error-parsers'
import { applyAutoFix } from '../packages/workers/src/lib/auto-fix-appliers'

// ============================================================================
// TEST DATA
// ============================================================================

const sampleTypeScriptOutput = `
apps/web/src/components/quoorum/advanced-charts.tsx(12,1): error TS1003: Identifier expected.
apps/web/src/components/quoorum/advanced-charts.tsx(12,8): error TS1005: ',' expected.
apps/web/src/components/quoorum/advanced-charts.tsx(17,3): error TS1005: ';' expected.
apps/web/src/components/quoorum/advanced-charts.tsx(39,1): error TS1109: Expression expected.
apps/web/src/lib/utils.ts(45,5): error TS2304: Cannot find name 'UnknownType'.
`

const sampleESLintOutput = `
apps/web/src/components/ui/button.tsx:23:5: error no-console Remove this console.log
packages/api/src/routers/clients.ts:145:7: warning @typescript-eslint/no-unused-vars 'tempVar' is defined but never used
apps/web/src/lib/auth.ts:78:3: error prefer-const 'user' is never reassigned. Use 'const' instead
`

const sampleBuildOutput = `
Module not found: Can't resolve '@radix-ui/react-tooltip'
SyntaxError: Unexpected token '}'
`

// ============================================================================
// TESTS
// ============================================================================

async function testParsers() {
  console.log('🧪 Testing Error Parsers...\n')

  // Test TypeScript parser
  console.log('📘 TypeScript Errors:')
  const tsErrors = parseTypeScriptErrors(sampleTypeScriptOutput)
  console.log(`  Found ${tsErrors.length} errors`)
  tsErrors.forEach((err) => {
    console.log(`  - ${err.file}:${err.line} [${err.severity}] ${err.message}`)
    console.log(`    Auto-fixable: ${err.autoFixable ? '✅' : '❌'}`)
    if (err.fixStrategy) {
      console.log(`    Strategy: ${err.fixStrategy}`)
    }
  })
  console.log()

  // Test ESLint parser
  console.log('🔧 ESLint Errors:')
  const eslintErrors = parseESLintErrors(sampleESLintOutput)
  console.log(`  Found ${eslintErrors.length} errors`)
  eslintErrors.forEach((err) => {
    console.log(`  - ${err.file}:${err.line} [${err.severity}] ${err.message}`)
    console.log(`    Auto-fixable: ${err.autoFixable ? '✅' : '❌'}`)
    if (err.fixStrategy) {
      console.log(`    Strategy: ${err.fixStrategy}`)
    }
  })
  console.log()

  // Test Build parser
  console.log('🏗️ Build Errors:')
  const buildErrors = parseBuildErrors(sampleBuildOutput)
  console.log(`  Found ${buildErrors.length} errors`)
  buildErrors.forEach((err) => {
    console.log(`  - ${err.message}`)
    console.log(`    Auto-fixable: ${err.autoFixable ? '✅' : '❌'}`)
  })
  console.log()
}

async function testFixApplier() {
  console.log('🔧 Testing Auto-Fix Appliers...\n')

  // Solo mostrar qué haría, no ejecutar realmente
  const testError = {
    type: 'typescript' as const,
    severity: 'safe' as const,
    file: 'apps/web/src/components/quoorum/advanced-charts.tsx',
    line: 12,
    column: 1,
    message: 'Identifier expected',
    code: 'TS1003',
    rawError: 'apps/web/src/components/quoorum/advanced-charts.tsx(12,1): error TS1003: Identifier expected.',
    autoFixable: true,
    fixStrategy: 'fix-malformed-imports',
  }

  console.log('📝 Would apply fix:')
  console.log(`  File: ${testError.file}`)
  console.log(`  Line: ${testError.line}`)
  console.log(`  Strategy: ${testError.fixStrategy}`)
  console.log(`  Severity: ${testError.severity}`)
  console.log()
  console.log('⚠️  Dry run mode - no files will be modified')
  console.log('   To actually apply fixes, run the worker via Inngest')
}

function showUsageExamples() {
  console.log('\n📚 Usage Examples:\n')

  console.log('1. Trigger worker manually:')
  console.log('   import { inngest } from "@quoorum/workers"')
  console.log('   await inngest.send({ name: "nextjs/auto-healer.trigger", data: {} })\n')

  console.log('2. Check worker status in Inngest Dashboard:')
  console.log('   https://app.inngest.com/projects/<your-project>/functions/nextjs-auto-healer\n')

  console.log('3. View applied fixes:')
  console.log('   grep "AUTO-HEALER" TIMELINE.md\n')

  console.log('4. Rollback a fix:')
  console.log('   git checkout HEAD~1 -- path/to/file.tsx\n')
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🔧 Auto-Healer Test Suite\n')
  console.log('=' .repeat(60))
  console.log()

  await testParsers()
  await testFixApplier()
  showUsageExamples()

  console.log('✅ Test suite completed')
}

main().catch(console.error)
