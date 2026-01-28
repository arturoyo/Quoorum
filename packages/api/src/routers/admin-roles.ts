/**
 * Admin Roles Router
 * 
 * CRUD completo de roles y permisos administrativos
 * Solo accesible para usuarios con rol super_admin
 */

import { z } from 'zod'
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import { router, adminProcedure } from '../trpc'
import { db } from '@quoorum/db'
import { adminRoles, adminUsers, profiles } from '@quoorum/db/schema'
import { TRPCError } from '@trpc/server'

// ============================================================================
// SCHEMAS
// ============================================================================

const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug debe contener solo letras minúsculas, números y guiones'),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
})

const updateRoleSchema = z.object({
  roleId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
})

const listRolesSchema = z.object({
  includeInactive: z.boolean().default(false),
})

// ============================================================================
// ROUTER
// ============================================================================

export const adminRolesRouter = router({
  /**
   * List all admin roles
   */
  list: adminProcedure
    .input(listRolesSchema)
    .query(async ({ input }) => {
      const conditions = []

      if (!input.includeInactive) {
        conditions.push(eq(adminRoles.isActive, true))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const roles = await db
        .select()
        .from(adminRoles)
        .where(whereClause)
        .orderBy(asc(adminRoles.name))

      // Get user count for each role
      const rolesWithCounts = await Promise.all(
        roles.map(async (role) => {
          const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(adminUsers)
            .where(and(eq(adminUsers.roleId, role.id), eq(adminUsers.isActive, true)))

          return {
            ...role,
            userCount: Number(countResult?.count || 0),
          }
        })
      )

      return rolesWithCounts
    }),

  /**
   * Get role by ID
   */
  getById: adminProcedure
    .input(z.object({ roleId: z.string().uuid() }))
    .query(async ({ input }) => {
      const [role] = await db
        .select()
        .from(adminRoles)
        .where(eq(adminRoles.id, input.roleId))
        .limit(1)

      if (!role) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Rol no encontrado',
        })
      }

      // Get users with this role
      const users = await db
        .select({
          id: adminUsers.id,
          userId: adminUsers.userId,
          profileId: adminUsers.profileId,
          isActive: adminUsers.isActive,
          createdAt: adminUsers.createdAt,
          profile: {
            name: profiles.name,
            email: profiles.email,
            avatarUrl: profiles.avatarUrl,
          },
        })
        .from(adminUsers)
        .innerJoin(profiles, eq(adminUsers.userId, profiles.id))
        .where(and(eq(adminUsers.roleId, input.roleId), eq(adminUsers.isActive, true)))
        .orderBy(desc(adminUsers.createdAt))

      return {
        ...role,
        users,
      }
    }),

  /**
   * Create new role
   */
  create: adminProcedure
    .input(createRoleSchema)
    .mutation(async ({ input }) => {
      // Check if slug already exists
      const [existing] = await db
        .select()
        .from(adminRoles)
        .where(eq(adminRoles.slug, input.slug))
        .limit(1)

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Ya existe un rol con este slug',
        })
      }

      const [newRole] = await db
        .insert(adminRoles)
        .values({
          name: input.name,
          slug: input.slug,
          description: input.description,
          permissions: input.permissions,
          isActive: input.isActive,
        })
        .returning()

      return newRole
    }),

  /**
   * Update role
   */
  update: adminProcedure
    .input(updateRoleSchema)
    .mutation(async ({ input }) => {
      const { roleId, ...data } = input

      const [updated] = await db
        .update(adminRoles)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(adminRoles.id, roleId))
        .returning()

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Rol no encontrado',
        })
      }

      return updated
    }),

  /**
   * Delete role (soft delete)
   */
  delete: adminProcedure
    .input(z.object({ roleId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      // Check if role has active users
      const [usersWithRole] = await db
        .select({ count: sql<number>`count(*)` })
        .from(adminUsers)
        .where(and(eq(adminUsers.roleId, input.roleId), eq(adminUsers.isActive, true)))

      if (Number(usersWithRole?.count || 0) > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'No se puede eliminar un rol que tiene usuarios asignados',
        })
      }

      const [updated] = await db
        .update(adminRoles)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(adminRoles.id, input.roleId))
        .returning()

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Rol no encontrado',
        })
      }

      return { success: true }
    }),

  /**
   * Assign role to user
   */
  assignRole: adminProcedure
    .input(assignRoleSchema)
    .mutation(async ({ input }) => {
      // Verify role exists
      const [role] = await db
        .select()
        .from(adminRoles)
        .where(eq(adminRoles.id, input.roleId))
        .limit(1)

      if (!role || !role.isActive) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Rol no encontrado o inactivo',
        })
      }

      // Get user profile
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, input.userId))
        .limit(1)

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        })
      }

      // Map slug to enum value
      const roleEnumMap: Record<string, 'super_admin' | 'admin' | 'moderator' | 'support'> = {
        'super_admin': 'super_admin',
        'admin': 'admin',
        'moderator': 'moderator',
        'support': 'support',
      }
      const roleEnum = roleEnumMap[role.slug] || 'support'

      // Create or update adminUsers entry
      const [adminUser] = await db
        .insert(adminUsers)
        .values({
          userId: profile.id,
          profileId: profile.id,
          roleId: role.id,
          role: roleEnum,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: adminUsers.userId,
          set: {
            roleId: role.id,
            role: roleEnum,
            isActive: true,
            updatedAt: new Date(),
          },
        })
        .returning()

      return adminUser
    }),

  /**
   * Remove role from user
   */
  removeRole: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(adminUsers)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(adminUsers.userId, input.userId))
        .returning()

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no tiene rol asignado',
        })
      }

      return { success: true }
    }),

  /**
   * Get available permissions
   */
  getAvailablePermissions: adminProcedure.query(() => {
    return {
      permissions: [
        // User management
        'users.view',
        'users.create',
        'users.update',
        'users.delete',
        'users.manage_credits',
        'users.manage_tier',
        // Role management
        'roles.view',
        'roles.create',
        'roles.update',
        'roles.delete',
        'roles.assign',
        // System management
        'system.view',
        'system.update',
        'system.logs',
        'system.audit',
        // Billing
        'billing.view',
        'billing.update',
        'billing.refund',
        // Analytics
        'analytics.view',
        'analytics.export',
        // Support
        'support.view',
        'support.respond',
        // All permissions
        '*',
      ],
    }
  }),
})
