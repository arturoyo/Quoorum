/**
 * Script para verificar el estado de admin de un usuario
 * 
 * Uso: pnpm tsx scripts/check-admin-status.ts <email>
 */

import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq, and } from 'drizzle-orm'
import { profiles, adminUsers, adminRoles, users } from '@quoorum/db/schema'
import * as pg from 'pg'

config()

const { Client } = pg

async function checkAdminStatus(email: string) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/quoorum',
  })

  try {
    await client.connect()
    const db = drizzle(client)

    console.log(`\n[INFO] Verificando estado de admin para: ${email}\n`)

    // 1. Buscar usuario en users (Supabase Auth)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user) {
      console.log('[ERROR] Usuario no encontrado en tabla users')
      return
    }

    console.log('[OK] Usuario encontrado en users:')
    console.log(`   - ID: ${user.id}`)
    console.log(`   - Email: ${user.email}`)
    console.log(`   - Role (users.role): ${user.role}`)
    console.log(`   - isActive: ${user.isActive}`)

    // 2. Buscar perfil en profiles
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1)

    if (!profile) {
      console.log('\n[ERROR] Perfil no encontrado en tabla profiles')
      console.log('   [WARN] Esto puede causar problemas con adminUsers (userId referencia profiles.id)')
      return
    }

    console.log('\n[OK] Perfil encontrado en profiles:')
    console.log(`   - ID: ${profile.id}`)
    console.log(`   - Email: ${profile.email}`)
    console.log(`   - User ID: ${profile.userId}`)

    // 3. Verificar adminUsers
    const [adminUser] = await db
      .select({
        adminUserId: adminUsers.id,
        userId: adminUsers.userId,
        profileId: adminUsers.profileId,
        roleId: adminUsers.roleId,
        role: adminUsers.role,
        isActive: adminUsers.isActive,
        roleSlug: adminRoles.slug,
        roleName: adminRoles.name,
      })
      .from(adminUsers)
      .innerJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
      .where(and(eq(adminUsers.userId, profile.id), eq(adminUsers.isActive, true)))
      .limit(1)

    if (!adminUser) {
      console.log('\n[ERROR] No se encontró registro en adminUsers')
      console.log('   [WARN] El usuario NO es admin según adminUsers')
      console.log(`   [INFO] Para hacer admin: INSERT INTO admin_users (user_id, profile_id, role_id, role, is_active)`)
      console.log(`      VALUES ('${profile.id}', '${profile.id}', (SELECT id FROM admin_roles WHERE slug = 'admin'), 'admin', true)`)
    } else {
      console.log('\n[OK] Usuario encontrado en adminUsers:')
      console.log(`   - Admin User ID: ${adminUser.adminUserId}`)
      console.log(`   - User ID (profiles.id): ${adminUser.userId}`)
      console.log(`   - Role ID: ${adminUser.roleId}`)
      console.log(`   - Role: ${adminUser.role}`)
      console.log(`   - Role Slug: ${adminUser.roleSlug}`)
      console.log(`   - Role Name: ${adminUser.roleName}`)
      console.log(`   - isActive: ${adminUser.isActive}`)
    }

    // 4. Resumen final
    const hasUserRole = user.role === 'admin' || user.role === 'super_admin'
    const hasAdminUser = !!adminUser
    const isAdmin = hasUserRole || hasAdminUser

    console.log('\n[INFO] RESUMEN:')
    console.log(`   - users.role === 'admin' o 'super_admin': ${hasUserRole ? '[OK]' : '[ERROR]'}`)
    console.log(`   - adminUsers existe y está activo: ${hasAdminUser ? '[OK]' : '[ERROR]'}`)
    console.log(`   - isAdmin final: ${isAdmin ? '[OK] SÍ ES ADMIN' : '[ERROR] NO ES ADMIN'}`)

    if (!isAdmin) {
      console.log('\n[INFO] Para convertir en admin:')
      console.log('   1. Verificar que existe un role en admin_roles con slug="admin"')
      console.log('   2. Insertar registro en admin_users:')
      console.log(`      INSERT INTO admin_users (user_id, profile_id, role_id, role, is_active)`)
      console.log(`      VALUES ('${profile.id}', '${profile.id}', (SELECT id FROM admin_roles WHERE slug = 'admin'), 'admin', true);`)
    }

  } catch (error) {
    console.error('[ERROR] Error:', error)
  } finally {
    await client.end()
  }
}

// Ejecutar
const email = process.argv[2]
if (!email) {
  console.error('[ERROR] Uso: pnpm tsx scripts/check-admin-status.ts <email>')
  process.exit(1)
}

checkAdminStatus(email).catch(console.error)
