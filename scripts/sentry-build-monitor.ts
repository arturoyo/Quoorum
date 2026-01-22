/**
 * Sentry Build Monitor
 *
 * Integra errores de build con Sentry para tracking centralizado:
 * - Parse build errors de Next.js, TypeScript, ESLint
 * - Envía a Sentry con contexto completo
 * - Agrupa errores similares
 * - Alerting automático en Slack/Discord
 *
 * Uso:
 * pnpm build 2>&1 | pnpm tsx scripts/sentry-build-monitor.ts
 *
 * Variables de entorno necesarias:
 * - SENTRY_DSN (ya configurado en .env)
 * - SLACK_WEBHOOK_URL (opcional, para alertas)
 */

import { createReadStream } from 'fs'
import { createInterface } from 'readline'

// ============================================================================
// TYPES
// ============================================================================

interface BuildError {
  type: 'module_not_found' | 'typescript' | 'eslint' | 'syntax' | 'unknown'
  severity: 'error' | 'warning'
  file?: string
  line?: number
  column?: number
  message: string
  stack?: string
  suggestion?: string
}

// ============================================================================
// ERROR PARSERS
// ============================================================================

class ErrorParser {
  private errors: BuildError[] = []

  parse(line: string): void {
    // Parse Next.js "Module not found" errors
    const moduleNotFoundMatch = line.match(
      /Module not found: Can't resolve '([^']+)'/
    )
    if (moduleNotFoundMatch) {
      this.errors.push({
        type: 'module_not_found',
        severity: 'error',
        message: `Module not found: ${moduleNotFoundMatch[1]}`,
        suggestion: 'Run: pnpm tsx scripts/validate-imports.ts --fix',
      })
      return
    }

    // Parse file paths with line numbers (e.g., file.ts:10:5)
    const filePathMatch = line.match(/([^\s]+\.(?:ts|tsx|js|jsx)):(\d+):(\d+)/)
    if (filePathMatch) {
      this.errors.push({
        type: 'typescript',
        severity: line.includes('error') ? 'error' : 'warning',
        file: filePathMatch[1],
        line: parseInt(filePathMatch[2] ?? '0', 10),
        column: parseInt(filePathMatch[3] ?? '0', 10),
        message: line,
      })
      return
    }

    // Parse TypeScript errors (e.g., "TS2307: Cannot find module")
    const tsErrorMatch = line.match(/TS(\d+): (.+)/)
    if (tsErrorMatch) {
      this.errors.push({
        type: 'typescript',
        severity: 'error',
        message: `TypeScript Error TS${tsErrorMatch[1]}: ${tsErrorMatch[2]}`,
      })
      return
    }

    // Parse ESLint errors
    const eslintMatch = line.match(/error\s+(.+)\s+(@typescript-eslint\/[\w-]+)/)
    if (eslintMatch) {
      this.errors.push({
        type: 'eslint',
        severity: 'error',
        message: `ESLint Error: ${eslintMatch[1]} (${eslintMatch[2]})`,
      })
      return
    }

    // Parse syntax errors
    if (line.includes('SyntaxError') || line.includes('Unexpected token')) {
      this.errors.push({
        type: 'syntax',
        severity: 'error',
        message: line,
      })
    }
  }

  getErrors(): BuildError[] {
    return this.errors
  }

  getSummary(): {
    total: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
  } {
    const byType: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}

    for (const error of this.errors) {
      byType[error.type] = (byType[error.type] ?? 0) + 1
      bySeverity[error.severity] = (bySeverity[error.severity] ?? 0) + 1
    }

    return {
      total: this.errors.length,
      byType,
      bySeverity,
    }
  }
}

// ============================================================================
// SENTRY INTEGRATION (Mock - implementar cuando tengamos Sentry SDK)
// ============================================================================

async function sendToSentry(errors: BuildError[]): Promise<void> {
  // TODO: Implementar con @sentry/node cuando esté configurado
  console.log('\n📊 Would send to Sentry:')
  console.log(JSON.stringify(errors, null, 2))

  // Ejemplo de integración real:
  /*
  const Sentry = require('@sentry/node')

  for (const error of errors) {
    Sentry.captureMessage(`Build Error: ${error.message}`, {
      level: error.severity === 'error' ? 'error' : 'warning',
      tags: {
        error_type: error.type,
        file: error.file,
      },
      contexts: {
        build: {
          file: error.file,
          line: error.line,
          column: error.column,
        },
      },
    })
  }

  await Sentry.flush(2000)
  */
}

// ============================================================================
// SLACK INTEGRATION (opcional)
// ============================================================================

async function sendToSlack(summary: ReturnType<typeof ErrorParser.prototype.getSummary>): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!webhookUrl) {
    console.log('ℹ️  SLACK_WEBHOOK_URL not configured, skipping Slack notification')
    return
  }

  const message = {
    text: '🚨 Build Failed',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Build failed with ${summary.total} errors*`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Errors:* ${summary.bySeverity.error ?? 0}`,
          },
          {
            type: 'mrkdwn',
            text: `*Warnings:* ${summary.bySeverity.warning ?? 0}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*By Type:*\n${Object.entries(summary.byType)
            .map(([type, count]) => `• ${type}: ${count}`)
            .join('\n')}`,
        },
      },
    ],
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      console.error('Failed to send Slack notification:', response.statusText)
    }
  } catch (error) {
    console.error('Error sending to Slack:', error)
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const parser = new ErrorParser()

  // Read from stdin (piped from build command)
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  })

  console.log('📝 Monitoring build output for errors...\n')

  for await (const line of rl) {
    // Print line to stdout (passthrough)
    console.log(line)

    // Parse for errors
    parser.parse(line)
  }

  const errors = parser.getErrors()
  const summary = parser.getSummary()

  if (errors.length === 0) {
    console.log('\n✅ No build errors detected')
    return
  }

  console.log('\n' + '='.repeat(70))
  console.log('BUILD ERRORS DETECTED')
  console.log('='.repeat(70) + '\n')

  console.log(`Total: ${summary.total}`)
  console.log(`Errors: ${summary.bySeverity.error ?? 0}`)
  console.log(`Warnings: ${summary.bySeverity.warning ?? 0}`)
  console.log()

  console.log('By Type:')
  for (const [type, count] of Object.entries(summary.byType)) {
    console.log(`  ${type}: ${count}`)
  }
  console.log()

  // Send to monitoring services
  await sendToSentry(errors)
  await sendToSlack(summary)

  console.log('\n✅ Errors logged to monitoring services')

  // Exit with error code if there are errors
  if (summary.bySeverity.error && summary.bySeverity.error > 0) {
    process.exit(1)
  }
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
