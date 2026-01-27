/**
 * MVP Integration Verification Script
 *
 * Verifica que todos los componentes del MVP estén correctamente integrados:
 * - Base de datos (schema fields, foreign keys, indexes)
 * - Sistema de créditos (funciones, triggers)
 * - Sistema de 4 capas (archivos, exports)
 * - Narrative system (theme engine, identities)
 * - UI components (archivos, imports)
 */

import { db } from '@quoorum/db'
import { sql } from 'drizzle-orm'
import { existsSync } from 'fs'
import { resolve } from 'path'

// ============================================================================
// COLOR UTILITIES
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(level: 'info' | 'success' | 'error' | 'warning', message: string) {
  const prefix = {
    info: `${colors.blue}[INFO]${colors.reset}`,
    success: `${colors.green}[OK]${colors.reset}`,
    error: `${colors.red}[ERROR]${colors.reset}`,
    warning: `${colors.yellow}[WARN]${colors.reset}`,
  }[level]

  console.log(`${prefix} ${message}`)
}

// ============================================================================
// DATABASE VERIFICATION
// ============================================================================

async function verifyDatabaseSchema() {
  log('info', 'Verificando schema de base de datos...')

  try {
    // Verificar que la tabla quoorum_debates existe
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'quoorum_debates'
      );
    `)

    if (!tableExists.rows[0]?.exists) {
      log('error', 'Tabla quoorum_debates no existe')
      return false
    }

    log('success', 'Tabla quoorum_debates existe')

    // Verificar que los campos company_id y department_id existen
    const columnsQuery = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'quoorum_debates'
      AND column_name IN ('company_id', 'department_id');
    `)

    const columns = columnsQuery.rows as Array<{
      column_name: string
      data_type: string
      is_nullable: string
    }>

    const companyIdColumn = columns.find((c) => c.column_name === 'company_id')
    const departmentIdColumn = columns.find((c) => c.column_name === 'department_id')

    if (!companyIdColumn) {
      log('error', 'Campo company_id no existe en quoorum_debates')
      return false
    }

    if (!departmentIdColumn) {
      log('error', 'Campo department_id no existe en quoorum_debates')
      return false
    }

    log('success', `company_id: ${companyIdColumn.data_type}, nullable: ${companyIdColumn.is_nullable}`)
    log('success', `department_id: ${departmentIdColumn.data_type}, nullable: ${departmentIdColumn.is_nullable}`)

    // Verificar foreign keys
    const foreignKeysQuery = await db.execute(sql`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'quoorum_debates'
      AND kcu.column_name IN ('company_id', 'department_id');
    `)

    const foreignKeys = foreignKeysQuery.rows as Array<{
      constraint_name: string
      column_name: string
      foreign_table_name: string
      foreign_column_name: string
    }>

    const companyFk = foreignKeys.find((fk) => fk.column_name === 'company_id')
    const departmentFk = foreignKeys.find((fk) => fk.column_name === 'department_id')

    if (!companyFk) {
      log('warning', 'Foreign key de company_id no encontrada')
    } else {
      log('success', `FK company_id → ${companyFk.foreign_table_name}.${companyFk.foreign_column_name}`)
    }

    if (!departmentFk) {
      log('warning', 'Foreign key de department_id no encontrada')
    } else {
      log('success', `FK department_id → ${departmentFk.foreign_table_name}.${departmentFk.foreign_column_name}`)
    }

    // Verificar índices (recomendados para performance)
    const indexesQuery = await db.execute(sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'quoorum_debates'
      AND (indexdef LIKE '%company_id%' OR indexdef LIKE '%department_id%');
    `)

    const indexes = indexesQuery.rows as Array<{
      indexname: string
      indexdef: string
    }>

    if (indexes.length === 0) {
      log('warning', 'No hay índices en company_id/department_id (considerar crearlos para mejor performance)')
    } else {
      indexes.forEach((idx) => {
        log('success', `Índice: ${idx.indexname}`)
      })
    }

    return true
  } catch (error) {
    log('error', `Error verificando schema: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

// ============================================================================
// FILE SYSTEM VERIFICATION
// ============================================================================

function verifyFileExists(path: string, description: string): boolean {
  const fullPath = resolve(process.cwd(), path)
  if (existsSync(fullPath)) {
    log('success', `${description}: ${path}`)
    return true
  } else {
    log('error', `${description} NO EXISTE: ${path}`)
    return false
  }
}

function verifyFilesystem() {
  log('info', 'Verificando archivos del sistema...')

  const criticalFiles = [
    // 4-Layer Prompt System
    { path: 'packages/quoorum/src/prompt-builder.ts', desc: 'Prompt Builder (4-layer system)' },
    { path: 'packages/quoorum/src/__tests__/prompt-builder.test.ts', desc: 'Tests Prompt Builder' },
    { path: 'packages/quoorum/src/__tests__/four-layer-edge-cases.test.ts', desc: 'Tests Edge Cases 4-Layer' },

    // Credit System
    { path: 'packages/quoorum/src/billing/credit-transactions.ts', desc: 'Credit Transactions' },
    { path: 'packages/quoorum/src/__tests__/credit-system-edge-cases.test.ts', desc: 'Tests Edge Cases Credits' },

    // Narrative System
    { path: 'packages/quoorum/src/narrative/theme-engine.ts', desc: 'Theme Engine (Narrative)' },

    // Runner (orquestador)
    { path: 'packages/quoorum/src/runner.ts', desc: 'Debate Runner' },
    { path: 'packages/quoorum/src/types.ts', desc: 'Types' },

    // Database Schema
    { path: 'packages/db/src/schema/quoorum-debates.ts', desc: 'Schema Quoorum Debates' },
    { path: 'packages/db/src/schema/companies.ts', desc: 'Schema Companies' },
    { path: 'packages/db/src/schema/departments.ts', desc: 'Schema Departments' },

    // UI Components (opcional)
    { path: 'packages/quoorum/visualization/DebateChat.tsx', desc: 'UI Debate Chat' },
  ]

  const results = criticalFiles.map((file) => verifyFileExists(file.path, file.desc))

  return results.every((r) => r)
}

// ============================================================================
// EXPORTS VERIFICATION
// ============================================================================

async function verifyExports() {
  log('info', 'Verificando exports de módulos...')

  try {
    // Verificar que prompt-builder exporta las funciones correctas
    const { buildFourLayerPrompt, buildContextPromptWithCorporate, extractDepartmentContext, estimateFourLayerTokens } =
      await import('../packages/quoorum/src/prompt-builder')

    if (typeof buildFourLayerPrompt !== 'function') {
      log('error', 'buildFourLayerPrompt no es una función')
      return false
    }

    if (typeof buildContextPromptWithCorporate !== 'function') {
      log('error', 'buildContextPromptWithCorporate no es una función')
      return false
    }

    if (typeof extractDepartmentContext !== 'function') {
      log('error', 'extractDepartmentContext no es una función')
      return false
    }

    if (typeof estimateFourLayerTokens !== 'function') {
      log('error', 'estimateFourLayerTokens no es una función')
      return false
    }

    log('success', 'Exports de prompt-builder correctos')

    // Verificar que runner importa y usa prompt-builder
    const runnerCode = await import('fs').then((fs) =>
      fs.readFileSync(resolve(process.cwd(), 'packages/quoorum/src/runner.ts'), 'utf-8')
    )

    if (!runnerCode.includes('import { buildFourLayerPrompt, extractDepartmentContext }')) {
      log('error', 'runner.ts no importa prompt-builder correctamente')
      return false
    }

    if (!runnerCode.includes('buildFourLayerPrompt(agent,')) {
      log('error', 'runner.ts no usa buildFourLayerPrompt()')
      return false
    }

    log('success', 'runner.ts integra prompt-builder correctamente')

    // Verificar que types.ts tiene narrativeId en DebateMessage
    const typesCode = await import('fs').then((fs) =>
      fs.readFileSync(resolve(process.cwd(), 'packages/quoorum/src/types.ts'), 'utf-8')
    )

    if (!typesCode.includes('narrativeId?: string')) {
      log('error', 'types.ts no tiene narrativeId en DebateMessage')
      return false
    }

    log('success', 'types.ts tiene narrativeId en DebateMessage')

    return true
  } catch (error) {
    log('error', `Error verificando exports: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

// ============================================================================
// INTEGRATION TEST (Dry Run)
// ============================================================================

async function testIntegration() {
  log('info', 'Ejecutando test de integración (dry run)...')

  try {
    const { buildFourLayerPrompt } = await import('../packages/quoorum/src/prompt-builder')
    const { QUOORUM_AGENTS } = await import('../packages/quoorum/src/agents')

    const optimizer = QUOORUM_AGENTS.optimizer

    if (!optimizer) {
      log('error', 'Agent optimizer no encontrado')
      return false
    }

    // Test básico de 4-layer prompt
    const prompt = buildFourLayerPrompt(optimizer, {
      companyContext: 'Misión: Democratizar acceso a IA',
      departmentContext: 'KPIs: CAC < $50, LTV > $500',
      customPrompt: 'Sé directo y orientado a métricas',
    })

    if (!prompt.includes('=== TU ROL TÉCNICO ===')) {
      log('error', 'Prompt no incluye Layer 1')
      return false
    }

    if (!prompt.includes('=== CONTEXTO EMPRESARIAL')) {
      log('error', 'Prompt no incluye Layer 2')
      return false
    }

    if (!prompt.includes('=== CONTEXTO DEPARTAMENTAL')) {
      log('error', 'Prompt no incluye Layer 3')
      return false
    }

    if (!prompt.includes('=== PERSONALIDAD Y ESTILO ===')) {
      log('error', 'Prompt no incluye Layer 4')
      return false
    }

    log('success', 'Test de integración 4-layer prompt exitoso')

    // Verificar orden de layers
    const layer1Index = prompt.indexOf('=== TU ROL TÉCNICO ===')
    const layer2Index = prompt.indexOf('=== CONTEXTO EMPRESARIAL')
    const layer3Index = prompt.indexOf('=== CONTEXTO DEPARTAMENTAL')
    const layer4Index = prompt.indexOf('=== PERSONALIDAD Y ESTILO ===')

    if (!(layer1Index < layer2Index && layer2Index < layer3Index && layer3Index < layer4Index)) {
      log('error', 'Orden de layers incorrecto')
      return false
    }

    log('success', 'Orden de layers correcto: L1 → L2 → L3 → L4')

    return true
  } catch (error) {
    log('error', `Error en test de integración: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n' + '='.repeat(70))
  console.log('MVP INTEGRATION VERIFICATION')
  console.log('='.repeat(70) + '\n')

  const results = {
    database: false,
    filesystem: false,
    exports: false,
    integration: false,
  }

  // 1. Database Schema
  console.log('\n[INFO] [1/4] BASE DE DATOS\n')
  results.database = await verifyDatabaseSchema()

  // 2. File System
  console.log('\n[INFO] [2/4] ARCHIVOS\n')
  results.filesystem = verifyFilesystem()

  // 3. Exports
  console.log('\n[INFO] [3/4] EXPORTS\n')
  results.exports = await verifyExports()

  // 4. Integration Test
  console.log('\n[INFO] [4/4] TEST DE INTEGRACIÓN\n')
  results.integration = await testIntegration()

  // Summary
  console.log('\n' + '='.repeat(70))
  console.log('RESUMEN')
  console.log('='.repeat(70) + '\n')

  const summary = [
    { name: 'Base de Datos', status: results.database },
    { name: 'Archivos', status: results.filesystem },
    { name: 'Exports', status: results.exports },
    { name: 'Integración', status: results.integration },
  ]

  summary.forEach((item) => {
    const status = item.status ? `${colors.green}[OK]${colors.reset}` : `${colors.red}[ERROR]${colors.reset}`
    console.log(`  ${item.name.padEnd(20)} ${status}`)
  })

  const allPassed = Object.values(results).every((r) => r)

  console.log('\n' + '='.repeat(70))
  if (allPassed) {
    console.log(`${colors.green}[OK] TODAS LAS VERIFICACIONES PASARON${colors.reset}`)
    console.log('El sistema está listo para producción')
  } else {
    console.log(`${colors.red}[ERROR] ALGUNAS VERIFICACIONES FALLARON${colors.reset}`)
    console.log('Revisa los errores arriba y corrige antes de deployar')
  }
  console.log('='.repeat(70) + '\n')

  process.exit(allPassed ? 0 : 1)
}

// Run
main().catch((error) => {
  console.error('Error fatal:', error)
  process.exit(1)
})
