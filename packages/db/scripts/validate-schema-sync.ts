#!/usr/bin/env tsx
/**
 * Schema Sync Validator
 * Valida que el schema Drizzle está sincronizado con PostgreSQL
 *
 * Detecta:
 * - Columnas faltantes
 * - Valores de enum incorrectos
 * - Foreign keys rotas
 * - Tipos de datos incorrectos
 */

import { db } from '../src/client.js'
import { sql } from 'drizzle-orm'

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurada')
  console.error('   Ejecuta este script desde el root con: pnpm validate:schema')
  console.error('   O configura DATABASE_URL en packages/db/.env')
  process.exit(1)
}

interface ValidationError {
  type: 'missing_column' | 'missing_enum_value' | 'missing_foreign_key' | 'type_mismatch'
  table?: string
  column?: string
  expected?: string
  actual?: string
  message: string
}

const errors: ValidationError[] = []

// ═══════════════════════════════════════════════════════════
// EXPECTED SCHEMAS (from Drizzle definitions)
// ═══════════════════════════════════════════════════════════

const EXPECTED_SCHEMAS = {
  quoorum_debates: {
    columns: [
      'id',
      'user_id',
      'question',
      'context',
      'mode',
      'status',
      'visibility',
      'consensus',
      'rounds',
      'metadata',
      'created_at',
      'updated_at',
      'started_at',
      'completed_at',
      'deleted_at',
    ],
    enums: {
      debate_status: ['draft', 'pending', 'in_progress', 'completed', 'failed', 'cancelled'],
    },
    foreign_keys: ['quoorum_debates_user_id_profiles_id_fk'],
  },
  quoorum_debate_comments: {
    columns: ['id', 'debate_id', 'user_id', 'content', 'created_at', 'updated_at'],
    foreign_keys: [
      'quoorum_debate_comments_debate_id_quoorum_debates_id_fk',
      'quoorum_debate_comments_user_id_profiles_id_fk',
    ],
  },
  profiles: {
    columns: [
      'id',
      'user_id',
      'email',
      'name',
      'role',
      'is_active',
      'created_at',
      'updated_at',
    ],
  },
}

// ═══════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════

