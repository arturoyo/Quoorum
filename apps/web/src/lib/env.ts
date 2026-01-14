/**
 * Environment Variables Validation
 * 
 * Centralized validation for environment variables that works in both:
 * - Local development (.env.local)
 * - Vercel (Environment Variables in dashboard)
 * 
 * This file validates critical variables and provides helpful error messages.
 */

// ============================================
// Environment Variables
// ============================================

const env = {
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // Supabase (Critical for auth)
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // OpenAI (Critical for AI features)
  openaiApiKey: process.env.OPENAI_API_KEY,
  
  // App
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Stripe (Important for payments)
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Email (Important for notifications)
  resendApiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.FROM_EMAIL || 'Quoorum <noreply@quoorum.pro>',
  
  // Optional: Pinecone
  pineconeApiKey: process.env.PINECONE_API_KEY,
  pineconeEnvironment: process.env.PINECONE_ENVIRONMENT || 'us-east-1-aws',
  pineconeIndexName: process.env.PINECONE_INDEX_NAME || 'quoorum-debates',
  
  // Optional: Redis
  redisUrl: process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL,
  
  // Optional: Serper
  serperApiKey: process.env.SERPER_API_KEY,
  
  // Optional: WebSocket
  wsPort: parseInt(process.env.QUOORUM_WS_PORT || '3001', 10),
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  
  // Optional: Notifications
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  
  // Optional: Alternative AI Providers
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  googleAiApiKey: process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  litellmApiKey: process.env.LITELLM_API_KEY,
  litellmUrl: process.env.LITELLM_URL,
} as const;

// ============================================
// Validation Result
// ============================================

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missing: {
    critical: string[];
    important: string[];
    optional: string[];
  };
}

// ============================================
// Validation Function
// ============================================

export function validateEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missing = {
    critical: [] as string[],
    important: [] as string[],
    optional: [] as string[],
  };

  const isDevelopment = env.nodeEnv === 'development';
  const isProduction = env.nodeEnv === 'production';

  // ============================================
  // CRITICAL Variables (App won't work without these)
  // ============================================
  
  if (!env.databaseUrl) {
    errors.push('DATABASE_URL is required');
    missing.critical.push('DATABASE_URL');
  }

  if (!env.supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required for authentication');
    missing.critical.push('NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!env.supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required for authentication');
    missing.critical.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  if (!env.openaiApiKey) {
    errors.push('OPENAI_API_KEY is required for AI features');
    missing.critical.push('OPENAI_API_KEY');
  }

  // ============================================
  // IMPORTANT Variables (Core features won't work)
  // ============================================
  
  if (!env.stripeSecretKey) {
    warnings.push('STRIPE_SECRET_KEY not set. Payment features will be disabled.');
    missing.important.push('STRIPE_SECRET_KEY');
  }

  if (!env.stripePublishableKey) {
    warnings.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not set. Payment UI will not work.');
    missing.important.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  }

  if (!env.resendApiKey) {
    warnings.push('RESEND_API_KEY not set. Email notifications will be disabled.');
    missing.important.push('RESEND_API_KEY');
  }

  // ============================================
  // OPTIONAL Variables (Nice to have)
  // ============================================
  
  if (!env.pineconeApiKey) {
    if (isDevelopment) {
      warnings.push('PINECONE_API_KEY not set. Similarity search will use basic matching.');
    }
    missing.optional.push('PINECONE_API_KEY');
  }

  if (!env.redisUrl) {
    if (isDevelopment) {
      warnings.push('REDIS_URL not set. Using in-memory caching.');
    }
    missing.optional.push('REDIS_URL');
  }

  if (!env.serperApiKey) {
    if (isDevelopment) {
      warnings.push('SERPER_API_KEY not set. Context loading will use limited sources.');
    }
    missing.optional.push('SERPER_API_KEY');
  }

  // ============================================
  // Environment-specific checks
  // ============================================
  
  if (isProduction) {
    if (env.appUrl.includes('localhost')) {
      warnings.push('NEXT_PUBLIC_APP_URL is set to localhost in production. Update to production URL.');
    }
    
    if (env.databaseUrl?.includes('localhost')) {
      warnings.push('DATABASE_URL points to localhost in production. Use production database.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missing,
  };
}

// ============================================
// Environment Config Export
// ============================================

export const envConfig = {
  // Environment
  isDevelopment: env.nodeEnv === 'development',
  isProduction: env.nodeEnv === 'production',
  nodeEnv: env.nodeEnv,
  
  // URLs
  appUrl: env.appUrl,
  wsUrl: env.wsUrl,
  wsPort: env.wsPort,
  
  // Database
  database: {
    url: env.databaseUrl,
    enabled: !!env.databaseUrl,
  },
  
  // Supabase
  supabase: {
    url: env.supabaseUrl,
    anonKey: env.supabaseAnonKey,
    serviceRoleKey: env.supabaseServiceRoleKey,
    enabled: !!(env.supabaseUrl && env.supabaseAnonKey),
  },
  
  // OpenAI
  openai: {
    apiKey: env.openaiApiKey,
    enabled: !!env.openaiApiKey,
  },
  
  // Stripe
  stripe: {
    secretKey: env.stripeSecretKey,
    publishableKey: env.stripePublishableKey,
    webhookSecret: env.stripeWebhookSecret,
    enabled: !!(env.stripeSecretKey && env.stripePublishableKey),
  },
  
  // Email
  email: {
    apiKey: env.resendApiKey,
    from: env.fromEmail,
    enabled: !!env.resendApiKey,
  },
  
  // Pinecone
  pinecone: {
    apiKey: env.pineconeApiKey,
    environment: env.pineconeEnvironment,
    indexName: env.pineconeIndexName,
    enabled: !!env.pineconeApiKey,
  },
  
  // Redis
  redis: {
    url: env.redisUrl,
    enabled: !!env.redisUrl,
  },
  
  // Serper
  serper: {
    apiKey: env.serperApiKey,
    enabled: !!env.serperApiKey,
  },
  
  // Alternative AI Providers
  ai: {
    anthropic: {
      apiKey: env.anthropicApiKey,
      enabled: !!env.anthropicApiKey,
    },
    google: {
      apiKey: env.googleAiApiKey,
      enabled: !!env.googleAiApiKey,
    },
    groq: {
      apiKey: env.groqApiKey,
      enabled: !!env.groqApiKey,
    },
    litellm: {
      apiKey: env.litellmApiKey,
      url: env.litellmUrl,
      enabled: !!env.litellmApiKey,
    },
  },
  
  // Notifications
  notifications: {
    slack: {
      webhookUrl: env.slackWebhookUrl,
      enabled: !!env.slackWebhookUrl,
    },
    discord: {
      webhookUrl: env.discordWebhookUrl,
      enabled: !!env.discordWebhookUrl,
    },
  },
} as const;

// ============================================
// Initialize and Validate
// ============================================

let validationResult: EnvValidationResult | null = null;

export function getEnvValidation(): EnvValidationResult {
  if (!validationResult) {
    validationResult = validateEnv();
  }
  return validationResult;
}

// Auto-validate on import (only in development)
if (typeof window === 'undefined' && env.nodeEnv === 'development') {
  const result = validateEnv();
  
  if (result.errors.length > 0) {
    console.error('❌ Environment Validation Errors:');
    result.errors.forEach((error) => console.error(`  - ${error}`));
    console.error('\n💡 Create .env.local file from .env.example and fill in the required values.');
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment Validation Warnings:');
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }
  
  if (result.valid && result.warnings.length === 0) {
    console.log('✅ Environment variables validated successfully');
  }
}

// Export default
export default envConfig;
