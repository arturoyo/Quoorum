/**
 * Script de migración: Supabase Cloud → PostgreSQL Local
 *
 * Migra todos los debates de Supabase cloud a PostgreSQL local
 */

import { createClient } from '@supabase/supabase-js'
import { db } from '@quoorum/db'
import { quoorumDebates } from '@quoorum/db/schema'

// Credenciales de Supabase cloud (desde .env.local)
const SUPABASE_URL = 'https://ipcbpkbvrftchbmpemlg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwY2Jwa2J2cmZ0Y2hibXBlbWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4ODI2MTQsImV4cCI6MjA1MDQ1ODYxNH0.GTKJP9xo_Ar-uLy3SQdOaIDv1sV3TXDzK3JF3cIyLBk'

async function migrateDebates() {
  console.log('[INFO] Iniciando migración de debates...')

  // Conectar a Supabase cloud
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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
      await db.insert(quoorumDebates).values({
        id: debate.id,
        userId: debate.user_id,
        question: debate.question,
        mode: debate.mode,
        status: debate.status,
        visibility: debate.visibility,
        context: debate.context,
        consensusScore: debate.consensus_score,
        totalRounds: debate.total_rounds,
        totalCostUsd: debate.total_cost_usd,
        finalRanking: debate.final_ranking,
        rounds: debate.rounds,
        experts: debate.experts,
        qualityMetrics: debate.quality_metrics,
        interventions: debate.interventions,
        shareToken: debate.share_token,
        sharedWith: debate.shared_with,
        viewCount: debate.view_count || 0,
        likeCount: debate.like_count || 0,
        commentCount: debate.comment_count || 0,
        metadata: debate.metadata,
        startedAt: debate.started_at ? new Date(debate.started_at) : null,
        completedAt: debate.completed_at ? new Date(debate.completed_at) : null,
        createdAt: new Date(debate.created_at),
        updatedAt: new Date(debate.updated_at),
        deletedAt: debate.deleted_at ? new Date(debate.deleted_at) : null,
      })
      migrated++
      console.log(`[OK] Migrado: ${debate.metadata?.title || debate.question.substring(0, 50)}`)
    } catch (err) {
      errors++
      console.error(`[ERROR] Error migrando debate ${debate.id}:`, err)
    }
  }

  console.log(`\n[OK] Migración completada:`)
  console.log(`   [OK] Migrados: ${migrated}`)
  console.log(`   [ERROR] Errores: ${errors}`)
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
