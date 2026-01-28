/**
 * Automated Project Audit Script
 *
 * Executes comprehensive code quality, security, and testing checks.
 * Generates a detailed markdown report with scores and recommendations.
 *
 * Usage:
 *   pnpm audit          # Run full audit
 *   pnpm audit --quick  # Run quick audit (skip tests)
 */

import { execSync } from 'child_process'
import { readdirSync, readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { writeFileSync } from 'fs'

// ============================================================================
// CONFIGURATION
// ============================================================================

const ROOT_DIR = process.cwd()
const PACKAGES_DIR = join(ROOT_DIR, 'packages')
const APPS_DIR = join(ROOT_DIR, 'apps')

const EXCLUDED_DIRS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.turbo',
  'coverage',
  'playwright-report',
]

const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']
const TEST_PATTERNS = ['.test.', '.spec.', '__tests__']

// ============================================================================
// UTILITIES
// ============================================================================

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  if (!existsSync(dir)) return fileList

  const files = readdirSync(dir)

  files.forEach((file) => {
    const filePath = join(dir, file)
    const stat = statSync(filePath)

    if (stat.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(file)) {
        getAllFiles(filePath, fileList)
      }
    } else {
      const ext = file.substring(file.lastIndexOf('.'))
      if (CODE_EXTENSIONS.includes(ext)) {
        fileList.push(filePath)
      }
    }
  })

  return fileList
}

function isTestFile(filePath: string): boolean {
  return TEST_PATTERNS.some((pattern) => filePath.includes(pattern))
}

function countInFile(filePath: string, pattern: RegExp): number {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const matches = content.match(pattern)
    return matches ? matches.length : 0
  } catch {
    return 0
  }
}

function execCommand(command: string): { stdout: string; stderr: string; success: boolean } {
  try {
    const stdout = execSync(command, { encoding: 'utf-8', cwd: ROOT_DIR })
    return { stdout, stderr: '', success: true }
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || '',
      success: false,
    }
  }
}

// ============================================================================
// AUDIT CHECKS
// ============================================================================

interface AuditResult {
  category: string
  score: number
  maxScore: number
  details: string[]
  warnings: string[]
  errors: string[]
}

// ----------------------------------------------------------------------------
// 1. TypeScript Strictness
// ----------------------------------------------------------------------------

function auditTypeScript(): AuditResult {
  const result: AuditResult = {
    category: 'TypeScript Strictness',
    score: 0,
    maxScore: 100,
    details: [],
    warnings: [],
    errors: [],
  }

  // Count any types
  const allFiles = getAllFiles(ROOT_DIR).filter((f) => !isTestFile(f))
  let anyCount = 0
  let tsIgnoreCount = 0
  let tsExpectErrorCount = 0

  allFiles.forEach((file) => {
    anyCount += countInFile(file, /:\s*any\b/g)
    tsIgnoreCount += countInFile(file, /@ts-ignore/g)
    tsExpectErrorCount += countInFile(file, /@ts-expect-error/g)
  })

  result.details.push(`Total files analyzed: ${allFiles.length}`)
  result.details.push(`'any' types found: ${anyCount}`)
  result.details.push(`@ts-ignore directives: ${tsIgnoreCount}`)
  result.details.push(`@ts-expect-error directives: ${tsExpectErrorCount}`)

  // Scoring
  let score = 100

  if (anyCount > 0) {
    score -= Math.min(anyCount * 2, 30)
    result.warnings.push(`Found ${anyCount} 'any' types (target: 0)`)
  }

  if (tsIgnoreCount > 0) {
    score -= Math.min(tsIgnoreCount * 5, 40)
    result.errors.push(`Found ${tsIgnoreCount} @ts-ignore directives (target: 0)`)
  }

  if (tsExpectErrorCount > 3) {
    score -= Math.min((tsExpectErrorCount - 3) * 2, 10)
    result.warnings.push(`Found ${tsExpectErrorCount} @ts-expect-error directives`)
  }

  result.score = Math.max(0, score)

  // Run typecheck
  result.details.push('\nRunning pnpm typecheck...')
  const typecheck = execCommand('pnpm typecheck')

  if (typecheck.success) {
    result.details.push('[OK] TypeScript compilation passed')
  } else {
    result.score = Math.max(0, result.score - 20)
    result.errors.push('TypeScript compilation failed')
    result.details.push('[ERROR] TypeScript compilation failed')
  }

  return result
}

