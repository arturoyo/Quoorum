import { db } from '../src'
import { sql } from 'drizzle-orm'

async function applyMigration() {
  console.log('🚀 Aplicando migración manualmente...\n')

  try {
    // 1. Add new columns to system_prompts
    console.log('1️⃣ Añadiendo columnas a system_prompts...')

    const columns = [
      'ALTER TABLE system_prompts ADD COLUMN IF NOT EXISTS phase INTEGER CHECK (phase BETWEEN 1 AND 5)',
      'ALTER TABLE system_prompts ADD COLUMN IF NOT EXISTS system_prompt TEXT',
      "ALTER TABLE system_prompts ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]'::jsonb",
      'ALTER TABLE system_prompts ADD COLUMN IF NOT EXISTS recommended_model VARCHAR(50)',
      'ALTER TABLE system_prompts ADD COLUMN IF NOT EXISTS economic_model VARCHAR(50)',
      'ALTER TABLE system_prompts ADD COLUMN IF NOT EXISTS balanced_model VARCHAR(50)',
      'ALTER TABLE system_prompts ADD COLUMN IF NOT EXISTS performance_model VARCHAR(50)',
      'ALTER TABLE system_prompts ADD COLUMN IF NOT EXISTS temperature REAL DEFAULT 0.7',
      'ALTER TABLE system_prompts ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 2000',
      'ALTER TABLE system_prompts ADD COLUMN IF NOT EXISTS order_in_phase INTEGER DEFAULT 0',
    ]

    for (const col of columns) {
      await db.execute(sql.raw(col))
    }
    console.log('   ✓ Columnas añadidas\n')

    // 2. Create indexes
    console.log('2️⃣ Creando índices...')
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_system_prompts_phase ON system_prompts(phase)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_system_prompts_category_phase ON system_prompts(category, phase)`)
    console.log('   ✓ Índices creados\n')

    // 3. Create system_prompt_versions table
    console.log('3️⃣ Creando tabla system_prompt_versions...')
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS system_prompt_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        prompt_id UUID NOT NULL,
        version INTEGER NOT NULL,
        prompt TEXT NOT NULL,
        system_prompt TEXT,
        recommended_model VARCHAR(50),
        economic_model VARCHAR(50),
        balanced_model VARCHAR(50),
        performance_model VARCHAR(50),
        temperature REAL,
        max_tokens INTEGER,
        changed_by UUID,
        change_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(prompt_id, version)
      )
    `)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_system_prompt_versions_prompt_id ON system_prompt_versions(prompt_id)`)
    console.log('   ✓ Tabla system_prompt_versions creada\n')

    // 4. Create performance_profiles table
    console.log('4️⃣ Creando tabla performance_profiles...')
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS performance_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        cost_multiplier REAL DEFAULT 1.0,
        model_rules JSONB,
        badge_color VARCHAR(20),
        icon VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_performance_profiles_slug ON performance_profiles(slug)`)
    console.log('   ✓ Tabla performance_profiles creada\n')

    // 5. Seed performance profiles
    console.log('5️⃣ Insertando perfiles de rendimiento...')
    await db.execute(sql`
      INSERT INTO performance_profiles (slug, name, description, cost_multiplier, badge_color, icon, is_active, is_default, model_rules) VALUES
      (
        'economic',
        'Económico',
        'Modelos más baratos en todas las operaciones. Ideal para pruebas o presupuestos limitados.',
        0.3,
        'green',
        'TrendingDown',
        true,
        false,
        '{"generation": "gpt-3.5-turbo", "validation": "gpt-4o-mini", "suggestion": "gemini-2.0-flash", "analysis": "gpt-3.5-turbo", "execution": "gemini-2.0-flash", "synthesis": "gpt-4o-mini", "intervention": "gpt-4o-mini", "framework": "gemini-2.0-flash"}'::jsonb
      ),
      (
        'balanced',
        'Equilibrado',
        '80% operaciones con modelos económicos, 20% operaciones críticas con modelos premium. Mejor balance calidad/precio.',
        1.0,
        'blue',
        'Scale',
        true,
        true,
        '{"generation": "gpt-4-turbo", "validation": "gpt-4o-mini", "suggestion": "gemini-2.0-flash", "analysis": "gpt-4o-mini", "execution": "claude-3-5-sonnet-20241022", "synthesis": "gpt-4-turbo", "intervention": "gpt-4o-mini", "framework": "gpt-4-turbo"}'::jsonb
      ),
      (
        'performance',
        'Alto Rendimiento',
        'Modelos premium en todas las operaciones. Máxima calidad y precisión.',
        3.0,
        'purple',
        'Zap',
        true,
        false,
        '{"generation": "gpt-4", "validation": "gpt-4-turbo", "suggestion": "gpt-4-turbo", "analysis": "gpt-4-turbo", "execution": "claude-opus-4-20250514", "synthesis": "claude-opus-4-20250514", "intervention": "gpt-4-turbo", "framework": "claude-opus-4-20250514"}'::jsonb
      )
      ON CONFLICT (slug) DO NOTHING
    `)
    console.log('   ✓ Perfiles insertados\n')

    // 6. Add performance_level to profiles
    console.log('6️⃣ Añadiendo columna performance_level a profiles...')
    await db.execute(sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS performance_level VARCHAR(50) DEFAULT 'balanced'`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_profiles_performance_level ON profiles(performance_level)`)
    console.log('   ✓ Columna añadida\n')

    console.log('✅ ¡Migración completada exitosamente!')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error fatal:', error)
    process.exit(1)
  })
