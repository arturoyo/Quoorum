/**
 * Admin Router
 * 
 * CRUD completo de usuarios, gestión de roles, créditos, y cost tracking
 * Solo accesible para usuarios con rol admin o super_admin
 */

import { z } from 'zod'
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import { router, adminProcedure } from '../trpc'
import { db } from '@quoorum/db'
import { users, profiles, adminUsers, adminRoles, quoorumDebates, subscriptions } from '@quoorum/db'
import { TRPCError } from '@trpc/server'
import { addCredits, deductCredits } from '@quoorum/quoorum'

// ============================================================================
// SCHEMAS
// ============================================================================

const updateUserCreditsSchema = z.object({
  userId: z.string().uuid(),
  credits: z.number().int().min(0),
})

const addCreditsSchema = z.object({
  userId: z.string().uuid(),
  credits: z.number().int().min(1),
  reason: z.string().optional(),
})

const deductCreditsSchema = z.object({
  userId: z.string().uuid(),
  credits: z.number().int().min(1),
  reason: z.string().min(1, 'Reason is required for deducting credits'),
})

const updateUserTierSchema = z.object({
  userId: z.string().uuid(),
  tier: z.enum(['free', 'starter', 'pro', 'business']),
})

const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['member', 'admin', 'super_admin']),
})

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  credits: z.number().int().min(0).default(1000),
  tier: z.enum(['free', 'starter', 'pro', 'business']).default('free'),
  role: z.enum(['member', 'admin', 'super_admin']).default('member'),
})

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email().optional(),
  name: z.string().min(1).max(255).optional(),
  credits: z.number().int().min(0).optional(),
  tier: z.enum(['free', 'starter', 'pro', 'business']).optional(),
  role: z.enum(['member', 'admin', 'super_admin']).optional(),
  isActive: z.boolean().optional(),
})

const listUsersSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  search: z.string().optional(),
  tier: z.enum(['free', 'starter', 'pro', 'business']).optional(),
  role: z.enum(['member', 'admin', 'super_admin']).optional(),
  sortBy: z.enum(['created_at', 'email', 'credits', 'tier']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// ============================================================================
// ROUTER
// ============================================================================

export const adminRouter = router({
  // ============================================
  // USERS MANAGEMENT
  // ============================================

  /**
   * List all users with pagination and filters
   */
  listUsers: adminProcedure
    .input(listUsersSchema)
    .query(async ({ input }) => {
      const conditions = []

      if (input.search) {
        conditions.push(
          sql`(${users.email} ILIKE ${`%${input.search}%`} OR ${users.name} ILIKE ${`%${input.search}%`})`
        )
      }

      if (input.tier) {
        conditions.push(eq(users.tier, input.tier))
      }

      if (input.role) {
        conditions.push(eq(users.role, input.role))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const orderBy =
        input.sortBy === 'created_at'
          ? desc(users.createdAt)
          : input.sortBy === 'email'
          ? asc(users.email)
          : input.sortBy === 'credits'
          ? desc(users.credits)
          : desc(users.tier)

      const results = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          credits: users.credits,
          tier: users.tier,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(input.limit)
        .offset(input.offset)

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause)

      return {
        users: results,
        total: Number(total[0]?.count || 0),
        limit: input.limit,
        offset: input.offset,
      }
    }),

  /**
   * Get user by ID with full details
   */
  getUserById: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1)

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        })
      }

      // Get profile
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, input.userId))
        .limit(1)

      // Get admin role if exists
      const [adminUser] = await db
        .select({
          adminRole: adminUsers.role,
          adminRoleName: adminRoles.name,
        })
        .from(adminUsers)
        .leftJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
        .where(eq(adminUsers.userId, profile?.id || ''))
        .limit(1)

      // Get subscription if exists
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, input.userId))
        .limit(1)

      // Get usage stats
      const [usageStats] = await db
        .select({
          totalDebates: sql<number>`count(*)`,
          totalCost: sql<number>`coalesce(sum(${quoorumDebates.totalCostUsd}), 0)`,
          totalCredits: sql<number>`coalesce(sum(${quoorumDebates.totalCreditsUsed}), 0)`,
        })
        .from(quoorumDebates)
        .where(eq(quoorumDebates.userId, profile?.id || ''))

      return {
        ...user,
        profile,
        adminRole: adminUser?.adminRole,
        adminRoleName: adminUser?.adminRoleName,
        subscription,
        usage: {
          totalDebates: Number(usageStats?.totalDebates || 0),
          totalCostUsd: Number(usageStats?.totalCost || 0),
          totalCreditsUsed: Number(usageStats?.totalCredits || 0),
        },
      }
    }),

  /**
   * Create new user
   */
  createUser: adminProcedure
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      // Check if user already exists
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1)

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Ya existe un usuario con este email',
        })
      }

      const [newUser] = await db
        .insert(users)
        .values({
          email: input.email,
          name: input.name,
          credits: input.credits,
          tier: input.tier,
          role: input.role,
        })
        .returning()

      return newUser
    }),

  /**
   * Update user
   */
  updateUser: adminProcedure
    .input(updateUserSchema)
    .mutation(async ({ input }) => {
      const { userId, ...data } = input

      const [updated] = await db
        .update(users)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning()

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        })
      }

      return updated
    }),

  /**
   * Update user credits (set absolute value)
   */
  updateUserCredits: adminProcedure
    .input(updateUserCreditsSchema)
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(users)
        .set({
          credits: input.credits,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId))
        .returning()

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        })
      }

      return updated
    }),

  /**
   * Add credits to user (incremental)
   */
  addCredits: adminProcedure
    .input(addCreditsSchema)
    .mutation(async ({ input }) => {
      const result = await addCredits(
        input.userId,
        input.credits,
        undefined, // subscriptionId
        'admin_adjustment',
        input.reason || 'Admin credit adjustment'
      )

      if (!result.success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error || 'Failed to add credits',
        })
      }

      // Get updated user to return full data
      const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1)

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        })
      }

      return {
        creditsAdded: input.credits,
        newBalance: result.newBalance || updated.credits,
        user: updated,
      }
    }),

  /**
   * Deduct credits from user (incremental)
   */
  deductCredits: adminProcedure
    .input(deductCreditsSchema)
    .mutation(async ({ input }) => {
      const result = await deductCredits(
        input.userId,
        input.credits,
        undefined, // No debateId for admin adjustments
        'admin_adjustment',
        input.reason || 'Admin credit deduction'
      )

      if (!result.success) {
        throw new TRPCError({
          code: result.error === 'Insufficient credits' ? 'PRECONDITION_FAILED' : 'INTERNAL_SERVER_ERROR',
          message: result.error || 'Failed to deduct credits',
        })
      }

      // Get updated user to return full data
      const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1)

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        })
      }

      return {
        creditsDeducted: input.credits,
        newBalance: result.remainingCredits || updated.credits,
        user: updated,
      }
    }),

  /**
   * Update user tier
   */
  updateUserTier: adminProcedure
    .input(updateUserTierSchema)
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(users)
        .set({
          tier: input.tier,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId))
        .returning()

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        })
      }

      return updated
    }),

  /**
   * Update user role
   */
  updateUserRole: adminProcedure
    .input(updateUserRoleSchema)
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(users)
        .set({
          role: input.role,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId))
        .returning()

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        })
      }

      // If setting to admin, also create adminUsers entry
      if (input.role === 'admin' || input.role === 'super_admin') {
        const [profile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.userId, input.userId))
          .limit(1)

        if (profile) {
          // Get or create admin role
          let [adminRole] = await db
            .select()
            .from(adminRoles)
            .where(eq(adminRoles.slug, input.role === 'super_admin' ? 'super_admin' : 'admin'))
            .limit(1)

          if (!adminRole) {
            const [newRole] = await db
              .insert(adminRoles)
              .values({
                name: input.role === 'super_admin' ? 'Super Admin' : 'Admin',
                slug: input.role === 'super_admin' ? 'super_admin' : 'admin',
                description: input.role === 'super_admin' ? 'Acceso completo' : 'Acceso administrativo',
                permissions: ['*'],
                isActive: true,
              })
              .returning()
            
            if (!newRole) {
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error al crear rol de administrador',
              })
            }
            
            adminRole = newRole
          }

          // Create or update adminUsers
          await db
            .insert(adminUsers)
            .values({
              userId: profile.id,
              profileId: profile.id,
              roleId: adminRole.id,
              role: input.role === 'super_admin' ? 'super_admin' : 'admin',
              isActive: true,
            })
            .onConflictDoUpdate({
              target: adminUsers.userId,
              set: {
                roleId: adminRole.id,
                role: input.role === 'super_admin' ? 'super_admin' : 'admin',
                isActive: true,
                updatedAt: new Date(),
              },
            })
        }
      }

      return updated
    }),

  /**
   * Delete user (soft delete)
   */
  deleteUser: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(users)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId))
        .returning()

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        })
      }

      return { success: true }
    }),

  // ============================================
  // COST TRACKING & ANALYTICS
  // ============================================

  /**
   * Get cost analytics for all users
   */
  getCostAnalytics: adminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        userId: z.string().uuid().optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = []

      if (input.userId) {
        const [profile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.userId, input.userId))
          .limit(1)

        if (profile) {
          conditions.push(eq(quoorumDebates.userId, profile.id))
        }
      }

      if (input.startDate) {
        conditions.push(sql`${quoorumDebates.createdAt} >= ${input.startDate}`)
      }

      if (input.endDate) {
        conditions.push(sql`${quoorumDebates.createdAt} <= ${input.endDate}`)
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const [stats] = await db
        .select({
          totalDebates: sql<number>`count(*)`,
          totalCostUsd: sql<number>`coalesce(sum(${quoorumDebates.totalCostUsd}), 0)`,
          totalCreditsUsed: sql<number>`coalesce(sum(${quoorumDebates.totalCreditsUsed}), 0)`,
          avgCostPerDebate: sql<number>`coalesce(avg(${quoorumDebates.totalCostUsd}), 0)`,
          avgCreditsPerDebate: sql<number>`coalesce(avg(${quoorumDebates.totalCreditsUsed}), 0)`,
        })
        .from(quoorumDebates)
        .where(whereClause)

      // Get cost breakdown by user
      const costByUser = await db
        .select({
          userId: quoorumDebates.userId,
          email: users.email,
          name: users.name,
          totalDebates: sql<number>`count(*)`,
          totalCostUsd: sql<number>`coalesce(sum(${quoorumDebates.totalCostUsd}), 0)`,
          totalCreditsUsed: sql<number>`coalesce(sum(${quoorumDebates.totalCreditsUsed}), 0)`,
        })
        .from(quoorumDebates)
        .leftJoin(profiles, eq(quoorumDebates.userId, profiles.id))
        .leftJoin(users, eq(profiles.userId, users.id))
        .where(whereClause)
        .groupBy(quoorumDebates.userId, users.email, users.name)
        .orderBy(desc(sql`coalesce(sum(${quoorumDebates.totalCostUsd}), 0)`))
        .limit(50)

      return {
        overall: {
          totalDebates: Number(stats?.totalDebates || 0),
          totalCostUsd: Number(stats?.totalCostUsd || 0),
          totalCreditsUsed: Number(stats?.totalCreditsUsed || 0),
          avgCostPerDebate: Number(stats?.avgCostPerDebate || 0),
          avgCreditsPerDebate: Number(stats?.avgCreditsPerDebate || 0),
        },
        byUser: costByUser.map((row) => ({
          userId: row.userId,
          email: row.email || 'Unknown',
          name: row.name || 'Unknown',
          totalDebates: Number(row.totalDebates || 0),
          totalCostUsd: Number(row.totalCostUsd || 0),
          totalCreditsUsed: Number(row.totalCreditsUsed || 0),
        })),
      }
    }),

  /**
   * Get debate costs for a specific user
   */
  getUserDebateCosts: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, input.userId))
        .limit(1)

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil no encontrado',
        })
      }

      const debates = await db
        .select({
          id: quoorumDebates.id,
          question: quoorumDebates.question,
          totalCostUsd: quoorumDebates.totalCostUsd,
          totalCreditsUsed: quoorumDebates.totalCreditsUsed,
          createdAt: quoorumDebates.createdAt,
          status: quoorumDebates.status,
        })
        .from(quoorumDebates)
        .where(eq(quoorumDebates.userId, profile.id))
        .orderBy(desc(quoorumDebates.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      const [total] = await db
        .select({ count: sql<number>`count(*)` })
        .from(quoorumDebates)
        .where(eq(quoorumDebates.userId, profile.id))

      return {
        debates,
        total: Number(total?.count || 0),
        limit: input.limit,
        offset: input.offset,
      }
    }),

  // ============================================
  // SYSTEM CONFIGURATION
  // ============================================

  /**
   * Get system configuration status (environment variables, feature flags)
   * Only shows which services are configured, not their values
   */
  getSystemConfig: adminProcedure.query(() => {
    return {
      env: {
        database: !!process.env.DATABASE_URL,
        supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        openai: !!process.env.OPENAI_API_KEY,
        stripe: !!process.env.STRIPE_SECRET_KEY,
        resend: !!process.env.RESEND_API_KEY,
        pinecone: !!process.env.PINECONE_API_KEY,
        redis: !!(process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL),
        serper: !!process.env.SERPER_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        google: !!process.env.GOOGLE_AI_API_KEY || !!process.env.GEMINI_API_KEY,
        groq: !!process.env.GROQ_API_KEY,
      },
      features: {
        dynamicSystem: true,
        expertDatabase: true,
        qualityMonitor: true,
        metaModerator: true,
        pinecone: !!process.env.PINECONE_API_KEY,
        serper: !!process.env.SERPER_API_KEY,
        redis: !!(process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL),
        email: !!process.env.RESEND_API_KEY,
        websocket: true,
        pdfExport: true,
        notifications: true,
      },
      limits: {
        free: {
          debatesPerDay: 3,
          debatesPerHour: 2,
          roundsPerDebate: 5,
          maxConcurrentDebates: 1,
          maxCostPerDay: 1.0,
        },
        starter: {
          debatesPerDay: 10,
          debatesPerHour: 5,
          roundsPerDebate: 10,
          maxConcurrentDebates: 2,
          maxCostPerDay: 5.0,
        },
        pro: {
          debatesPerDay: 50,
          debatesPerHour: 20,
          roundsPerDebate: 15,
          maxConcurrentDebates: 5,
          maxCostPerDay: 20.0,
        },
        business: {
          debatesPerDay: -1, // unlimited
          debatesPerHour: -1,
          roundsPerDebate: 20,
          maxConcurrentDebates: 10,
          maxCostPerDay: 100.0,
        },
      },
    }
  }),

  /**
   * Get debate costs analytics by phase
   * Returns all debates with cost breakdown by phase for admin analytics table
   */
  getDebatesCostAnalytics: adminProcedure.query(async () => {
    const debates = await db
      .select({
        id: quoorumDebates.id,
        userId: quoorumDebates.userId,
        userName: profiles.fullName,
        userEmail: profiles.email,
        question: quoorumDebates.question,
        status: quoorumDebates.status,
        createdAt: quoorumDebates.createdAt,
        completedAt: quoorumDebates.completedAt,
        totalCostUsd: quoorumDebates.totalCostUsd,
        totalCreditsUsed: quoorumDebates.totalCreditsUsed,
        costsByPhase: quoorumDebates.costsByPhase,
        totalRounds: quoorumDebates.totalRounds,
      })
      .from(quoorumDebates)
      .innerJoin(profiles, eq(quoorumDebates.userId, profiles.id))
      .where(eq(quoorumDebates.status, 'completed'))
      .orderBy(desc(quoorumDebates.completedAt))
      .limit(100)

    return debates
  }),
})
