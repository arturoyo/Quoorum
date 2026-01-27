/**
 * Seed Scenarios Script
 *
 * Ejecuta: pnpm tsx packages/db/scripts/seed-scenarios.ts
 */

import { seedScenarios } from '../src/seed/scenarios'

async function main() {
  try {
    await seedScenarios()
    console.log('[OK] Scenarios seeded successfully')
    process.exit(0)
  } catch (error) {
    console.error('[ERROR] Failed to seed scenarios:', error)
    process.exit(1)
  }
}

main()
