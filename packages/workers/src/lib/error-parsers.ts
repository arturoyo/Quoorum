/**
 * Error Parsers - Detecta y clasifica errores de Next.js/TypeScript/ESLint
 */

export interface DetectedError {
  type: 'typescript' | 'eslint' | 'build' | 'runtime'
  severity: 'safe' | 'moderate' | 'dangerous'
  file: string
  line?: number
  column?: number
  message: string
  code?: string
  rawError: string
  autoFixable: boolean
  fixStrategy?: string
}

/**
 * Parser de errores de TypeScript
 */
export function parseTypeScriptErrors(output: string): DetectedError[] {
  const errors: DetectedError[] = []
  const tsErrorRegex = /([^(]+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)/g

  let match
  while ((match = tsErrorRegex.exec(output)) !== null) {
    const [, file, line, column, code, message] = match

    const error: DetectedError = {
      type: 'typescript',
      severity: classifyTypeScriptSeverity(code, message),
      file: file.trim(),
      line: parseInt(line),
      column: parseInt(column),
      message: message.trim(),
      code,
      rawError: match[0],
      autoFixable: isTypeScriptAutoFixable(code, message),
      fixStrategy: getTypeScriptFixStrategy(code, message),
    }

    errors.push(error)
  }

  return errors
}

/**
 * Parser de errores de ESLint
 */
export function parseESLintErrors(output: string): DetectedError[] {
  const errors: DetectedError[] = []
  // Pattern: /path/to/file.tsx:10:5: error some-rule-name Message here
  const eslintRegex = /([^:]+):(\d+):(\d+):\s+(error|warning)\s+([^\s]+)\s+(.+)/g

  let match
  while ((match = eslintRegex.exec(output)) !== null) {
    const [, file, line, column, severity, rule, message] = match

    const error: DetectedError = {
      type: 'eslint',
      severity: severity === 'error' ? 'moderate' : 'safe',
      file: file.trim(),
      line: parseInt(line),
      column: parseInt(column),
      message: message.trim(),
      code: rule,
      rawError: match[0],
      autoFixable: isESLintAutoFixable(rule),
      fixStrategy: getESLintFixStrategy(rule),
    }

    errors.push(error)
  }

  return errors
}

/**
 * Parser de errores de Build de Next.js
 */
export function parseBuildErrors(output: string): DetectedError[] {
  const errors: DetectedError[] = []

  // Pattern 1: Module not found
  const moduleNotFoundRegex = /Module not found: Can't resolve '([^']+)'/g
  let match
  while ((match = moduleNotFoundRegex.exec(output)) !== null) {
    errors.push({
      type: 'build',
      severity: 'moderate',
      file: 'package.json',
      message: `Missing dependency: ${match[1]}`,
      code: 'MODULE_NOT_FOUND',
      rawError: match[0],
      autoFixable: true,
      fixStrategy: 'install-dependency',
    })
  }

  // Pattern 2: Syntax errors
  const syntaxErrorRegex = /SyntaxError: ([^\n]+)/g
  while ((match = syntaxErrorRegex.exec(output)) !== null) {
    errors.push({
      type: 'build',
      severity: 'dangerous',
      file: 'unknown',
      message: match[1],
      code: 'SYNTAX_ERROR',
      rawError: match[0],
      autoFixable: false,
    })
  }

  return errors
}

/**
 * Clasifica la severidad de errores TypeScript
 */
function classifyTypeScriptSeverity(code: string, message: string): DetectedError['severity'] {
  // Safe fixes (formatting, imports)
  if (code.match(/TS1003|TS1005|TS1109/)) {
    return 'safe' // Import/syntax errors
  }

  // Moderate (type issues pero no afectan runtime)
  if (code.match(/TS2304|TS2339|TS2322/)) {
    return 'moderate' // Type errors
  }

  // Dangerous (pueden afectar runtime)
  return 'dangerous'
}

/**
 * Determina si un error TypeScript es auto-fixable
 */
function isTypeScriptAutoFixable(code: string, message: string): boolean {
  // Imports duplicados/malformados
  if (code === 'TS1003' || code === 'TS1005') {
    if (message.includes('Identifier expected') || message.includes('expected')) {
      return true
    }
  }

  // Missing imports
  if (code === 'TS2304' && message.includes('Cannot find name')) {
    return false // Requiere contexto humano
  }

  return false
}

/**
 * Obtiene la estrategia de fix para errores TypeScript
 */
function getTypeScriptFixStrategy(code: string, message: string): string | undefined {
  if (code === 'TS1003' || code === 'TS1005') {
    return 'fix-malformed-imports'
  }

  return undefined
}

/**
 * Determina si un error ESLint es auto-fixable
 */
function isESLintAutoFixable(rule: string): boolean {
  const autoFixableRules = [
    '@typescript-eslint/no-unused-vars',
    'no-console',
    'prefer-const',
    'no-var',
    '@typescript-eslint/no-explicit-any',
  ]

  return autoFixableRules.includes(rule)
}

/**
 * Obtiene la estrategia de fix para errores ESLint
 */
function getESLintFixStrategy(rule: string): string | undefined {
  const strategyMap: Record<string, string> = {
    '@typescript-eslint/no-unused-vars': 'prefix-with-underscore',
    'no-console': 'remove-console-log',
    'prefer-const': 'change-let-to-const',
    'no-var': 'change-var-to-const',
    '@typescript-eslint/no-explicit-any': 'replace-any-with-unknown',
  }

  return strategyMap[rule]
}

/**
 * Parse errores de runtime logs
 */
export function parseRuntimeErrors(logOutput: string): DetectedError[] {
  const errors: DetectedError[] = []

  // Pattern: Error: message at file:line:column
  const runtimeErrorRegex = /Error:\s+([^\n]+)\s+at\s+([^:]+):(\d+):(\d+)/g
  let match

  while ((match = runtimeErrorRegex.exec(logOutput)) !== null) {
    const [, message, file, line, column] = match

    errors.push({
      type: 'runtime',
      severity: 'dangerous',
      file: file.trim(),
      line: parseInt(line),
      column: parseInt(column),
      message: message.trim(),
      rawError: match[0],
      autoFixable: false, // Runtime errors need human review
    })
  }

  return errors
}
