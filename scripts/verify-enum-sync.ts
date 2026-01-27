#!/usr/bin/env tsx
/**
 * Enum Synchronization Verifier
 *
 * Verifica que todos los tipos en frontend infieren desde DB enums.
 * Detecta hardcodeo de enums que ya existen en la base de datos.
 *
 * USO:
 *   pnpm verify-enums
 *
 * ERROR CODES:
 *   0 = OK
 *   1 = Hardcoded enums detected
 *   2 = File system error
 *
 * @see AUDITORIA-CAPAS-MULTIPLES.md
 * @see ERRORES-COMETIDOS.md#error-6
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════

const DB_SCHEMA_DIR = join(process.cwd(), 'packages/db/src/schema')
const FRONTEND_DIR = join(process.cwd(), 'apps/web/src')

// Known DB enums that should NEVER be hardcoded in frontend
const KNOWN_DB_ENUMS: Record<string, string[]> = {
  debateStatusEnum: ['draft', 'pending', 'in_progress', 'completed', 'failed', 'cancelled'],
  quoorumReportTypeEnum: [
    'single_debate',
    'weekly_summary',
    'monthly_summary',
    'deal_analysis',
    'expert_performance',
    'custom',
  ],
  subscriptionStatusEnum: ['active', 'cancelled', 'past_due', 'unpaid', 'trialing'],
  planTierEnum: ['free', 'starter', 'pro', 'business'],
  teamMemberRoleEnum: ['owner', 'admin', 'member', 'viewer'],
  teamMemberStatusEnum: ['active', 'inactive', 'invited', 'suspended'],
}

// Patterns to detect hardcoded enum types
const HARDCODED_ENUM_PATTERNS = [
  // type Status = 'draft' | 'pending' | 'completed'
  /type\s+\w+\s*=\s*['"]\w+['"](?:\s*\|\s*['"]\w+['"])+/g,
  // export type Status = 'draft' | 'pending'
  /export\s+type\s+\w+\s*=\s*['"]\w+['"](?:\s*\|\s*['"]\w+['"])+/g,
]

// Whitelist: Files that are allowed to have hardcoded enums
const WHITELIST_FILES = [
  'types.ts', // If they import and infer correctly
]

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface HardcodedEnum {
  file: string
  line: number
  content: string
  suspectedEnum: string | null
}

interface VerificationResult {
  passed: boolean
  hardcodedEnums: HardcodedEnum[]
  filesScanned: number
  errors: string[]
}

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

function getAllFiles(dir: string, extension = '.ts'): string[] {
  const files: string[] = []

  function walk(currentPath: string) {
    const entries = readdirSync(currentPath)

    for (const entry of entries) {
      const fullPath = join(currentPath, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        // Skip node_modules, .next, dist, etc.
        if (!['node_modules', '.next', 'dist', 'build', '.turbo'].includes(entry)) {
          walk(fullPath)
        }
      } else if (stat.isFile() && (fullPath.endsWith(extension) || fullPath.endsWith('.tsx'))) {
        files.push(fullPath)
      }
    }
  }

  walk(dir)
  return files
}

function detectHardcodedEnums(file: string, content: string): HardcodedEnum[] {
  const detected: HardcodedEnum[] = []
  const lines = content.split('\n')

  lines.forEach((line, index) => {
    // Skip lines that are importing from DB
    if (line.includes('from') && line.includes('@quoorum/db/schema')) {
      return
    }

    // Skip lines that are inferring from DB enum
    if (line.includes('typeof') && line.includes('enumValues')) {
      return
    }

    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return
    }

    // Check for hardcoded enum patterns
    for (const pattern of HARDCODED_ENUM_PATTERNS) {
      const matches = line.matchAll(pattern)
      for (const match of matches) {
        const suspectedEnum = detectWhichEnum(match[0])

        detected.push({
          file: relative(process.cwd(), file),
          line: index + 1,
          content: line.trim(),
          suspectedEnum,
        })
      }
    }
  })

  return detected
}

function detectWhichEnum(typeDefinition: string): string | null {
  const values = typeDefinition.match(/['"](\w+)['"]/g)?.map((v) => v.replace(/['"]/g, ''))

  if (!values) return null

  // Check if these values match any known DB enum
  for (const [enumName, enumValues] of Object.entries(KNOWN_DB_ENUMS)) {
    const matchCount = values.filter((v) => enumValues.includes(v)).length

    // If more than 50% of values match, it's likely this enum
    if (matchCount >= values.length * 0.5) {
      return enumName
    }
  }

  return null
}

// ═══════════════════════════════════════════════════════════
// MAIN VERIFICATION
// ═══════════════════════════════════════════════════════════

function verifyEnumSync(): VerificationResult {
  const result: VerificationResult = {
    passed: true,
    hardcodedEnums: [],
    filesScanned: 0,
    errors: [],
  }

  try {
    const files = getAllFiles(FRONTEND_DIR)
    result.filesScanned = files.length

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8')
        const hardcoded = detectHardcodedEnums(file, content)

        if (hardcoded.length > 0) {
          result.hardcodedEnums.push(...hardcoded)
        }
      } catch (error) {
        result.errors.push(`Error reading ${file}: ${error}`)
      }
    }

    result.passed = result.hardcodedEnums.length === 0
  } catch (error) {
    result.errors.push(`Error scanning files: ${error}`)
    result.passed = false
  }

  return result
}

// ═══════════════════════════════════════════════════════════
// OUTPUT & REPORTING
// ═══════════════════════════════════════════════════════════

function printReport(result: VerificationResult) {
  console.log('\n[INFO] Enum Synchronization Verification')
  console.log(`[INFO] Files scanned: ${result.filesScanned}`)

  if (result.hardcodedEnums.length === 0) {
    console.log('[OK] No hardcoded enums detected')
    console.log('[OK] All types infer from DB enums correctly')
    return
  }

  console.log(`\n[ERROR] Found ${result.hardcodedEnums.length} hardcoded enum(s):\n`)

  for (const hardcoded of result.hardcodedEnums) {
    console.log(`[ERROR] ${hardcoded.file}:${hardcoded.line}`)
    console.log(`[ERROR]   ${hardcoded.content}`)

    if (hardcoded.suspectedEnum) {
      console.log(`[ERROR]   Suspected enum: ${hardcoded.suspectedEnum}`)
      console.log(`[ERROR]   Should infer from: import type { ${hardcoded.suspectedEnum} } from '@quoorum/db/schema'`)
      console.log(`[ERROR]   Correct syntax: type MyType = (typeof ${hardcoded.suspectedEnum}.enumValues)[number]`)
    }

    console.log('')
  }

  console.log('[ERROR] Fix these hardcoded enums to infer from DB')
  console.log('[ERROR] See: docs/claude/05-patterns.md#type-inference')
  console.log('[ERROR] See: AUDITORIA-CAPAS-MULTIPLES.md')
}

// ═══════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════

function main() {
  console.log('[INFO] Starting enum synchronization verification...')

  const result = verifyEnumSync()
  printReport(result)

  if (result.errors.length > 0) {
    console.log('\n[WARN] Errors encountered:')
    result.errors.forEach((error) => console.log(`[WARN]   ${error}`))
  }

  if (!result.passed) {
    console.log('\n[ERROR] Verification FAILED')
    process.exit(1)
  }

  console.log('\n[OK] Verification PASSED')
  process.exit(0)
}

main()
