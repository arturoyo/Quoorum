import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { users, adminUsers, adminRoles, profiles } from "@quoorum/db";
import { systemLogger } from "../lib/system-logger";

export const usersRouter = router({
  /**
   * Get current user profile (role, email, etc.)
   */
  getMe: protectedProcedure.query(async ({ ctx }) => {
    systemLogger.debug('[users.getMe] Context user', {
      id: ctx.user.id,
      email: ctx.user.email,
      role: ctx.user.role,
    });
    
    // Check if user has admin role in users table (legacy)
    const hasUserRole = ctx.user.role === "admin" || ctx.user.role === "super_admin";
    systemLogger.debug('[users.getMe] hasUserRole', { hasUserRole, userId: ctx.user.id });
    
    // Parallelize profile and admin role queries
    const queryStart = Date.now();
    const [profileResults, adminUserResults] = await Promise.all([
      ctx.db
        .select()
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1),
      // Pre-fetch admin role data if profile exists
      ctx.db
        .select({
          id: adminUsers.id,
          userId: adminUsers.userId,
          roleId: adminUsers.roleId,
          roleSlug: adminRoles.slug,
        })
        .from(adminUsers)
        .innerJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
        .where(and(eq(adminUsers.userId, ctx.user.id), eq(adminUsers.isActive, true)))
        .limit(1)
    ]);
    const queryTime = Date.now() - queryStart;
    
    const profile = profileResults[0] || null;
    const adminUser = adminUserResults[0] || null;
    
    systemLogger.debug('[users.getMe] Queries completed (parallelized)', { 
      queryTimeMs: queryTime,
      profileId: profile?.id || null,
      hasAdminRole: !!adminUser,
      userId: ctx.user.id 
    });
    
    const isAdmin = hasUserRole || !!adminUser;
    systemLogger.debug('[users.getMe] Final isAdmin', { isAdmin, userId: ctx.user.id });
    
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      role: ctx.user.role,
      isAdmin,
      adminRole: adminUser?.roleSlug || null,
    };
  }),

  /**
   * Get current user profile with full details (name, email, phone, etc.)
   * Returns data from PostgreSQL profiles table, not Supabase Auth
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    // Find profile by email (this is the source of truth for profile data)
    const [profile] = await ctx.db
      .select()
      .from(profiles)
      .where(eq(profiles.email, ctx.user.email))
      .limit(1);
    
    if (!profile) {
      // Return user data as fallback if profile doesn't exist
      return {
        id: ctx.user.id,
        email: ctx.user.email || '',
        name: ctx.user.name || '',
        fullName: ctx.user.name || '',
        phone: null,
        avatarUrl: ctx.user.avatarUrl || null,
      };
    }
    
    return {
      id: profile.id,
      email: profile.email || ctx.user.email || '',
      name: profile.name || ctx.user.name || '',
      fullName: profile.fullName || profile.name || ctx.user.name || '',
      phone: null, // Phone is not stored in profiles table, would need to add it
      avatarUrl: profile.avatarUrl || ctx.user.avatarUrl || null,
    };
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(users)
        .limit(input.limit)
        .offset(input.offset);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        avatarUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const result = await ctx.db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return result[0] ?? null;
    }),
});
