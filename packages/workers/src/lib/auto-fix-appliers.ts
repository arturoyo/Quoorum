/**
 * Auto-Fix Appliers - Ejecuta correcciones automáticas de código
 */

import { readFile, writeFile } from 'fs/promises'
import type { DetectedError } from './error-parsers'

export interface FixResult {
  success: boolean
  file: string
  changes: string[]
  error?: string
}

/**
 * Aplica un fix automático basado en la estrategia
 */
export async function applyAutoFix(error: DetectedError): Promise<FixResult> {
  if (!error.autoFixable || !error.fixStrategy) {
    return {
      success: false,
      file: error.file,
      changes: [],
      error: 'Error not auto-fixable',
    }
  }

  try {
    switch (error.fixStrategy) {
      case 'fix-malformed-imports':
        return await fixMalformedImports(error)

      case 'remove-console-log':
        return await removeConsoleLogs(error)

      case 'prefix-with-underscore':
        return await prefixUnusedVarsWithUnderscore(error)

      case 'change-let-to-const':
        return await changeLetToConst(error)

      case 'change-var-to-const':
        return await changeVarToConst(error)

      case 'replace-any-with-unknown':
        return await replaceAnyWithUnknown(error)

      case 'install-dependency':
        return await installMissingDependency(error)

      default:
        return {
          success: false,
          file: error.file,
          changes: [],
          error: `Unknown fix strategy: ${error.fixStrategy}`,
        }
    }
  } catch (err) {
    return {
      success: false,
      file: error.file,
      changes: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Fix imports malformados o duplicados
 */
async function fixMalformedImports(error: DetectedError): Promise<FixResult> {
  const content = await readFile(error.file, 'utf-8')
  const lines = content.split('\n')

  // Detectar imports duplicados del tipo:
  // import {
  // import {
  //   Component
  // } from 'lib'
  const changes: string[] = []
  let fixed = false

  // Buscar patrón de import duplicado
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import {') && lines[i + 1]?.trim().startsWith('import {')) {
      // Import duplicado encontrado
      changes.push(`Removed duplicate import statement at line ${i + 1}`)

      // Eliminar la segunda declaración import
      lines.splice(i + 1, 1)
      fixed = true
      break
    }
  }

  if (!fixed) {
    // Intentar otra estrategia: buscar imports incompletos
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Detectar líneas que parecen imports pero sin "import"
      if (!line.startsWith('import') && line.match(/^\w+,?$/) && i > 0) {
        const prevLine = lines[i - 1].trim()
        if (prevLine.startsWith('import {')) {
          // Mover esta línea dentro del import anterior
          changes.push(`Fixed incomplete import at line ${i + 1}`)
          lines.splice(i, 1) // Eliminar línea problemática
          fixed = true
          break
        }
      }
    }
  }

  if (fixed) {
    await writeFile(error.file, lines.join('\n'), 'utf-8')
    return {
      success: true,
      file: error.file,
      changes,
    }
  }

  return {
    success: false,
    file: error.file,
    changes: [],
    error: 'Could not identify import issue to fix',
  }
}

/**
 * Eliminar console.log
 */
async function removeConsoleLogs(error: DetectedError): Promise<FixResult> {
  const content = await readFile(error.file, 'utf-8')
  const lines = content.split('\n')

  if (!error.line) {
    return {
      success: false,
      file: error.file,
      changes: [],
      error: 'No line number provided',
    }
  }

  const lineIndex = error.line - 1
  const originalLine = lines[lineIndex]

  // Comentar la línea en lugar de eliminarla (más seguro)
  if (originalLine.includes('console.log') || originalLine.includes('console.error')) {
    lines[lineIndex] = `  // ${originalLine.trim()} // Auto-removed by healing worker`

    await writeFile(error.file, lines.join('\n'), 'utf-8')

    return {
      success: true,
      file: error.file,
      changes: [`Commented out console.log at line ${error.line}`],
    }
  }

  return {
    success: false,
    file: error.file,
    changes: [],
    error: 'Line does not contain console statement',
  }
}

/**
 * Prefixar variables no usadas con _
 */
async function prefixUnusedVarsWithUnderscore(error: DetectedError): Promise<FixResult> {
  const content = await readFile(error.file, 'utf-8')

  // Extraer nombre de variable del mensaje de error
  const varMatch = error.message.match(/'([^']+)' is (declared|defined) but (never used|its value is never read)/)
  if (!varMatch) {
    return {
      success: false,
      file: error.file,
      changes: [],
      error: 'Could not extract variable name from error message',
    }
  }

  const varName = varMatch[1]
  const prefixedName = `_${varName}`

  // Reemplazar primera declaración (más seguro que replace all)
  const regex = new RegExp(`\\b(const|let|var)\\s+${varName}\\b`)
  const newContent = content.replace(regex, `$1 ${prefixedName}`)

  if (newContent !== content) {
    await writeFile(error.file, newContent, 'utf-8')

    return {
      success: true,
      file: error.file,
      changes: [`Prefixed unused variable '${varName}' with underscore`],
    }
  }

  return {
    success: false,
    file: error.file,
    changes: [],
    error: 'Variable not found in file',
  }
}

/**
 * Cambiar let a const
 */
async function changeLetToConst(error: DetectedError): Promise<FixResult> {
  const content = await readFile(error.file, 'utf-8')
  const lines = content.split('\n')

  if (!error.line) {
    return {
      success: false,
      file: error.file,
      changes: [],
      error: 'No line number provided',
    }
  }

  const lineIndex = error.line - 1
  const originalLine = lines[lineIndex]

  if (originalLine.includes('let ')) {
    lines[lineIndex] = originalLine.replace(/\blet\b/, 'const')
    await writeFile(error.file, lines.join('\n'), 'utf-8')

    return {
      success: true,
      file: error.file,
      changes: [`Changed 'let' to 'const' at line ${error.line}`],
    }
  }

  return {
    success: false,
    file: error.file,
    changes: [],
    error: 'Line does not contain let keyword',
  }
}

/**
 * Cambiar var a const
 */
async function changeVarToConst(error: DetectedError): Promise<FixResult> {
  const content = await readFile(error.file, 'utf-8')
  const lines = content.split('\n')

  if (!error.line) {
    return {
      success: false,
      file: error.file,
      changes: [],
      error: 'No line number provided',
    }
  }

  const lineIndex = error.line - 1
  const originalLine = lines[lineIndex]

  if (originalLine.includes('var ')) {
    lines[lineIndex] = originalLine.replace(/\bvar\b/, 'const')
    await writeFile(error.file, lines.join('\n'), 'utf-8')

    return {
      success: true,
      file: error.file,
      changes: [`Changed 'var' to 'const' at line ${error.line}`],
    }
  }

  return {
    success: false,
    file: error.file,
    changes: [],
    error: 'Line does not contain var keyword',
  }
}

/**
 * Reemplazar any con unknown (más seguro)
 */
async function replaceAnyWithUnknown(error: DetectedError): Promise<FixResult> {
  const content = await readFile(error.file, 'utf-8')
  const lines = content.split('\n')

  if (!error.line) {
    return {
      success: false,
      file: error.file,
      changes: [],
      error: 'No line number provided',
    }
  }

  const lineIndex = error.line - 1
  const originalLine = lines[lineIndex]

  // Reemplazar : any por : unknown
  if (originalLine.includes(': any')) {
    lines[lineIndex] = originalLine.replace(/:\s*any\b/g, ': unknown')
    await writeFile(error.file, lines.join('\n'), 'utf-8')

    return {
      success: true,
      file: error.file,
      changes: [`Replaced 'any' with 'unknown' at line ${error.line}`],
    }
  }

  return {
    success: false,
    file: error.file,
    changes: [],
    error: 'Line does not contain any type',
  }
}

/**
 * Instalar dependencia faltante
 */
async function installMissingDependency(error: DetectedError): Promise<FixResult> {
  // Extraer nombre del paquete del mensaje
  const packageMatch = error.message.match(/Missing dependency: (.+)/)
  if (!packageMatch) {
    return {
      success: false,
      file: error.file,
      changes: [],
      error: 'Could not extract package name',
    }
  }

  const packageName = packageMatch[1]

  // No ejecutar pnpm install automáticamente (muy peligroso)
  // En su lugar, registrar la necesidad y notificar
  return {
    success: false,
    file: error.file,
    changes: [],
    error: `Dependency installation requires manual approval: pnpm add ${packageName}`,
  }
}
