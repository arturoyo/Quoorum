/**
 * Seed script for debate flow prompts
 *
 * Populates system_prompts table with all prompts from debate-prompts-config.ts
 *
 * Usage:
 *   pnpm db:seed:prompts
 */

import { db } from '../src'
import { sql } from 'drizzle-orm'
import { DEBATE_PROMPTS_DEFAULTS } from '@quoorum/quoorum/config/debate-prompts-config'

async function seedDebatePrompts() {
  console.log('[INFO] Seeding debate prompts...')

  const prompts = Object.values(DEBATE_PROMPTS_DEFAULTS)
  let inserted = 0
  let updated = 0
  let skipped = 0

  for (const prompt of prompts) {
    try {
      // Check if prompt already exists
      const existing = await db.execute(sql`
        SELECT id FROM system_prompts WHERE key = ${prompt.slug} LIMIT 1
      `)

      if (existing && existing.length > 0) {
        // Update existing prompt
        await db.execute(sql`
          UPDATE system_prompts
          SET
            name = ${prompt.name},
            description = ${prompt.description},
            category = ${prompt.category},
            prompt = ${prompt.template},
            system_prompt = ${prompt.systemPrompt || null},
            phase = ${prompt.phase},
            variables = ${JSON.stringify(prompt.variables)}::jsonb,
            recommended_model = ${prompt.recommendedModel},
            economic_model = ${prompt.economicModel},
            balanced_model = ${prompt.balancedModel},
            performance_model = ${prompt.performanceModel},
            temperature = ${prompt.temperature},
            max_tokens = ${prompt.maxTokens},
            order_in_phase = ${prompt.orderInPhase},
            updated_at = NOW()
          WHERE key = ${prompt.slug}
        `)
        updated++
        console.log(`  [OK] Updated: ${prompt.slug}`)
      } else {
        // Insert new prompt
        await db.execute(sql`
          INSERT INTO system_prompts (
            key, name, description, category, prompt,
            system_prompt, phase, variables,
            recommended_model, economic_model, balanced_model, performance_model,
            temperature, max_tokens, order_in_phase,
            is_active, version
          ) VALUES (
            ${prompt.slug},
            ${prompt.name},
            ${prompt.description},
            ${prompt.category},
            ${prompt.template},
            ${prompt.systemPrompt || null},
            ${prompt.phase},
            ${JSON.stringify(prompt.variables)}::jsonb,
            ${prompt.recommendedModel},
            ${prompt.economicModel},
            ${prompt.balancedModel},
            ${prompt.performanceModel},
            ${prompt.temperature},
            ${prompt.maxTokens},
            ${prompt.orderInPhase},
            true,
            1
          )
        `)
        inserted++
        console.log(`  [OK] Inserted: ${prompt.slug}`)
      }
    } catch (error) {
      console.error(`  [ERROR] Error processing ${prompt.slug}:`, error)
      skipped++
    }
  }

  console.log(`\n[INFO] Summary:`)
  console.log(`   Inserted: ${inserted}`)
  console.log(`   Updated:  ${updated}`)
  console.log(`   Skipped:  ${skipped}`)
  console.log(`   Total:    ${prompts.length}`)
  console.log('\n[OK] Debate prompts seeded successfully!')
}

export { seedDebatePrompts }

// Run if called directly
seedDebatePrompts()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error seeding prompts:', error)
    process.exit(1)
  })
