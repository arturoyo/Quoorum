import { db } from '../src'
import { sql } from 'drizzle-orm'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigration() {
  console.log('🚀 Ejecutando migración 0039_extend_system_prompts_for_debate_flow.sql...')

  try {
    const migrationPath = path.join(__dirname, '../drizzle/0039_extend_system_prompts_for_debate_flow.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Split by semicolon to execute statements individually
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Ejecutando ${statements.length} statements...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement) {
        try {
          await db.execute(sql.raw(statement))
          console.log(`  ✓ Statement ${i + 1}/${statements.length} ejecutado`)
        } catch (error: any) {
          // Ignore "already exists" errors
          if (error.message?.includes('already exists')) {
            console.log(`  ⚠ Statement ${i + 1}/${statements.length} ya existe (ignorando)`)
          } else {
            throw error
          }
        }
      }
    }

    console.log('\n✅ Migración completada exitosamente!')
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error)
    process.exit(1)
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
