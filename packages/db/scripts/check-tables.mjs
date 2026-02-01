import postgres from 'postgres'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '../../../.env.local') })

const sql = postgres(process.env.DATABASE_URL)

async function checkTables() {
  try {
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('strategic_profiles', 'market_simulations')
      ORDER BY table_name
    `

    console.log('Tables found:', result.map(r => r.table_name))

    if (result.find(r => r.table_name === 'strategic_profiles')) {
      const count = await sql`SELECT COUNT(*) as count FROM strategic_profiles WHERE type = 'buyer_persona'`
      console.log('Buyer personas in DB:', count[0].count)
    }

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await sql.end()
  }
}

checkTables()
