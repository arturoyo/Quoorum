/**
 * Environment Variables Configuration
 *
 * Validates and exports environment variables for type safety
 */

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

export const env = {
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,

  // Stripe Price IDs (Subscriptions)
  STRIPE_STARTER_MONTHLY_PRICE_ID: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
  STRIPE_STARTER_YEARLY_PRICE_ID: process.env.STRIPE_STARTER_YEARLY_PRICE_ID!,
  STRIPE_PRO_MONTHLY_PRICE_ID: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
  STRIPE_PRO_YEARLY_PRICE_ID: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
  STRIPE_BUSINESS_MONTHLY_PRICE_ID: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID!,
  STRIPE_BUSINESS_YEARLY_PRICE_ID: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID!,

  // Stripe Price IDs (Credit Packs)
  STRIPE_CREDITS_100_PRICE_ID: process.env.STRIPE_CREDITS_100_PRICE_ID!,
  STRIPE_CREDITS_500_PRICE_ID: process.env.STRIPE_CREDITS_500_PRICE_ID!,
  STRIPE_CREDITS_1000_PRICE_ID: process.env.STRIPE_CREDITS_1000_PRICE_ID!,
  STRIPE_CREDITS_5000_PRICE_ID: process.env.STRIPE_CREDITS_5000_PRICE_ID!,
  STRIPE_CREDITS_10000_PRICE_ID: process.env.STRIPE_CREDITS_10000_PRICE_ID!,

  // App URLs
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}

// ============================================================================
// VALIDATION
// ============================================================================

const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}
