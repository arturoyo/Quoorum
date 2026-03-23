import postgres from 'postgres'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '../../../.env.local') })

const sql = postgres(process.env.DATABASE_URL)

async function applyMigrations() {
  try {
    console.log('[INFO] Applying migrations...')

    // Migration 0045: Strategic Profiles
    console.log('\n[1/2] Applying 0045_add_strategic_profiles.sql...')
    try {
      const migration45 = readFileSync(
        join(__dirname, '../drizzle/0045_add_strategic_profiles.sql'),
        'utf-8'
      )
      await sql.unsafe(migration45)
      console.log('[OK] Strategic Profiles migration applied')
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('[SKIP] Strategic Profiles already exists')
      } else {
        throw error
      }
    }

    // Migration 0046: Market Simulations
    console.log('\n[2/2] Applying 0046_add_market_simulations.sql...')
    try {
      const migration46 = readFileSync(
        join(__dirname, '../drizzle/0046_add_market_simulations.sql'),
        'utf-8'
      )
      await sql.unsafe(migration46)
      console.log('[OK] Market Simulations migration applied')
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('[SKIP] Market Simulations already exists')
      } else {
        throw error
      }
    }

    // Verify tables exist
    console.log('\n[VERIFY] Checking tables...')
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('strategic_profiles', 'market_simulations')
      ORDER BY table_name
    `

    console.log('[OK] Tables found:', tables.map(t => t.table_name).join(', '))

    if (tables.length === 2) {
      console.log('\n[SUCCESS] All migrations applied successfully!')
    } else {
      console.log('\n[WARN] Some tables missing:', 2 - tables.length)
    }

  } catch (error) {
    console.error('\n[ERROR] Migration failed:', error.message)
    throw error
  } finally {
    await sql.end()
  }
}

applyMigrations()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