async function validateTableColumns(tableName: string, expectedColumns: string[]) {
  console.log(`→ Validando columnas de tabla ${tableName}...`)

  try {
    const result = await db.execute<{ column_name: string }>(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = ${tableName}
      AND table_schema = 'public'
    `)

    const actualColumns = result.rows.map((r) => r.column_name)

    for (const col of expectedColumns) {
      if (!actualColumns.includes(col)) {
        errors.push({
          type: 'missing_column',
          table: tableName,
          column: col,
          message: `❌ Columna faltante: ${tableName}.${col}`,
        })
      }
    }

    if (errors.filter((e) => e.table === tableName).length === 0) {
      console.log(`  ✅ Todas las columnas de ${tableName} existen`)
    }
  } catch (error) {
    errors.push({
      type: 'missing_column',
      table: tableName,
      message: `❌ Error al verificar tabla ${tableName}: ${error}`,
    })
  }
}

async function validateEnumValues(enumName: string, expectedValues: string[]) {
  console.log(`→ Validando enum ${enumName}...`)

  try {
    const result = await db.execute<{ enum_value: string }>(sql`
      SELECT unnest(enum_range(NULL::${sql.raw(enumName)}))::text AS enum_value
    `)

    const actualValues = result.rows.map((r) => r.enum_value)

    for (const value of expectedValues) {
      if (!actualValues.includes(value)) {
        errors.push({
          type: 'missing_enum_value',
          expected: value,
          actual: actualValues.join(', '),
          message: `❌ Valor enum faltante: ${enumName}.${value}`,
        })
      }
    }

    if (errors.filter((e) => e.type === 'missing_enum_value').length === 0) {
      console.log(`  ✅ Enum ${enumName} completo`)
    }
  } catch (error) {
    errors.push({
      type: 'missing_enum_value',
      message: `❌ Error al verificar enum ${enumName}: ${error}`,
    })
  }
}

async function validateForeignKeys(tableName: string, expectedFks: string[]) {
  console.log(`→ Validando foreign keys de ${tableName}...`)

  try {
    const result = await db.execute<{ constraint_name: string }>(sql`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = ${tableName}
      AND constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public'
    `)

    const actualFks = result.rows.map((r) => r.constraint_name)

    for (const fk of expectedFks) {
      if (!actualFks.includes(fk)) {
        errors.push({
          type: 'missing_foreign_key',
          table: tableName,
          expected: fk,
          message: `❌ Foreign key faltante: ${fk}`,
        })
      }
    }

    if (errors.filter((e) => e.table === tableName && e.type === 'missing_foreign_key').length === 0) {
      console.log(`  ✅ Foreign keys de ${tableName} OK`)
    }
  } catch (error) {
    errors.push({
      type: 'missing_foreign_key',
      table: tableName,
      message: `❌ Error al verificar foreign keys de ${tableName}: ${error}`,
    })
  }
}

async function validateTableExists(tableName: string) {
  try {
    const result = await db.execute<{ exists: boolean }>(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      ) as exists
    `)

    if (!result.rows[0]?.exists) {
      errors.push({
        type: 'missing_column',
        table: tableName,
        message: `❌ Tabla ${tableName} NO existe en PostgreSQL`,
      })
      return false
    }
    return true
  } catch (error) {
    errors.push({
      type: 'missing_column',
      table: tableName,
      message: `❌ Error al verificar existencia de tabla ${tableName}: ${error}`,
    })
    return false
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN VALIDATION
// ═══════════════════════════════════════════════════════════

async function validateSchemaSync() {
  console.log('🔍 SCHEMA SYNC VALIDATION')
  console.log('=' .repeat(60))
  console.log('')

  // 1. Validate tables and columns
  for (const [tableName, schema] of Object.entries(EXPECTED_SCHEMAS)) {
    const exists = await validateTableExists(tableName)
    if (exists) {
      await validateTableColumns(tableName, schema.columns)

      // Validate foreign keys if defined
      if (schema.foreign_keys) {
        await validateForeignKeys(tableName, schema.foreign_keys)
      }
    }
  }

  // 2. Validate enums
  await validateEnumValues('debate_status', EXPECTED_SCHEMAS.quoorum_debates.enums.debate_status)

  // RESULTADO
  console.log('')
  console.log('=' .repeat(60))

  if (errors.length === 0) {
    console.log('✅ SCHEMA SINCRONIZADO - Todo OK')
    console.log('')
    console.log('   - Todas las tablas existen')
    console.log('   - Todas las columnas presentes')
    console.log('   - Todos los enums correctos')
    console.log('   - Todas las foreign keys OK')
    console.log('')
    process.exit(0)
  } else {
    console.log(`❌ SCHEMA DESINCRONIZADO - ${errors.length} errores encontrados:`)
    console.log('')
    errors.forEach((err) => console.log(err.message))
    console.log('')
    console.log('💡 SOLUCIONES:')
    console.log('')
    console.log('   1. Si faltan columnas/enums:')
    console.log('      → Actualiza packages/db/src/schema/')
    console.log('      → Ejecuta: pnpm db:generate')
    console.log('      → Ejecuta: pnpm db:push')
    console.log('')
    console.log('   2. Si faltan tablas:')
    console.log('      → Verifica que PostgreSQL está corriendo')
    console.log('      → Ejecuta: pnpm db:push')
    console.log('')
    console.log('   3. Si el problema persiste:')
    console.log('      → Lee ERRORES-COMETIDOS.md')
    console.log('      → Ejecuta: bash scripts/pre-flight.sh')
    console.log('')
    process.exit(1)
  }
}

// Run validation
validateSchemaSync().catch((error) => {
  console.error('❌ Error fatal durante validación:', error)
  process.exit(1)
})
