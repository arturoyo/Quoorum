/**
 * Environment Variables Validator
 *
 * Valida que todas las variables de entorno críticas están configuradas
 * Falla explícitamente si falta alguna variable crítica
 *
 * ⚠️ NO USAR PLACEHOLDERS SILENCIOSOS
 */

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
  // Email (without this, NO emails will be sent)
  RESEND_API_KEY: {
    description: 'Resend API key for sending emails',
    example: 're_xxx...',
    impact: '❌ CRITICAL: NO emails will be sent (auth, notifications, etc.)',
  },

  // Payments (without this, payments will fail silently)
  STRIPE_SECRET_KEY: {
    description: 'Stripe secret key for payments',
    example: 'sk_live_xxx... or sk_test_xxx...',
    impact: '❌ CRITICAL: Payments will fail',
  },
  STRIPE_WEBHOOK_SECRET: {
    description: 'Stripe webhook secret for verifying webhooks',
    example: 'whsec_xxx...',
    impact: '⚠️ Webhooks will not be verified (security risk)',
  },

  // AI Providers
  OPENAI_API_KEY: {
    description: 'OpenAI API key',
    example: 'sk-xxx...',
    impact: '⚠️ AI features using OpenAI will not work',
  },
  ANTHROPIC_API_KEY: {
    description: 'Anthropic API key',
    example: 'sk-ant-xxx...',
    impact: '⚠️ AI features using Claude will not work',
  },
  GOOGLE_AI_API_KEY: {
    description: 'Google AI (Gemini) API key',
    example: 'AIzxxx...',
    impact: '⚠️ AI features using Gemini will not work',
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
    const value = process.env[key]

    if (!value) {
      errors.push(
        `❌ REQUIRED: ${key}\n` +
        `   ${config.description}\n` +
        `   Example: ${config.example}`
      )
    } else if (value.includes('placeholder') || value.includes('example')) {
      errors.push(
        `❌ PLACEHOLDER: ${key} has placeholder value\n` +
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
        `⚠️  MISSING: ${key}\n` +
        `   ${config.description}\n` +
        `   Impact: ${config.impact}\n` +
        `   Example: ${config.example}`
      )
    } else if (value.includes('placeholder') || value.includes('example')) {
      warnings.push(
        `⚠️  PLACEHOLDER: ${key} has placeholder value\n` +
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
// STARTUP VALIDATION
// ═══════════════════════════════════════════════════════════

export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment()

  if (!result.valid) {
    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ ENVIRONMENT VALIDATION FAILED')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    result.errors.forEach((error) => {
      console.error(error)
      console.error('')
    })

    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('🔧 HOW TO FIX:')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('1. Copy .env.example to .env.local')
    console.error('2. Fill in the required values')
    console.error('3. Restart the server')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    throw new Error('Missing required environment variables')
  }

  // Show warnings but don't fail
  if (result.warnings.length > 0) {
    console.warn('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.warn('⚠️  ENVIRONMENT WARNINGS')
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    result.warnings.forEach((warning) => {
      console.warn(warning)
      console.warn('')
    })

    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.warn('These are NOT blocking, but features will be degraded')
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
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
    console.warn(
      `⚠️  Using fallback for ${key}\n` +
      `   Impact: ${impact}\n` +
      `   Set real value in .env.local to fix`
    )
    return fallback
  }

  return value
}
