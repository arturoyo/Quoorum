/**
 * Next.js Auto-Healer Worker
 *
 * Monitorea y corrige automáticamente errores de Next.js/TypeScript/ESLint
 *
 * Ejecuta cada 5 minutos:
 * 1. Lee logs de build/typecheck/lint
 * 2. Detecta y clasifica errores
 * 3. Aplica correcciones automáticas seguras
 * 4. Notifica al usuario de las acciones tomadas
 * 5. Registra en TIMELINE.md
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { appendFile } from 'fs/promises'
import { inngest } from '../client'
import { logger } from '../lib/logger'
import {
  parseTypeScriptErrors,
  parseESLintErrors,
  parseBuildErrors,
  type DetectedError,
} from '../lib/error-parsers'
import { applyAutoFix, type FixResult } from '../lib/auto-fix-appliers'

const execAsync = promisify(exec)

// ============================================================================
// CONFIGURATION
// ============================================================================

const AUTO_HEAL_CONFIG = {
  // Ejecutar cada 5 minutos
  cronSchedule: '*/5 * * * *',

  // Directorios a monitorear
  watchDirs: ['apps/web/src', 'packages/api/src', 'packages/db/src'],

  // Severidades que se auto-corrigen
  autoFixSeverities: ['safe', 'moderate'] as const,

  // Máximo de fixes por ejecución (prevenir loops infinitos)
  maxFixesPerRun: 10,

  // Tiempo máximo de ejecución (ms)
  timeout: 120000, // 2 minutos
}

// ============================================================================
// MAIN WORKER
// ============================================================================

export const nextjsAutoHealer = inngest.createFunction(
  {
    id: 'nextjs-auto-healer',
    name: 'Next.js Auto-Healer',
    retries: 2,
  },
  { cron: AUTO_HEAL_CONFIG.cronSchedule },
  async ({ step }) => {
    logger.info('[Auto-Healer] Starting health check...')

    // Step 1: Run typecheck
    const typescriptErrors = await step.run('check-typescript', async () => {
      return await checkTypeScript()
    })

    // Step 2: Run lint
    const eslintErrors = await step.run('check-eslint', async () => {
      return await checkESLint()
    })

    // Step 3: Check build (solo si hay cambios recientes)
    const buildErrors = await step.run('check-build', async () => {
      return await checkBuild()
    })

    // Combinar todos los errores
    const allErrors = [...typescriptErrors, ...eslintErrors, ...buildErrors]

    if (allErrors.length === 0) {
      logger.info('[Auto-Healer] No errors detected. System healthy ✅')
      return {
        success: true,
        errorsFound: 0,
        errorsFixed: 0,
      }
    }

    logger.warn('[Auto-Healer] Detected errors', {
      total: allErrors.length,
      typescript: typescriptErrors.length,
      eslint: eslintErrors.length,
      build: buildErrors.length,
    })

    // Step 4: Clasificar errores por auto-fixability
    const fixableErrors = allErrors.filter(
      (err) => err.autoFixable && AUTO_HEAL_CONFIG.autoFixSeverities.includes(err.severity)
    )

    if (fixableErrors.length === 0) {
      logger.warn('[Auto-Healer] No auto-fixable errors found. Manual intervention required.')

      // Notificar errores que requieren atención humana
      await step.run('notify-manual-fixes-needed', async () => {
        await notifyManualFixesNeeded(allErrors)
      })

      return {
        success: true,
        errorsFound: allErrors.length,
        errorsFixed: 0,
        manualFixesNeeded: allErrors.length,
      }
    }

    // Step 5: Aplicar fixes automáticos
    const fixResults = await step.run('apply-auto-fixes', async () => {
      return await applyAutoFixes(fixableErrors.slice(0, AUTO_HEAL_CONFIG.maxFixesPerRun))
    })

    const successfulFixes = fixResults.filter((r) => r.success)

    // Step 6: Re-verificar después de fixes
    const remainingErrors = await step.run('re-verify', async () => {
      return await reVerify()
    })

    // Step 7: Registrar en TIMELINE.md
    await step.run('log-to-timeline', async () => {
      await logToTimeline(successfulFixes, remainingErrors)
    })

    // Step 8: Notificar resultados
    await step.run('notify-results', async () => {
      await notifyHealingResults(successfulFixes, remainingErrors)
    })

    logger.info('[Auto-Healer] Health check completed', {
      errorsFound: allErrors.length,
      errorsFixed: successfulFixes.length,
      errorsRemaining: remainingErrors.length,
    })

    return {
      success: true,
      errorsFound: allErrors.length,
      errorsFixed: successfulFixes.length,
      errorsRemaining: remainingErrors.length,
      fixes: successfulFixes.map((f) => ({
        file: f.file,
        changes: f.changes,
      })),
    }
  }
)

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Ejecuta typecheck y parsea errores
 */
