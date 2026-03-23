/**
 * Script para crear usuarios de prueba en Supabase Auth
 * 
 * Ejecutar con: pnpm tsx scripts/create-test-users-auth.ts
 * 
 * Requiere: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[ERROR] Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar en .env')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const TEST_USERS = [
  {
    email: 'tier1@quoorum.pro',
    password: 'Tier1Test2026!',
    name: 'Tier 1 User',
  },
  {
    email: 'tier2@quoorum.pro',
    password: 'Tier2Test2026!',
    name: 'Tier 2 User',
  },
  {
    email: 'tier3@quoorum.pro',
    password: 'Tier3Test2026!',
    name: 'Tier 3 User',
  },
  {
    email: 'info@imprent.es',
    password: 'InfoImprent2026!', // Solo si no existe ya
    name: 'Arturo Royo',
  },
]

async function createUsers() {
  console.log('[INFO] Creando usuarios en Supabase Auth...\n')

  for (const user of TEST_USERS) {
    try {
      // Verificar si el usuario ya existe
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers.users.find((u) => u.email === user.email)

      if (existingUser) {
        console.log(`[WARN] Usuario ${user.email} ya existe en Supabase Auth`)
        console.log(`   ID: ${existingUser.id}`)
        console.log(`   Email confirmado: ${existingUser.email_confirmed_at ? 'Sí' : 'No'}\n`)
        continue
      }

      // Crear usuario con contraseña
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Confirmar email automáticamente
        user_metadata: {
          full_name: user.name,
        },
      })

      if (error) {
        console.error(`[ERROR] Error creando ${user.email}:`, error.message)
        continue
      }

      console.log(`[OK] Usuario creado: ${user.email}`)
      console.log(`   ID: ${data.user.id}`)
      console.log(`   Contraseña: ${user.password}\n`)
    } catch (error) {
      console.error(`[ERROR] Error inesperado con ${user.email}:`, error)
    }
  }

  console.log('[OK] Proceso completado')
}

createUsers().catch(console.error)
