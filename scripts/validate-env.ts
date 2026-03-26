#!/usr/bin/env tsx
/**
 * Environment Variables Validation Script
 * 
 * Run this script to validate your environment variables:
 *   pnpm tsx scripts/validate-env.ts
 * 
 * Or use: pnpm validate:env
 */

import { validateEnv, envConfig } from '../apps/web/src/lib/env';

console.log('[INFO] Validating environment variables...\n');

const legacyWarnings: string[] = [];
if (process.env.FROM_EMAIL && !process.env.QUOORUM_EMAIL_FROM) {
  legacyWarnings.push('FROM_EMAIL is legacy. Prefer QUOORUM_EMAIL_FROM as the canonical sender variable.');
}
if (process.env.PINECONE_INDEX_NAME && !process.env.PINECONE_INDEX) {
  legacyWarnings.push('PINECONE_INDEX_NAME is legacy. Prefer PINECONE_INDEX as the canonical index variable.');
}

const result = validateEnv();

// Print results
if (result.errors.length > 0) {
  console.error('[ERROR] CRITICAL ERRORS (App will not work):\n');
  result.errors.forEach((error, index) => {
    console.error(`  ${index + 1}. ${error}`);
  });
  console.error('\n[INFO] Fix these errors before running the app.\n');
}

if (result.warnings.length > 0) {
  console.warn('[WARN] WARNINGS (Features may be disabled):\n');
  result.warnings.forEach((warning, index) => {
    console.warn(`  ${index + 1}. ${warning}`);
  });
  console.warn('');
}

if (legacyWarnings.length > 0) {
  console.warn('[WARN] LEGACY VARIABLE NAMES:\n');
  legacyWarnings.forEach((warning, index) => {
    console.warn(`  ${index + 1}. ${warning}`);
  });
  console.warn('');
}

if (result.valid && result.warnings.length === 0 && legacyWarnings.length === 0) {
  console.log('[OK] All environment variables are configured correctly!\n');
} else if (result.valid) {
  console.log('[OK] Critical variables are set. Some optional features may be disabled.\n');
}

// Print missing variables summary
if (result.missing.critical.length > 0) {
  console.log('[INFO] Missing CRITICAL variables:');
  result.missing.critical.forEach((varName) => {
    console.log(`   - ${varName}`);
  });
  console.log('');
}

if (result.missing.important.length > 0) {
  console.log('[INFO] Missing IMPORTANT variables:');
  result.missing.important.forEach((varName) => {
    console.log(`   - ${varName}`);
  });
  console.log('');
}

// Print configuration status
console.log('[INFO] Configuration Status:');
console.log(`   Environment: ${envConfig.nodeEnv}`);
console.log(`   App URL: ${envConfig.appUrl}`);
console.log(`   Database: ${envConfig.database.enabled ? '[OK]' : '[ERROR]'}`);
console.log(`   Supabase: ${envConfig.supabase.enabled ? '[OK]' : '[ERROR]'}`);
console.log(`   OpenAI: ${envConfig.openai.enabled ? '[OK]' : '[ERROR]'}`);
console.log(`   Stripe: ${envConfig.stripe.enabled ? '[OK]' : '[WARN]'}`);
console.log(`   Email: ${envConfig.email.enabled ? '[OK]' : '[WARN]'}`);
console.log(`   Pinecone: ${envConfig.pinecone.enabled ? '[OK]' : '[WARN]'}`);
console.log(`   Redis: ${envConfig.redis.enabled ? '[OK]' : '[WARN]'}`);
console.log('');

// Exit with error code if validation failed
if (!result.valid) {
  console.error('[ERROR] Validation failed. Please fix the errors above.');
  process.exit(1);
}

console.log('[OK] Validation passed!');
process.exit(0);