// ----------------------------------------------------------------------------
// 2. Code Quality
// ----------------------------------------------------------------------------

function auditCodeQuality(): AuditResult {
  const result: AuditResult = {
    category: 'Code Quality',
    score: 0,
    maxScore: 100,
    details: [],
    warnings: [],
    errors: [],
  }

  // Count console.log in production code
  const prodFiles = getAllFiles(ROOT_DIR).filter(
    (f) => !isTestFile(f) && !f.includes('scripts/') && !f.includes('cli.ts')
  )

  let consoleLogCount = 0
  const filesWithConsole: string[] = []

  prodFiles.forEach((file) => {
    const count = countInFile(file, /console\.(log|error|warn|info|debug)/g)
    if (count > 0) {
      consoleLogCount += count
      filesWithConsole.push(`${file.replace(ROOT_DIR, '.')} (${count})`)
    }
  })

  result.details.push(`Production files analyzed: ${prodFiles.length}`)
  result.details.push(`console.* statements: ${consoleLogCount}`)

  if (filesWithConsole.length > 0) {
    result.details.push('\nFiles with console statements:')
    filesWithConsole.slice(0, 10).forEach((f) => result.details.push(`  - ${f}`))
    if (filesWithConsole.length > 10) {
      result.details.push(`  ... and ${filesWithConsole.length - 10} more`)
    }
  }

  // Scoring
  let score = 100

  if (consoleLogCount > 5) {
    score -= Math.min((consoleLogCount - 5) * 3, 30)
    result.warnings.push(`Found ${consoleLogCount} console.* statements in production code`)
  }

  // Run ESLint
  result.details.push('\nRunning pnpm lint...')
  const lint = execCommand('pnpm lint')

  if (lint.success) {
    result.details.push('[OK] ESLint passed')
  } else {
    score -= 20
    result.warnings.push('ESLint found issues')
    result.details.push('[WARN] ESLint found issues')
  }

  result.score = Math.max(0, score)
  return result
}

// ----------------------------------------------------------------------------
// 3. Testing
// ----------------------------------------------------------------------------

function auditTesting(quick: boolean): AuditResult {
  const result: AuditResult = {
    category: 'Testing',
    score: 0,
    maxScore: 100,
    details: [],
    warnings: [],
    errors: [],
  }

  // Count test files
  const allFiles = getAllFiles(ROOT_DIR)
  const testFiles = allFiles.filter(isTestFile)

  result.details.push(`Total test files: ${testFiles.length}`)

  // Test file distribution
  const testsByPackage: Record<string, number> = {}
  testFiles.forEach((file) => {
    const match = file.match(/packages\/([^/]+)/)
    if (match) {
      const pkg = match[1]
      testsByPackage[pkg] = (testsByPackage[pkg] || 0) + 1
    }
  })

  result.details.push('\nTest files by package:')
  Object.entries(testsByPackage)
    .sort((a, b) => b[1] - a[1])
    .forEach(([pkg, count]) => {
      result.details.push(`  ${pkg}: ${count} files`)
    })

  if (!quick) {
    // Run tests
    result.details.push('\nRunning pnpm test...')
    const test = execCommand('pnpm test --run')

    if (test.success) {
      result.details.push('[OK] All tests passed')
      result.score = 100
    } else {
      // Parse test output for pass/fail counts
      const passMatch = test.stdout.match(/(\d+) passed/)
      const failMatch = test.stdout.match(/(\d+) failed/)

      const passed = passMatch ? parseInt(passMatch[1]) : 0
      const failed = failMatch ? parseInt(failMatch[1]) : 0
      const total = passed + failed

      if (total > 0) {
        result.score = Math.floor((passed / total) * 100)
        result.details.push(`Tests: ${passed} passed, ${failed} failed`)

        if (failed > 0) {
          result.warnings.push(`${failed} test(s) failing`)
        }
      } else {
        result.score = 50
        result.warnings.push('Could not parse test results')
      }
    }
  } else {
    result.details.push('[SKIPPED] Test execution skipped (--quick mode)')
    result.score = 100 // Don't penalize in quick mode
  }

  return result
}