async function checkTypeScript(): Promise<DetectedError[]> {
  try {
    const { stdout, stderr } = await execAsync('cd apps/web && pnpm typecheck', {
      timeout: 60000,
    })

    const output = stdout + stderr
    return parseTypeScriptErrors(output)
  } catch (error: any) {
    // typecheck falla si hay errores (exit code != 0)
    const output = error.stdout + error.stderr
    return parseTypeScriptErrors(output)
  }
}

/**
 * Ejecuta lint y parsea errores
 */
async function checkESLint(): Promise<DetectedError[]> {
  try {
    const { stdout, stderr } = await execAsync('cd apps/web && pnpm lint', {
      timeout: 60000,
    })

    const output = stdout + stderr
    return parseESLintErrors(output)
  } catch (error: any) {
    const output = error.stdout + error.stderr
    return parseESLintErrors(output)
  }
}

/**
 * Ejecuta build y parsea errores (solo en casos específicos)
 */
async function checkBuild(): Promise<DetectedError[]> {
  // Build es costoso, solo ejecutar si detectamos cambios recientes
  // Por ahora, retornar vacío y dejar para futuro
  return []
}

/**
 * Aplica auto-fixes a los errores
 */
async function applyAutoFixes(errors: DetectedError[]): Promise<FixResult[]> {
  const results: FixResult[] = []

  for (const error of errors) {
    try {
      logger.info('[Auto-Healer] Applying fix', {
        file: error.file,
        line: error.line,
        strategy: error.fixStrategy,
      })

      const result = await applyAutoFix(error)
      results.push(result)

      if (result.success) {
        logger.info('[Auto-Healer] Fix applied successfully', {
          file: result.file,
          changes: result.changes,
        })
      } else {
        logger.warn('[Auto-Healer] Fix failed', {
          file: result.file,
          error: result.error,
        })
      }
    } catch (err) {
      logger.error('[Auto-Healer] Unexpected error applying fix', err as Error, {
        file: error.file,
      })

      results.push({
        success: false,
        file: error.file,
        changes: [],
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return results
}

/**
 * Re-verifica errores después de aplicar fixes
 */
async function reVerify(): Promise<DetectedError[]> {
  const tsErrors = await checkTypeScript()
  const eslintErrors = await checkESLint()

  return [...tsErrors, ...eslintErrors]
}

/**
 * Registra acciones en TIMELINE.md
 */
async function logToTimeline(fixes: FixResult[], remainingErrors: DetectedError[]): Promise<void> {
  const timestamp = new Date().toISOString()
  const date = new Date().toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const entry = `
### [${date}] - AUTO-HEALER: ${fixes.length} Correcciones Aplicadas
**Solicitado por:** Sistema (Auto-Healer Worker)
**Descripción:** Monitoreo automático de errores y corrección de código
**Acciones realizadas:**
${fixes.map((fix) => `- ✅ ${fix.file}: ${fix.changes.join(', ')}`).join('\n')}
**Errores restantes:** ${remainingErrors.length}
${remainingErrors.length > 0 ? `**Requieren atención manual:**\n${remainingErrors.slice(0, 5).map((err) => `- ⚠️ ${err.file}:${err.line ?? '?'} - ${err.message}`).join('\n')}` : ''}
**Resultado:** ${fixes.length > 0 ? '✅ Correcciones aplicadas' : '⚠️ Sin correcciones posibles'}
**Timestamp:** ${timestamp}
---
`

  try {
    await appendFile('TIMELINE.md', entry, 'utf-8')
  } catch (err) {
    logger.error('[Auto-Healer] Failed to write to TIMELINE.md', err as Error)
  }
}

/**
 * Notifica resultados al usuario
 */
async function notifyHealingResults(
  fixes: FixResult[],
  remainingErrors: DetectedError[]
): Promise<void> {
  // TODO: Integrar con sistema de notificaciones del proyecto
  // Por ahora, solo log

  if (fixes.length > 0) {
    logger.info('[Auto-Healer] 🔧 Auto-healing summary', {
      fixesApplied: fixes.length,
      filesModified: [...new Set(fixes.map((f) => f.file))].length,
      remainingErrors: remainingErrors.length,
    })
  }

  if (remainingErrors.length > 0) {
    logger.warn('[Auto-Healer] ⚠️ Manual intervention required', {
      errorCount: remainingErrors.length,
      criticalErrors: remainingErrors.filter((e) => e.severity === 'dangerous').length,
    })
  }
}

/**
 * Notifica errores que requieren corrección manual
 */
async function notifyManualFixesNeeded(errors: DetectedError[]): Promise<void> {
  const criticalErrors = errors.filter((e) => e.severity === 'dangerous')
  const moderateErrors = errors.filter((e) => e.severity === 'moderate')

  logger.warn('[Auto-Healer] Manual fixes needed', {
    critical: criticalErrors.length,
    moderate: moderateErrors.length,
    total: errors.length,
  })

  // Log primeros 5 errores críticos para revisión
  if (criticalErrors.length > 0) {
    criticalErrors.slice(0, 5).forEach((err) => {
      logger.error(`[Auto-Healer] CRITICAL: ${err.file}:${err.line ?? '?'} - ${err.message}`)
    })
  }
}

// ============================================================================
// MANUAL TRIGGER (para testing o uso bajo demanda)
// ============================================================================

/**
 * Trigger manual del auto-healer
 */
export const nextjsAutoHealerManual = inngest.createFunction(
  {
    id: 'nextjs-auto-healer-manual',
    name: 'Next.js Auto-Healer (Manual)',
    retries: 1,
  },
  { event: 'nextjs/auto-healer.trigger' },
  async ({ step }) => {
    logger.info('[Auto-Healer] Manual trigger received')

    // Step 1: Run typecheck
    const typescriptErrors = await step.run('check-typescript', async () => {
      return await checkTypeScript()
    })

    // Step 2: Run lint
    const eslintErrors = await step.run('check-eslint', async () => {
      return await checkESLint()
    })

    // Step 3: Check build
    const buildErrors = await step.run('check-build', async () => {
      return await checkBuild()
    })

    const allErrors = [...typescriptErrors, ...eslintErrors, ...buildErrors]

    if (allErrors.length === 0) {
      logger.info('[Auto-Healer] No errors detected. System healthy ✅')
      return { success: true, errorsFound: 0, errorsFixed: 0 }
    }

    logger.warn('[Auto-Healer] Detected errors', { total: allErrors.length })

    const fixableErrors = allErrors.filter(
      (err) => err.autoFixable && AUTO_HEAL_CONFIG.autoFixSeverities.includes(err.severity)
    )

    if (fixableErrors.length === 0) {
      await step.run('notify-manual-fixes-needed', async () => {
        await notifyManualFixesNeeded(allErrors)
      })
      return { success: true, errorsFound: allErrors.length, errorsFixed: 0 }
    }

    const fixResults = await step.run('apply-auto-fixes', async () => {
      return await applyAutoFixes(fixableErrors.slice(0, AUTO_HEAL_CONFIG.maxFixesPerRun))
    })

    const successfulFixes = fixResults.filter((r) => r.success)
    const remainingErrors = await step.run('re-verify', async () => {
      return await reVerify()
    })

    await step.run('log-to-timeline', async () => {
      await logToTimeline(successfulFixes, remainingErrors)
    })

    await step.run('notify-results', async () => {
      await notifyHealingResults(successfulFixes, remainingErrors)
    })

    return {
      success: true,
      errorsFound: allErrors.length,
      errorsFixed: successfulFixes.length,
      errorsRemaining: remainingErrors.length,
      fixes: successfulFixes.map((f) => ({ file: f.file, changes: f.changes })),
    }
  }
)
