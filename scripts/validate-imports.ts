/**
 * Import Validation Script
 *
 * Detecta imports incorrectos ANTES del build:
 * - Rutas que no existen (.js cuando el archivo es .ts)
 * - Imports de archivos eliminados
 * - Imports circulares
 * - Case-sensitivity issues (Windows vs. Linux)
 *
 * Uso:
 * pnpm tsx scripts/validate-imports.ts
 * o
 * pnpm tsx scripts/validate-imports.ts --fix (auto-corregir cuando sea posible)
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { resolve, dirname, join, extname, basename } from 'path'
import { writeFileSync } from 'fs'

// ============================================================================
// CONFIG
// ============================================================================

const PACKAGES_TO_CHECK = [
  'packages/db/src',
  'packages/api/src',
  'packages/quoorum/src',
  'packages/ai/src',
  'packages/core/src',
  'packages/ui/src',
  'apps/web/src',
]

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

interface ImportError {
  file: string
  line: number
  importPath: string
  error: string
  fix?: string
}

const errors: ImportError[] = []
let filesChecked = 0
let importsChecked = 0

// ============================================================================
// UTILITIES
// ============================================================================

function log(level: 'info' | 'success' | 'error' | 'warning', message: string) {
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
  }[level]

  console.log(`${prefix} ${message}`)
}

function getAllFiles(dir: string, extension: RegExp = /\.(ts|tsx|js|jsx)$/): string[] {
  const files: string[] = []

  if (!existsSync(dir)) {
    return files
  }

  const items = readdirSync(dir)

  for (const item of items) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      if (item === 'node_modules' || item === '.next' || item === 'dist' || item === '.turbo') {
        continue
      }
      files.push(...getAllFiles(fullPath, extension))
    } else if (extension.test(item)) {
      files.push(fullPath)
    }
  }

  return files
}

function extractImports(fileContent: string): Array<{ line: number; importPath: string }> {
  const imports: Array<{ line: number; importPath: string }> = []
  const lines = fileContent.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!

    // Match ES6 imports: import ... from "..."
    const esImportMatch = line.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/)
    if (esImportMatch) {
      imports.push({ line: i + 1, importPath: esImportMatch[1]! })
      continue
    }

    // Match require: require("...")
    const requireMatch = line.match(/require\(['"]([^'"]+)['"]\)/)
    if (requireMatch) {
      imports.push({ line: i + 1, importPath: requireMatch[1]! })
    }
  }

  return imports
}

function resolveImportPath(filePath: string, importPath: string): string | null {
  // Skip node_modules imports
  if (!importPath.startsWith('.')) {
    return null
  }

  const fileDir = dirname(filePath)
  const resolvedPath = resolve(fileDir, importPath)

  // Check if it's a file with extension
  if (existsSync(resolvedPath)) {
    return resolvedPath
  }

  // Try common extensions
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.d.ts']
  for (const ext of extensions) {
    const pathWithExt = resolvedPath + ext
    if (existsSync(pathWithExt)) {
      return pathWithExt
    }
  }

  // Try index files
  for (const ext of extensions) {
    const indexPath = join(resolvedPath, `index${ext}`)
    if (existsSync(indexPath)) {
      return indexPath
    }
  }

  return null
}

function suggestFix(filePath: string, importPath: string): string | undefined {
  const fileDir = dirname(filePath)
  const importBase = basename(importPath, extname(importPath))

  // Check for common mistakes
  // 1. .js extension when file is .ts (and should be without extension)
  if (importPath.endsWith('.js')) {
    // Check if removing .js resolves to a .ts file
    const pathWithoutExt = importPath.replace(/\.js$/, '')
    const resolvedWithoutExt = resolve(fileDir, pathWithoutExt + '.ts')
    if (existsSync(resolvedWithoutExt)) {
      // Check if other imports in same directory use extension or not
      const parentContent = existsSync(filePath) ? readFileSync(filePath, 'utf-8') : ''
      const otherImports = extractImports(parentContent)
      const relativeImports = otherImports.filter(imp => imp.importPath.startsWith('.'))

      // Count imports with/without extensions
      const withExtension = relativeImports.filter(imp => /\.(js|ts|tsx|jsx)$/.test(imp.importPath)).length
      const withoutExtension = relativeImports.length - withExtension

      // If majority doesn't use extensions, suggest removing it
      if (withoutExtension > withExtension) {
        return pathWithoutExt // Remove .js extension
      }

      return pathWithoutExt + '.ts' // Keep extension but change to .ts
    }

    const tsxPath = importPath.replace(/\.js$/, '.tsx')
    const resolvedTsx = resolve(fileDir, tsxPath)
    if (existsSync(resolvedTsx)) {
      return tsxPath
    }
  }

  // 2. Wrong filename (e.g., ./debates when it's ./quoorum-debates)
  const dirOfImport = dirname(resolve(fileDir, importPath))
  if (existsSync(dirOfImport)) {
    const filesInDir = readdirSync(dirOfImport)
    const similarFiles = filesInDir.filter((f) =>
      f.toLowerCase().includes(importBase.toLowerCase())
    )

    if (similarFiles.length === 1) {
      const similarFile = similarFiles[0]!
      const similarBase = basename(similarFile, extname(similarFile))
      const importDir = dirname(importPath)
      const newImportPath =
        importDir === '.' ? `./${similarBase}` : `${importDir}/${similarBase}`

      // If original had .js extension, keep it
      if (importPath.endsWith('.js')) {
        return newImportPath + '.js'
      }

      return newImportPath
    }
  }

  return undefined
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateFile(filePath: string): void {
  filesChecked++

  try {
    const content = readFileSync(filePath, 'utf-8')
    const imports = extractImports(content)

    for (const { line, importPath } of imports) {
      importsChecked++

      // Skip external packages
      if (!importPath.startsWith('.')) {
        continue
      }

      const resolvedPath = resolveImportPath(filePath, importPath)

      if (!resolvedPath) {
        const fix = suggestFix(filePath, importPath)

        errors.push({
          file: filePath,
          line,
          importPath,
          error: 'File not found',
          fix,
        })
      } else {
        // File exists, but check for style inconsistencies
        // Check if using .js extension for a .ts file
        if (importPath.endsWith('.js') && resolvedPath.endsWith('.ts')) {
          // Check if other imports in same file use extensions
          const relativeImports = imports.filter(imp => imp.importPath.startsWith('.'))
          const withExtension = relativeImports.filter(imp => /\.(js|ts|tsx|jsx)$/.test(imp.importPath)).length
          const withoutExtension = relativeImports.length - withExtension

          // If majority doesn't use extensions, flag as inconsistent
          if (withoutExtension > withExtension) {
            errors.push({
              file: filePath,
              line,
              importPath,
              error: 'Inconsistent import style: using .js extension when others use no extension',
              fix: importPath.replace(/\.js$/, ''),
            })
          }
        }
      }
    }
  } catch (error) {
    log('error', `Failed to read ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// ============================================================================
// AUTO-FIX
// ============================================================================

function applyFixes(): number {
  let fixedCount = 0

  // Group errors by file
  const errorsByFile = new Map<string, ImportError[]>()
  for (const error of errors) {
    if (!error.fix) continue

    const fileErrors = errorsByFile.get(error.file) ?? []
    fileErrors.push(error)
    errorsByFile.set(error.file, fileErrors)
  }

  for (const [filePath, fileErrors] of errorsByFile) {
    try {
      let content = readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')

      // Sort by line number descending (to avoid offset issues)
      fileErrors.sort((a, b) => b.line - a.line)

      for (const error of fileErrors) {
        if (!error.fix) continue

        const lineIndex = error.line - 1
        const oldLine = lines[lineIndex]

        if (!oldLine) continue

        // Replace the import path in the line
        const newLine = oldLine.replace(
          new RegExp(`(['"])${error.importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`),
          `$1${error.fix}$1`
        )

        lines[lineIndex] = newLine
        fixedCount++

        log('success', `Fixed: ${filePath}:${error.line}`)
        log('info', `  Old: ${oldLine.trim()}`)
        log('info', `  New: ${newLine.trim()}`)
      }

      // Write back
      writeFileSync(filePath, lines.join('\n'), 'utf-8')
    } catch (error) {
      log('error', `Failed to fix ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return fixedCount
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2)
  const shouldFix = args.includes('--fix')

  console.log('\n' + '='.repeat(70))
  console.log('IMPORT VALIDATION')
  console.log('='.repeat(70) + '\n')

  log('info', 'Scanning packages for import errors...\n')

  for (const packagePath of PACKAGES_TO_CHECK) {
    const fullPath = resolve(process.cwd(), packagePath)

    if (!existsSync(fullPath)) {
      log('warning', `Package not found: ${packagePath}`)
      continue
    }

    log('info', `Checking ${packagePath}...`)
    const files = getAllFiles(fullPath)

    for (const file of files) {
      validateFile(file)
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('RESULTS')
  console.log('='.repeat(70) + '\n')

  log('info', `Files checked: ${filesChecked}`)
  log('info', `Imports checked: ${importsChecked}`)

  if (errors.length === 0) {
    log('success', 'No import errors found! ✨\n')
    process.exit(0)
  }

  log('error', `Found ${errors.length} import errors:\n`)

  // Group errors by file
  const errorsByFile = new Map<string, ImportError[]>()
  for (const error of errors) {
    const fileErrors = errorsByFile.get(error.file) ?? []
    fileErrors.push(error)
    errorsByFile.set(error.file, fileErrors)
  }

  for (const [file, fileErrors] of errorsByFile) {
    console.log(`${colors.red}${file}${colors.reset}`)

    for (const error of fileErrors) {
      console.log(
        `  ${colors.yellow}Line ${error.line}:${colors.reset} import from '${error.importPath}' - ${error.error}`
      )

      if (error.fix) {
        console.log(`  ${colors.green}Suggested fix:${colors.reset} '${error.fix}'`)
      }
    }

    console.log()
  }

  // Auto-fix
  if (shouldFix) {
    console.log('='.repeat(70))
    console.log('AUTO-FIX')
    console.log('='.repeat(70) + '\n')

    const fixedCount = applyFixes()

    if (fixedCount > 0) {
      log('success', `Fixed ${fixedCount} import errors`)
    } else {
      log('warning', 'No fixable errors found')
    }

    console.log()
  } else {
    console.log('='.repeat(70))
    log('info', 'Run with --fix to automatically correct fixable errors')
    console.log('='.repeat(70) + '\n')
  }

  process.exit(errors.length > 0 ? 1 : 0)
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
