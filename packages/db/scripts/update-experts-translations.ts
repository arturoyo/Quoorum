/**
 * Update Experts Translations
 *
 * Updates existing library experts with Spanish translations from EXPERT_DATABASE
 * This script updates title and description (perspective) fields for existing experts
 */

import { db } from '../src/client'
import { experts } from '../src/schema'
import { getAllExperts } from '../../quoorum/src/expert-database'
import { EXPERT_CATEGORIES } from '../../quoorum/src/config/expert-config'
import { eq, and, isNull } from 'drizzle-orm'

/**
 * Map old categories to new library categories
 */
function mapCategory(expertId: string, oldCategory: string | undefined): string {
  // Use EXPERT_CATEGORIES mapping if available
  const categoryFromMapping = EXPERT_CATEGORIES[expertId as keyof typeof EXPERT_CATEGORIES]
  const category = categoryFromMapping || oldCategory || 'general'

  const categoryMap: Record<string, string> = {
    // Business categories → empresa
    positioning: 'empresa',
    conversion: 'empresa',
    sales: 'empresa',
    pricing: 'empresa',
    product: 'empresa',
    growth: 'empresa',
    operations: 'empresa',
    technical: 'empresa', // AI/ML technical experts are business-related
    fundraising: 'empresa',
    // General/critical thinking → general
    general: 'general',
    // vida-personal and historicos can be added later when we have experts in those categories
    'vida-personal': 'vida-personal',
    'historicos': 'historicos',
  }

  // Special case: critic is always 'general'
  if (expertId === 'critic') {
    return 'general'
  }

  return categoryMap[category] || 'empresa'
}

/**
 * Update library experts with translations from EXPERT_DATABASE
 */
async function updateExpertsTranslations() {
  console.log('🌍 Actualizando traducciones de expertos...')

  try {
    // Get all experts from EXPERT_DATABASE
    const expertProfiles = getAllExperts()
    console.log(`📚 Found ${expertProfiles.length} experts in EXPERT_DATABASE`)

    // Get all library experts from DB
    const libraryExperts = await db
      .select({ id: experts.id, name: experts.name })
      .from(experts)
      .where(isNull(experts.userId))

    console.log(`📊 Found ${libraryExperts.length} library experts in DB`)

    let updated = 0
    let skipped = 0

    for (const expertProfile of expertProfiles) {
      // Find matching expert in DB by name
      const dbExpert = libraryExperts.find((e) => e.name === expertProfile.name)

      if (!dbExpert) {
        skipped++
        continue
      }

      // Update with new title, description (perspective), and category
      const expertiseStr = Array.isArray(expertProfile.expertise)
        ? expertProfile.expertise.join(', ')
        : String(expertProfile.expertise || '')

      const descriptionStr =
        typeof expertProfile.perspective === 'string'
          ? expertProfile.perspective
          : JSON.stringify(expertProfile.perspective, null, 2)

      const category = mapCategory(expertProfile.id, expertProfile.title?.toLowerCase())

      try {
        await db
          .update(experts)
          .set({
            name: expertProfile.name, // Keep original name
            expertise: expertiseStr,
            description: descriptionStr,
            category: category,
            updatedAt: new Date(),
          })
          .where(eq(experts.id, dbExpert.id))

        updated++
        console.log(`✅ Updated: ${expertProfile.name}`)
      } catch (error) {
        console.error(`❌ Error updating expert ${expertProfile.name}:`, error)
      }
    }

    console.log(`✅ Updated ${updated} experts`)
    if (skipped > 0) {
      console.log(`⏭️  Skipped ${skipped} experts (not found in DB)`)
    }

    console.log('✅ Experts translations update complete!')
  } catch (error) {
    console.error('❌ Error updating experts translations:', error)
    throw error
  }
}

// Run if executed directly
if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/')) || import.meta.url.includes('update-experts-translations.ts')) {
  updateExpertsTranslations()
    .then(() => {
      console.log('🎉 Translations update completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Translations update failed:', error)
      process.exit(1)
    })
}

export { updateExpertsTranslations }
