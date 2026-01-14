/**
 * Quoorum Dynamic System - Environment Configuration
 *
 * Centralized environment variables, feature flags, and integration settings.
 * Separate from forum config to avoid conflicts.
 */

import { quoorumLogger } from './logger'

// ============================================
// Environment Variables
// ============================================

const env = {
  // Database
  databaseUrl: process.env['DATABASE_URL'],

  // OpenAI (Required)
  openaiApiKey: process.env['OPENAI_API_KEY'],

  // Pinecone (Optional)
  pineconeApiKey: process.env['PINECONE_API_KEY'],
  pineconeEnvironment: process.env['PINECONE_ENVIRONMENT'] || 'us-east-1-aws',
  pineconeIndexName: process.env['PINECONE_INDEX_NAME'] || 'quoorum-debates',

  // Serper (Optional)
  serperApiKey: process.env['SERPER_API_KEY'],

  // Redis (Optional)
  redisUrl: process.env['REDIS_URL'] || process.env['UPSTASH_REDIS_REST_URL'],

  // Resend (Optional)
  resendApiKey: process.env['RESEND_API_KEY'],

  // Slack (Optional)
  slackWebhookUrl: process.env['SLACK_WEBHOOK_URL'],

  // Discord (Optional)
  discordWebhookUrl: process.env['DISCORD_WEBHOOK_URL'],

  // App URLs
  appUrl: process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000',
  wsUrl: process.env['NEXT_PUBLIC_WS_URL'] || 'ws://localhost:3001',

  // Node environment
  nodeEnv: process.env['NODE_ENV'] || 'development',
}

// ============================================
// Feature Flags
// ============================================

export const features = {
  // Core features (always enabled)
  dynamicSystem: true,
  expertDatabase: true,
  qualityMonitor: true,
  metaModerator: true,

  // Optional features (based on env vars)
  pinecone: env.pineconeApiKey !== undefined && process.env['ENABLE_PINECONE'] !== 'false',
  serper: env.serperApiKey !== undefined && process.env['ENABLE_SERPER'] !== 'false',
  redis: env.redisUrl !== undefined && process.env['ENABLE_REDIS'] !== 'false',
  email: env.resendApiKey !== undefined && process.env['ENABLE_EMAIL'] !== 'false',
  slack: env.slackWebhookUrl !== undefined && process.env['ENABLE_SLACK'] !== 'false',
  discord: env.discordWebhookUrl !== undefined && process.env['ENABLE_DISCORD'] !== 'false',

  // Advanced features
  learningSystem: true, // Always enabled, uses in-memory if no DB
  questionSimilarity: env.openaiApiKey !== undefined, // Requires OpenAI for embeddings
  caching: true, // Always enabled, uses in-memory if no Redis
  rateLimit: true, // Always enabled
  websocket: true, // Always enabled
  pdfExport: true, // Always enabled
  notifications: true, // Always enabled (in-app)
}

// ============================================
// Environment Configuration
// ============================================

export const envConfig = {
  // Environment
  env: env.nodeEnv,
  isDevelopment: env.nodeEnv === 'development',
  isProduction: env.nodeEnv === 'production',

  // URLs
  appUrl: env.appUrl,
  wsUrl: env.wsUrl,

  // Database
  database: {
    url: env.databaseUrl,
    enabled: env.databaseUrl !== undefined,
  },

  // OpenAI
  openai: {
    apiKey: env.openaiApiKey,
    enabled: env.openaiApiKey !== undefined,
    model: 'gpt-4-turbo-preview',
    embeddingModel: 'text-embedding-3-small',
  },

  // Pinecone
  pinecone: {
    apiKey: env.pineconeApiKey,
    environment: env.pineconeEnvironment,
    indexName: env.pineconeIndexName,
    enabled: features.pinecone,
  },

  // Serper
  serper: {
    apiKey: env.serperApiKey,
    enabled: features.serper,
  },

  // Redis
  redis: {
    url: env.redisUrl,
    enabled: features.redis,
    ttl: 3600, // 1 hour default
  },

  // Email
  email: {
    apiKey: env.resendApiKey,
    enabled: features.email,
    from: 'Quoorum <noreply@quoorum.pro>',
  },

  // Slack
  slack: {
    webhookUrl: env.slackWebhookUrl,
    enabled: features.slack,
  },

  // Discord
  discord: {
    webhookUrl: env.discordWebhookUrl,
    enabled: features.discord,
  },

  // WebSocket
  websocket: {
    port: 3001,
    enabled: features.websocket,
  },

  // Features
  features,
}

// ============================================
// Validation
// ============================================

export function validateEnvConfig(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required variables
  if (!envConfig.openai.enabled) {
    errors.push('OPENAI_API_KEY is required for AI features')
  }

  if (!envConfig.database.enabled) {
    warnings.push('DATABASE_URL not set. Using in-memory storage (data will be lost on restart)')
  }

  // Check optional integrations
  if (!envConfig.pinecone.enabled) {
    warnings.push('Pinecone not configured. Similarity search will use basic matching.')
  }

  if (!envConfig.serper.enabled) {
    warnings.push('Serper not configured. Context loading will use limited sources.')
  }

  if (!envConfig.redis.enabled) {
    warnings.push('Redis not configured. Using in-memory caching.')
  }

  if (!envConfig.email.enabled) {
    warnings.push('Resend not configured. Email notifications disabled.')
  }

  if (!envConfig.slack.enabled) {
    warnings.push('Slack webhook not configured. Slack notifications disabled.')
  }

  if (!envConfig.discord.enabled) {
    warnings.push('Discord webhook not configured. Discord notifications disabled.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================
// Initialize
// ============================================

export function initializeEnvConfig(): void {
  quoorumLogger.info('Initializing Forum environment configuration...')

  const validation = validateEnvConfig()

  // Log warnings
  validation.warnings.forEach((warning) => quoorumLogger.warn('Environment configuration warning', { warning }))

  // Throw on errors
  if (!validation.valid) {
    quoorumLogger.error('Environment configuration validation failed', new Error('Configuration validation failed'), {
      errors: validation.errors,
    })
    throw new Error(`Configuration errors: ${validation.errors.join(', ')}`)
  }

  quoorumLogger.info('Forum environment configuration initialized', {
    env: envConfig.env,
    enabledFeatures: Object.entries(features)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name),
  })
}

// ============================================
// Helpers
// ============================================

export function isFeatureEnabled(feature: keyof typeof features): boolean {
  return features[feature] === true
}

export function getEnvConfig<T extends keyof typeof envConfig>(key: T): (typeof envConfig)[T] {
  return envConfig[key]
}

// ============================================
// Export
// ============================================

export default envConfig