// ----------------------------------------------------------------------------
// 4. Security
// ----------------------------------------------------------------------------

function auditSecurity(): AuditResult {
  const result: AuditResult = {
    category: 'Security',
    score: 0,
    maxScore: 100,
    details: [],
    warnings: [],
    errors: [],
  }

  let score = 100

  // Check .gitignore for .env files
  const gitignorePath = join(ROOT_DIR, '.gitignore')
  if (existsSync(gitignorePath)) {
    const gitignore = readFileSync(gitignorePath, 'utf-8')
    if (gitignore.includes('.env') || gitignore.includes('*.env')) {
      result.details.push('[OK] .env files are in .gitignore')
    } else {
      score -= 20
      result.errors.push('.env files not found in .gitignore')
    }
  } else {
    score -= 10
    result.warnings.push('.gitignore not found')
  }

  // Scan for potential secrets (basic patterns)
  const allFiles = getAllFiles(ROOT_DIR).filter((f) => !isTestFile(f))
  const secretPatterns = [
    { name: 'API keys', pattern: /['\"]sk-[a-zA-Z0-9]{20,}['\"]/g },
    { name: 'Anthropic keys', pattern: /['\"]sk-ant-[a-zA-Z0-9-_]{20,}['\"]/g },
    { name: 'OpenAI keys', pattern: /['\"]sk-[a-zA-Z0-9]{48}['\"]/g },
    { name: 'AWS keys', pattern: /AKIA[0-9A-Z]{16}/g },
    { name: 'Private keys', pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  ]

  let secretsFound = 0
  secretPatterns.forEach(({ name, pattern }) => {
    allFiles.forEach((file) => {
      const count = countInFile(file, pattern)
      if (count > 0) {
        secretsFound += count
        result.warnings.push(`Potential ${name} found in ${file.replace(ROOT_DIR, '.')}`)
      }
    })
  })

  if (secretsFound > 0) {
    score -= Math.min(secretsFound * 15, 50)
    result.errors.push(`Found ${secretsFound} potential secrets in code`)
  } else {
    result.details.push('[OK] No obvious secrets found in code')
  }

  // Check for userId filtering in queries
  const apiFiles = getAllFiles(join(PACKAGES_DIR, 'api', 'src', 'routers'))
  let queriesWithoutUserId = 0

  apiFiles.forEach((file) => {
    const content = readFileSync(file, 'utf-8')
    // Look for db queries without userId filter
    const dbQueries = content.match(/db\.(select|update|delete)\([^)]+\)/g) || []
    dbQueries.forEach((query) => {
      if (!query.includes('userId') && !query.includes('No userId filter')) {
        queriesWithoutUserId++
      }
    })
  })

  if (queriesWithoutUserId > 0) {
    result.warnings.push(`${queriesWithoutUserId} DB queries without userId filter (verify if intentional)`)
  } else {
    result.details.push('[OK] All DB queries properly filter by userId or documented')
  }

  result.score = Math.max(0, score)
  return result
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateReport(results: AuditResult[], quick: boolean): string {
  const totalScore = results.reduce((sum, r) => sum + r.score, 0)
  const maxScore = results.reduce((sum, r) => sum + r.maxScore, 0)
  const finalScore = (totalScore / maxScore) * 10

  const timestamp = new Date().toISOString().split('T')[0]

  let report = `# 📊 Auditoría Automatizada del Proyecto\n\n`
  report += `**Fecha:** ${timestamp}\n`
  report += `**Modo:** ${quick ? 'Rápido (sin tests)' : 'Completo'}\n`
  report += `**Puntuación Final:** ${finalScore.toFixed(1)}/10.0\n\n`

  // Overall score interpretation
  if (finalScore >= 9.0) {
    report += `✅ **Estado:** Excelente - El proyecto cumple con los estándares de calidad.\n\n`
  } else if (finalScore >= 8.0) {
    report += `✅ **Estado:** Bueno - Hay algunas áreas menores de mejora.\n\n`
  } else if (finalScore >= 7.0) {
    report += `⚠️ **Estado:** Aceptable - Se recomienda atender las advertencias.\n\n`
  } else {
    report += `❌ **Estado:** Requiere atención - Hay problemas críticos que resolver.\n\n`
  }

  report += `---\n\n`

  // Individual category results
  results.forEach((result) => {
    const percentage = ((result.score / result.maxScore) * 100).toFixed(0)
    const icon = result.score >= 80 ? '✅' : result.score >= 60 ? '⚠️' : '❌'

    report += `## ${icon} ${result.category}\n\n`
    report += `**Puntuación:** ${result.score}/${result.maxScore} (${percentage}%)\n\n`

    if (result.errors.length > 0) {
      report += `### ❌ Errores Críticos\n\n`
      result.errors.forEach((err) => report += `- ${err}\n`)
      report += `\n`
    }

    if (result.warnings.length > 0) {
      report += `### ⚠️ Advertencias\n\n`
      result.warnings.forEach((warn) => report += `- ${warn}\n`)
      report += `\n`
    }

    report += `### 📋 Detalles\n\n`
    result.details.forEach((detail) => {
      if (detail.startsWith('\n')) {
        report += `${detail}\n`
      } else if (detail.startsWith('[OK]') || detail.startsWith('[ERROR]') || detail.startsWith('[WARN]') || detail.startsWith('[SKIPPED]')) {
        report += `${detail}\n`
      } else {
        report += `- ${detail}\n`
      }
    })
    report += `\n---\n\n`
  })

  // Summary of actions needed
  const allErrors = results.flatMap((r) => r.errors)
  const allWarnings = results.flatMap((r) => r.warnings)

  if (allErrors.length > 0 || allWarnings.length > 0) {
    report += `## 🎯 Acciones Recomendadas\n\n`

    if (allErrors.length > 0) {
      report += `### Alta Prioridad (${allErrors.length})\n\n`
      allErrors.forEach((err, i) => report += `${i + 1}. ${err}\n`)
      report += `\n`
    }

    if (allWarnings.length > 0) {
      report += `### Media Prioridad (${allWarnings.length})\n\n`
      allWarnings.forEach((warn, i) => report += `${i + 1}. ${warn}\n`)
      report += `\n`
    }
  } else {
    report += `## ✅ Sin Acciones Pendientes\n\n`
    report += `El proyecto cumple con todos los estándares de calidad establecidos.\n\n`
  }

  report += `---\n\n`
  report += `*Generado automáticamente por scripts/audit-project.ts*\n`

  return report
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const quick = process.argv.includes('--quick')

  console.log('[INFO] Iniciando auditoría del proyecto...')
  console.log(`[INFO] Modo: ${quick ? 'Rápido' : 'Completo'}`)
  console.log('')

  const results: AuditResult[] = []

  // Run all audits
  console.log('[INFO] 1/4 Verificando TypeScript...')
  results.push(auditTypeScript())

  console.log('[INFO] 2/4 Analizando calidad de código...')
  results.push(auditCodeQuality())

  console.log('[INFO] 3/4 Evaluando cobertura de tests...')
  results.push(auditTesting(quick))

  console.log('[INFO] 4/4 Revisando seguridad...')
  results.push(auditSecurity())

  // Generate report
  console.log('')
  console.log('[INFO] Generando reporte...')
  const report = generateReport(results, quick)

  // Save report
  const reportPath = join(ROOT_DIR, `AUDITORIA-AUTO-${new Date().toISOString().split('T')[0]}.md`)
  writeFileSync(reportPath, report)

  console.log(`[OK] Reporte generado: ${reportPath}`)
  console.log('')

  // Print summary
  const totalScore = results.reduce((sum, r) => sum + r.score, 0)
  const maxScore = results.reduce((sum, r) => sum + r.maxScore, 0)
  const finalScore = (totalScore / maxScore) * 10

  console.log('='.repeat(60))
  console.log(`PUNTUACIÓN FINAL: ${finalScore.toFixed(1)}/10.0`)
  console.log('='.repeat(60))

  results.forEach((result) => {
    const percentage = ((result.score / result.maxScore) * 100).toFixed(0)
    const icon = result.score >= 80 ? '[OK]' : result.score >= 60 ? '[WARN]' : '[ERROR]'
    console.log(`${icon} ${result.category}: ${result.score}/${result.maxScore} (${percentage}%)`)
  })

  console.log('='.repeat(60))

  // Exit with appropriate code
  if (finalScore < 7.0) {
    process.exit(1)
  }
}

main()
