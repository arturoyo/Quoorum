/**
 * Script de migración: Supabase Cloud → PostgreSQL Local
 */

import { createClient } from '@supabase/supabase-js'
import pkg from 'pg'
const { Client } = pkg

// Credenciales
const SUPABASE_URL = 'https://ipcbpkbvrftchbmpemlg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwY2Jwa2J2cmZ0Y2hibXBlbWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4ODI2MTQsImV4cCI6MjA1MDQ1ODYxNH0.GTKJP9xo_Ar-uLy3SQdOaIDv1sV3TXDzK3JF3cIyLBk'
const LOCAL_DB_URL = 'postgresql://postgres:postgres@localhost:5433/quoorum'

async function migrateDebates() {
  console.log('[INFO] Iniciando migración de debates...')

  // Conectar a Supabase cloud
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Conectar a PostgreSQL local
  const pgClient = new Client({ connectionString: LOCAL_DB_URL })
  await pgClient.connect()

  try {
    // Obtener todos los debates de Supabase
    const { data: debates, error } = await supabase
      .from('quoorum_debates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[ERROR] Error obteniendo debates de Supabase:', error)
      return
    }

    if (!debates || debates.length === 0) {
      console.log('[INFO] No hay debates en Supabase cloud')
      return
    }

    console.log(`[INFO] Encontrados ${debates.length} debates en Supabase cloud`)

    // Insertar cada debate en PostgreSQL local
    let migrated = 0
    let errors = 0

    for (const debate of debates) {
      try {
        await pgClient.query(
          `INSERT INTO quoorum_debates (
            id, user_id, question, mode, status, visibility, context,
            consensus_score, total_rounds, total_cost_usd, final_ranking,
            rounds, experts, quality_metrics, interventions,
            share_token, shared_with, view_count, like_count, comment_count,
            metadata, started_at, completed_at, created_at, updated_at, deleted_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
          )
          ON CONFLICT (id) DO NOTHING`,
          [
            debate.id,
            debate.user_id,
            debate.question,
            debate.mode,
            debate.status,
            debate.visibility,
            JSON.stringify(debate.context),
            debate.consensus_score,
            debate.total_rounds,
            debate.total_cost_usd,
            JSON.stringify(debate.final_ranking),
            JSON.stringify(debate.rounds),
            JSON.stringify(debate.experts),
            JSON.stringify(debate.quality_metrics),
            JSON.stringify(debate.interventions),
            debate.share_token,
            JSON.stringify(debate.shared_with),
            debate.view_count || 0,
            debate.like_count || 0,
            debate.comment_count || 0,
            JSON.stringify(debate.metadata),
            debate.started_at,
            debate.completed_at,
            debate.created_at,
            debate.updated_at,
            debate.deleted_at
          ]
        )
        migrated++
        const title = debate.metadata?.title || debate.question.substring(0, 50)
        console.log(`[OK] Migrado: ${title}`)
      } catch (err) {
        errors++
        console.error(`[ERROR] Error migrando debate ${debate.id}:`, err.message)
      }
    }

    console.log(`\n[OK] Migración completada:`)
    console.log(`   [OK] Migrados: ${migrated}`)
    console.log(`   [ERROR] Errores: ${errors}`)
  } finally {
    await pgClient.end()
  }
}

// Ejecutar migración
migrateDebates()
  .then(() => {
    console.log('[OK] Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('[ERROR] Error fatal:', error)
    process.exit(1)
  })
