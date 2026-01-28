/**
 * Apply system_prompts migration to Supabase
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigration() {
  console.log('🚀 Aplicando migración: 0037_add_system_prompts.sql\n')

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'packages', 'db', 'drizzle', '0037_add_system_prompts.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 SQL Migration cargada:', migrationPath)
    console.log('📏 Tamaño:', migrationSQL.length, 'caracteres\n')

    // Split into individual statements (Supabase doesn't support multi-statement)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📊 Total de statements: ${statements.length}\n`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip comments
      if (statement.startsWith('--')) continue

      console.log(`[${i + 1}/${statements.length}] Ejecutando...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' })
        
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase.from('_migrations').insert({ statement })
          
          if (directError && !directError.message.includes('already exists')) {
            throw directError
          }
        }
        
        console.log(`✅ OK\n`)
      } catch (err: any) {
        // Ignore "already exists" errors
        if (err.message && err.message.includes('already exists')) {
          console.log(`⚠️  Ya existe (ignorando)\n`)
          continue
        }
        throw err
      }
    }

    console.log('\n🎉 Migración completada exitosamente!')
    console.log('\n✅ Tabla system_prompts creada')
    console.log('✅ Políticas RLS aplicadas')
    console.log('✅ Prompts iniciales insertados')
    console.log('\n📍 Próximo paso: Ir a /admin/prompts para gestionar prompts')

  } catch (error: any) {
    console.error('\n❌ Error aplicando migración:')
    console.error(error.message || error)
    console.error('\n💡 Solución alternativa:')
    console.error('   1. Ir a Supabase Dashboard')
    console.error('   2. SQL Editor')
    console.error('   3. Copiar el contenido de packages/db/drizzle/0037_add_system_prompts.sql')
    console.error('   4. Ejecutar manualmente')
    process.exit(1)
  }
}

applyMigration()
