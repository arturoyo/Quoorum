/**
 * Migration Script: Convert Experts & Professionals to Strategic Profiles
 *
 * This script migrates existing experts and workers/professionals
 * to the new unified strategic_profiles architecture
 */

import { db } from '../src/index'
import { experts, workers, strategicProfiles } from '../src/schema'
import { eq } from 'drizzle-orm'

interface MigrationStats {
  expertsProcessed: number
  professionalsProcessed: number
  errors: number
  skipped: number
}

/**
 * Convert expert to strategic profile
 */
async function migrateExpert(expert: any): Promise<boolean> {
  try {
    // Extract AI config from expert
    const aiConfig = {
      systemPrompt: expert.systemPrompt || undefined,
      model: expert.aiConfig?.model || 'gpt-4-turbo',
      temperature: expert.aiConfig?.temperature || 0.7,
      maxTokens: expert.aiConfig?.maxTokens || 2000,
      responseFormat: 'text' as const,
    }

    // Map expert fields to strategic profile
    await db.insert(strategicProfiles).values({
      type: 'expert',
      name: expert.name,
      slug: expert.slug,
      title: expert.expertise,
      description: expert.description,
      category: expert.category,
      specialization: expert.expertise,

      // Behavioral
      objective: `Provide expert analysis and guidance on ${expert.expertise}`,
      toneStyles: ['analytical', 'direct'], // Default tones for experts
      autonomyLevel: 7, // Experts have high autonomy
      behaviorRules: expert.guidelines || undefined,

      // Knowledge
      expertiseAreas: expert.focusAreas || [],
      industries: expert.industries || [],
      biasesToMitigate: expert.biasesToMitigate || [],

      // AI Config
      aiConfig,

      // Metadata
      isGlobal: expert.isGlobal || false,
      isActive: expert.isActive !== false,
      tags: expert.tags || [],

      // Ownership (preserve original creator if exists)
      userId: expert.userId || null,
      companyId: expert.companyId || null,
      createdBy: expert.createdBy || null,
    })

    console.log(`[OK] Migrated expert: ${expert.name}`)
    return true
  } catch (error) {
    console.error(`[ERROR] Failed to migrate expert ${expert.name}:`, error)
    return false
  }
}

/**
 * Convert professional/worker to strategic profile
 */
async function migrateProfessional(worker: any): Promise<boolean> {
  try {
    // Extract AI config
    const aiConfig = {
      systemPrompt: worker.systemPrompt || undefined,
      model: worker.model || 'gpt-4-turbo',
      temperature: worker.temperature || 0.7,
      maxTokens: worker.maxTokens || 2000,
      responseFormat: 'text' as const,
    }

    // Map worker fields to strategic profile
    await db.insert(strategicProfiles).values({
      type: 'professional',
      name: worker.name,
      slug: worker.slug,
      title: worker.role,
      description: worker.description,
      category: worker.type, // Worker type becomes category
      specialization: worker.specialization,

      // Behavioral
      objective: worker.objective || `Execute specialized tasks as ${worker.role}`,
      toneStyles: ['pragmatic', 'direct'], // Default tones for professionals
      autonomyLevel: worker.autonomyLevel || 6,
      behaviorRules: worker.guidelines || undefined,

      // Knowledge
      expertiseAreas: worker.skills || [],
      industries: worker.industries || [],

      // AI Config
      aiConfig,

      // Metadata
      isGlobal: worker.isGlobal || false,
      isActive: worker.isActive !== false,
      tags: worker.tags || [],

      // Ownership
      userId: worker.userId || null,
      companyId: worker.companyId || null,
      createdBy: worker.createdBy || null,
    })

    console.log(`[OK] Migrated professional: ${worker.name}`)
    return true
  } catch (error) {
    console.error(`[ERROR] Failed to migrate professional ${worker.name}:`, error)
    return false
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('[INFO] Starting migration to Strategic Profiles...\n')

  const stats: MigrationStats = {
    expertsProcessed: 0,
    professionalsProcessed: 0,
    errors: 0,
    skipped: 0,
  }

  try {
    // Get all experts
    console.log('[INFO] Fetching existing experts...')
    const existingExperts = await db.select().from(experts)
    console.log(`Found ${existingExperts.length} experts\n`)

    // Migrate experts
    console.log('[INFO] Migrating experts...')
    for (const expert of existingExperts) {
      // Check if already migrated (by slug)
      const existing = await db.query.strategicProfiles.findFirst({
        where: eq(strategicProfiles.slug, expert.slug),
      })

      if (existing) {
        console.log(`[SKIP] Skipped (already exists): ${expert.name}`)
        stats.skipped++
        continue
      }

      const success = await migrateExpert(expert)
      if (success) {
        stats.expertsProcessed++
      } else {
        stats.errors++
      }
    }

    console.log('\n')

    // Get all professionals/workers
    console.log('[INFO] Fetching existing professionals...')
    const existingWorkers = await db.select().from(workers)
    console.log(`Found ${existingWorkers.length} professionals\n`)

    // Migrate professionals
    console.log('[INFO] Migrating professionals...')
    for (const worker of existingWorkers) {
      // Check if already migrated
      const existing = await db.query.strategicProfiles.findFirst({
        where: eq(strategicProfiles.slug, worker.slug),
      })

      if (existing) {
        console.log(`[SKIP] Skipped (already exists): ${worker.name}`)
        stats.skipped++
        continue
      }

      const success = await migrateProfessional(worker)
      if (success) {
        stats.professionalsProcessed++
      } else {
        stats.errors++
      }
    }

    // Print summary
    console.log('\n')
    console.log('=' .repeat(60))
    console.log('[INFO] MIGRATION SUMMARY')
    console.log('=' .repeat(60))
    console.log(`[OK] Experts migrated:        ${stats.expertsProcessed}`)
    console.log(`[OK] Professionals migrated:  ${stats.professionalsProcessed}`)
    console.log(`[SKIP] Skipped (duplicates):   ${stats.skipped}`)
    console.log(`[ERROR] Errors:                  ${stats.errors}`)
    console.log(`[INFO] Total processed:         ${stats.expertsProcessed + stats.professionalsProcessed}`)
    console.log('=' .repeat(60))

    if (stats.errors === 0) {
      console.log('\n[OK] Migration completed successfully!')
    } else {
      console.log(`\n[WARN] Migration completed with ${stats.errors} errors`)
    }
  } catch (error) {
    console.error('\n[ERROR] Migration failed:', error)
    process.exit(1)
  }
}

// Run migration if executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n[OK] Migration script finished')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n[ERROR] Migration script failed:', error)
      process.exit(1)
    })
}

export { runMigration, migrateExpert, migrateProfessional }
