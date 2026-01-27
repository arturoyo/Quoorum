/**
 * Environment Variables Validator
 *
 * Valida que todas las variables de entorno críticas están configuradas
 * Falla explícitamente si falta alguna variable crítica
 *
 * [WARN] NO USAR PLACEHOLDERS SILENCIOSOS
 */

import { logger } from './logger'

interface EnvValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// ═══════════════════════════════════════════════════════════
// REQUIRED ENV VARS (CRITICAL - App won't work without them)
// ═══════════════════════════════════════════════════════════

const REQUIRED_ENV_VARS = {
  // Database
  DATABASE_URL: {
    description: 'PostgreSQL connection string',
    example: 'postgresql://user:password@localhost:5432/dbname',
  },

  // Authentication
  SUPABASE_URL: {
    description: 'Supabase project URL',
    example: 'https://xxx.supabase.co',
  },
  SUPABASE_ANON_KEY: {
    description: 'Supabase anon/public key',
    example: 'eyJxxx...',
  },

  // Next.js
  NEXT_PUBLIC_APP_URL: {
    description: 'Public URL of the application',
    example: 'https://example.com',
  },
}

// ═══════════════════════════════════════════════════════════
// OPTIONAL BUT RECOMMENDED (App works but with degraded features)
// ═══════════════════════════════════════════════════════════

const RECOMMENDED_ENV_VARS = {
  RESEND_API_KEY: {
    description: 'Resend API key for sending emails',
    example: 're_xxx...',
    impact: '[CRITICAL] NO emails will be sent (auth, notifications, etc.)',
  },
  STRIPE_SECRET_KEY: {
    description: 'Stripe secret key for payments',
    example: 'sk_live_xxx... or sk_test_xxx...',
    impact: '[CRITICAL] Payments will fail',
  },
  STRIPE_WEBHOOK_SECRET: {
    description: 'Stripe webhook secret for verifying webhooks',
    example: 'whsec_xxx...',
    impact: '[WARN] Webhooks will not be verified (security risk)',
  },
  OPENAI_API_KEY: {
    description: 'OpenAI API key',
    example: 'sk-xxx...',
    impact: '[WARN] AI features using OpenAI will not work',
  },
  ANTHROPIC_API_KEY: {
    description: 'Anthropic API key',
    example: 'sk-ant-xxx...',
    impact: '[WARN] AI features using Claude will not work',
  },
  GOOGLE_AI_API_KEY: {
    description: 'Google AI (Gemini) API key',
    example: 'AIzxxx...',
    impact: '[WARN] AI features using Gemini will not work',
  },
}

// ═══════════════════════════════════════════════════════════
// VALIDATION FUNCTION
// ═══════════════════════════════════════════════════════════

export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required vars
  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS)) {
    // For Supabase vars, also check NEXT_PUBLIC_ prefixed versions
    let value = process.env[key]
    if (!value && (key === 'SUPABASE_URL' || key === 'SUPABASE_ANON_KEY')) {
      value = process.env[`NEXT_PUBLIC_${key}`]
    }

    if (!value) {
      errors.push(
        `[REQUIRED] ${key}\n` +
        `   ${config.description}\n` +
        `   Example: ${config.example}`
      )
    } else if (value.includes('placeholder') || value.includes('example')) {
      errors.push(
        `[PLACEHOLDER] ${key} has placeholder value\n` +
        `   Current: ${value}\n` +
        `   Set a real value in .env`
      )
    }
  }

  // Check recommended vars
  for (const [key, config] of Object.entries(RECOMMENDED_ENV_VARS)) {
    const value = process.env[key]

    if (!value) {
      warnings.push(
        `[MISSING] ${key}\n` +
        `   ${config.description}\n` +
        `   Impact: ${config.impact}\n` +
        `   Example: ${config.example}`
      )
    } else if (value.includes('placeholder') || value.includes('example')) {
      warnings.push(
        `[PLACEHOLDER] ${key} has placeholder value\n` +
        `   Current: ${value}\n` +
        `   Impact: ${config.impact}\n` +
        `   Set a real value in .env`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ═══════════════════════════════════════════════════════════
// STARTUP VALIDATION (solo una vez por proceso)
// En dev, la ruta tRPC se recarga en cada HMR → sin este guard
// los WARN se repetirían constantemente.
// ═══════════════════════════════════════════════════════════

const g = globalThis as { __envValidated?: boolean }

export function validateEnvironmentOrThrow(): void {
  if (g.__envValidated) return

  const result = validateEnvironment()

  if (!result.valid) {
    logger.error('--- ENVIRONMENT VALIDATION FAILED ---')
    result.errors.forEach((errorMsg) => {
      logger.error(errorMsg)
    })
    logger.error('--- HOW TO FIX: ---')
    logger.error('1. Copy .env.example to .env.local')
    logger.error('2. Fill in the required values')
    logger.error('3. Restart the server')
    logger.error('-------------------------------------')
    throw new Error('Missing required environment variables')
  }

  g.__envValidated = true

  const isDev = process.env.NODE_ENV === 'development'
  const hideWarnings =
    process.env.QUIET_ENV_WARNINGS === '1' ||
    (isDev && process.env.SHOW_ENV_WARNINGS !== '1')

  if (result.warnings.length > 0 && !hideWarnings) {
    logger.warn('--- ENVIRONMENT WARNINGS ---')
    result.warnings.forEach((warning) => {
      logger.warn(warning)
    })
    logger.warn('Not blocking, but features may be degraded.')
    if (isDev) {
      logger.warn('In dev, warnings are hidden by default. Set SHOW_ENV_WARNINGS=1 to see them.')
    } else {
      logger.warn('Set QUIET_ENV_WARNINGS=1 to hide.')
    }
    logger.warn('-------------------------------------')
  }
}

// ═══════════════════════════════════════════════════════════
// HELPER: Check if a specific env var is set
// ═══════════════════════════════════════════════════════════

export function requireEnv(key: string): string {
  const value = process.env[key]

  if (!value || value.includes('placeholder') || value.includes('example')) {
    throw new Error(
      `Missing or invalid environment variable: ${key}\n` +
      `Set a real value in .env.local`
    )
  }

  return value
}

// ═══════════════════════════════════════════════════════════
// HELPER: Get env var with fallback (but warn if using fallback)
// ═══════════════════════════════════════════════════════════

export function getEnvOrWarn(key: string, fallback: string, impact: string): string {
  const value = process.env[key]

  if (!value || value.includes('placeholder')) {
    logger.warn(`[FALLBACK] ${key}: ${impact}`, {
      suggestion: 'Set real value in .env.local to fix',
    })
    return fallback
  }

  return value
}
