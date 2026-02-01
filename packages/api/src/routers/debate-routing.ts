/**
 * Debate Routing Router
 * CRUD for routing configs that direct debates to specific agent configurations.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, isNull } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { db } from "@quoorum/db";
import { debateRoutingConfigs, profiles, companies } from "@quoorum/db/schema";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const expertFilterRulesSchema = z.object({
  categories: z.array(z.string()).optional(),
  expertIds: z.array(z.string()).optional(),
  excludeIds: z.array(z.string()).optional(),
}).optional();

const createRoutingConfigSchema = z.object({
  companyId: z.string().uuid(),
  departmentId: z.string().uuid().optional(),
  name: z.string().min(1).max(150),
  description: z.string().max(1000).optional(),
  agentSelectionMode: z.enum(["auto", "fixed", "template"]).default("auto"),
  expertFilterRules: expertFilterRulesSchema,
  providerOverride: z.string().max(50).optional(),
  modelOverride: z.string().max(100).optional(),
  maxCostUsd: z.number().positive().max(100).optional(),
  maxRounds: z.number().int().min(1).max(50).default(10),
  slackChannelOverride: z.string().max(100).optional(),
  priority: z.number().int().min(0).max(100).default(0),
  isDefault: z.boolean().default(false),
});

const updateRoutingConfigSchema = createRoutingConfigSchema.partial().extend({
  id: z.string().uuid(),
});

// ============================================
// ROUTER
// ============================================

export const debateRoutingRouter = router({
  // List configs for a company
  list: protectedProcedure
    .input(z.object({
      companyId: z.string().uuid(),
      departmentId: z.string().uuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify user belongs to company via profile
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, ctx.userId),
      });
      if (!profile) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Profile not found" });
      }

      const conditions = [
        eq(debateRoutingConfigs.companyId, input.companyId),
        eq(debateRoutingConfigs.isActive, true),
      ];

      if (input.departmentId) {
        conditions.push(eq(debateRoutingConfigs.departmentId, input.departmentId));
      }

      return db
        .select()
        .from(debateRoutingConfigs)
        .where(and(...conditions))
        .orderBy(desc(debateRoutingConfigs.priority));
    }),

  // Get by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const [config] = await db
        .select()
        .from(debateRoutingConfigs)
        .where(eq(debateRoutingConfigs.id, input.id));

      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Routing config not found" });
      }
      return config;
    }),

  // Create
  create: protectedProcedure
    .input(createRoutingConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, ctx.userId),
      });
      if (!profile) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Profile not found" });
      }

      // If setting as default, unset other defaults for same scope
      if (input.isDefault) {
        const scopeConditions = [
          eq(debateRoutingConfigs.companyId, input.companyId),
          eq(debateRoutingConfigs.isDefault, true),
        ];
        if (input.departmentId) {
          scopeConditions.push(eq(debateRoutingConfigs.departmentId, input.departmentId));
        } else {
          scopeConditions.push(isNull(debateRoutingConfigs.departmentId));
        }
        await db
          .update(debateRoutingConfigs)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(...scopeConditions));
      }

      const [created] = await db
        .insert(debateRoutingConfigs)
        .values({
          ...input,
          createdBy: profile.id,
        })
        .returning();

      return created;
    }),

  // Update
  update: protectedProcedure
    .input(updateRoutingConfigSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const [existing] = await db
        .select({ id: debateRoutingConfigs.id })
        .from(debateRoutingConfigs)
        .where(eq(debateRoutingConfigs.id, id));

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Routing config not found" });
      }

      const [updated] = await db
        .update(debateRoutingConfigs)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(debateRoutingConfigs.id, id))
        .returning();

      return updated;
    }),

  // Delete (soft)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [existing] = await db
        .select({ id: debateRoutingConfigs.id })
        .from(debateRoutingConfigs)
        .where(eq(debateRoutingConfigs.id, input.id));

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Routing config not found" });
      }

      await db
        .update(debateRoutingConfigs)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(debateRoutingConfigs.id, input.id));

      return { success: true };
    }),

  // Resolve: find the best routing config for a debate context
  resolve: protectedProcedure
    .input(z.object({
      companyId: z.string().uuid(),
      departmentId: z.string().uuid().optional(),
    }))
    .query(async ({ input }) => {
      // 1. Try department-specific config
      if (input.departmentId) {
        const [deptConfig] = await db
          .select()
          .from(debateRoutingConfigs)
          .where(and(
            eq(debateRoutingConfigs.companyId, input.companyId),
            eq(debateRoutingConfigs.departmentId, input.departmentId),
            eq(debateRoutingConfigs.isActive, true),
          ))
          .orderBy(desc(debateRoutingConfigs.priority))
          .limit(1);

        if (deptConfig) return deptConfig;
      }

      // 2. Try company-level default
      const [companyDefault] = await db
        .select()
        .from(debateRoutingConfigs)
        .where(and(
          eq(debateRoutingConfigs.companyId, input.companyId),
          isNull(debateRoutingConfigs.departmentId),
          eq(debateRoutingConfigs.isActive, true),
          eq(debateRoutingConfigs.isDefault, true),
        ))
        .limit(1);

      if (companyDefault) return companyDefault;

      // 3. Try any company-level config
      const [anyCompany] = await db
        .select()
        .from(debateRoutingConfigs)
        .where(and(
          eq(debateRoutingConfigs.companyId, input.companyId),
          isNull(debateRoutingConfigs.departmentId),
          eq(debateRoutingConfigs.isActive, true),
        ))
        .orderBy(desc(debateRoutingConfigs.priority))
        .limit(1);

      return anyCompany ?? null;
    }),
});
