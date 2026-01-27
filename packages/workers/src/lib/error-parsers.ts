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

/**
 * Detecta emojis en console.log/error/warn/info/debug y Write-Host (PowerShell)
 * Escanea archivos en busca de emojis que causan problemas UTF-8 en Windows
 */
export async function parseEmojiErrors(
  filePaths: string[],
  readFileFn: (path: string) => Promise<string>
): Promise<DetectedError[]> {
  const errors: DetectedError[] = []
  // Detectar TODOS los emojis Unicode posibles (rangos completos)
  // Rangos Unicode de emojis según Unicode Standard:
  // - U+1F300-U+1F5FF: Miscellaneous Symbols and Pictographs
  // - U+1F600-U+1F64F: Emoticons (caras)
  // - U+1F680-U+1F6FF: Transport and Map Symbols
  // - U+1F700-U+1F77F: Alchemical Symbols
  // - U+1F780-U+1F7FF: Geometric Shapes Extended
  // - U+1F800-U+1F8FF: Supplemental Arrows-C
  // - U+1F900-U+1F9FF: Supplemental Symbols and Pictographs
  // - U+1FA00-U+1FA6F: Chess Symbols
  // - U+1FA70-U+1FAFF: Symbols and Pictographs Extended-A
  // - U+1FAB0-U+1FABF: Symbols and Pictographs Extended-B
  // - U+1FAC0-U+1FAFF: Symbols and Pictographs Extended-C
  // - U+2600-U+26FF: Miscellaneous Symbols
  // - U+2700-U+27BF: Dingbats
  // - U+FE00-U+FE0F: Variation Selectors (modificadores de emojis)
  // - U+1F1E0-U+1F1FF: Regional Indicator Symbols (banderas)
  // - U+2190-U+21FF: Arrows (algunos usados como emojis)
  // - U+2300-U+23FF: Miscellaneous Technical (algunos usados como emojis)
  // - U+2B00-U+2BFF: Miscellaneous Symbols and Arrows
  // - U+200D: Zero Width Joiner (ZWJ) - usado para emojis compuestos
  // - U+20E3: Combining Enclosing Keycap
  // - U+FE0F: Variation Selector-16 (fuerza renderizado como emoji)
  const emojiPattern = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{1FAB0}-\u{1FABF}\u{1FAC0}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E0}-\u{1F1FF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{200D}\u{20E3}\u{FE0F}]/gu

  for (const filePath of filePaths) {
    try {
      const content = await readFileFn(filePath)
      const lines = content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const lineNumber = i + 1

        // Detectar console.log/error/warn/info/debug con emojis
        const hasConsoleLog = /console\.(log|error|warn|info|debug)\(/g.test(line)
        // Detectar Write-Host con emojis (PowerShell)
        const hasWriteHost = /Write-Host\s+/g.test(line)
        // Detectar logger.info/error/warn con emojis
        const hasLogger = /(logger|quoorumLogger|systemLogger)\.(info|error|warn|debug)\(/g.test(line)

        // Si la línea contiene un log statement Y un emoji, reportar error
        if ((hasConsoleLog || hasWriteHost || hasLogger) && emojiPattern.test(line)) {
          // Encontrar el emoji específico en la línea
          const emojiMatch = line.match(emojiPattern)
          const emojiFound = emojiMatch ? emojiMatch[0] : 'emoji'

          errors.push({
            type: 'runtime',
            severity: 'safe', // Safe porque solo reemplaza emojis con texto
            file: filePath,
            line: lineNumber,
            message: `Emoji detected in log statement: ${emojiFound}`,
            code: 'EMOJI_IN_LOG',
            rawError: line.trim(),
            autoFixable: true,
            fixStrategy: 'replace-emoji-with-text',
          })
        }
      }
    } catch (err) {
      // Ignorar errores de lectura (archivo no existe, permisos, etc.)
      continue
    }
  }

  return errors
}
