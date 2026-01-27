/**
 * Script para sincronizar TODOS los perfiles de Supabase a PostgreSQL local
 * Ejecutar: pnpm tsx scripts/sync-profiles-from-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'
import { db } from '@quoorum/db'
import { profiles } from '@quoorum/db/schema'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function syncProfiles() {
  console.log('[INFO] Sincronizando perfiles de Supabase a PostgreSQL local...')

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Obtener todos los perfiles de Supabase
  const { data: supabaseProfiles, error } = await supabase
    .from('profiles')
    .select('*')

  if (error) {
    console.error('[ERROR] Error obteniendo perfiles de Supabase:', error)
    process.exit(1)
  }

  if (!supabaseProfiles || supabaseProfiles.length === 0) {
    console.log('[WARN] No hay perfiles en Supabase')
    process.exit(0)
  }

  console.log(`[INFO] Encontrados ${supabaseProfiles.length} perfiles en Supabase`)

  // Insertar cada perfil en PostgreSQL local
  let syncedCount = 0
  let skippedCount = 0

  for (const profile of supabaseProfiles) {
    try {
      await db.insert(profiles).values({
        id: profile.id,
        userId: profile.user_id,
        email: profile.email,
        name: profile.name || profile.email?.split('@')[0] || 'Usuario',
        fullName: profile.full_name || null,
        avatarUrl: profile.avatar_url || null,
        role: profile.role || 'user',
        isActive: profile.is_active ?? true,
        createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
        updatedAt: profile.updated_at ? new Date(profile.updated_at) : new Date(),
      }).onConflictDoNothing()

      syncedCount++
      console.log(`[OK] Sincronizado: ${profile.email} (${profile.id})`)
    } catch (err) {
      skippedCount++
      console.log(`[INFO] Ya existe: ${profile.email}`)
    }
  }

  console.log('\n[INFO] Resumen:')
  console.log(`   [OK] Sincronizados: ${syncedCount}`)
  console.log(`   [INFO] Ya existían: ${skippedCount}`)
  console.log(`   [INFO] Total: ${supabaseProfiles.length}`)
  console.log('\n[OK] Sincronización completa!')

  process.exit(0)
}

syncProfiles().catch((error) => {
  console.error('[ERROR] Error fatal:', error)
  process.exit(1)
})
