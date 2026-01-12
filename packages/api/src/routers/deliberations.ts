import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { deliberations, type DeliberationStatus } from "@forum/db";

const statusSchema = z.enum([
  "draft",
  "active",
  "paused",
  "completed",
  "cancelled",
]) satisfies z.ZodType<DeliberationStatus>;

export const deliberationsRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(deliberations)
        .where(eq(deliberations.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  list: publicProcedure
    .input(
      z.object({
        status: statusSchema.optional(),
        createdById: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.db
        .select()
        .from(deliberations)
        .orderBy(desc(deliberations.createdAt));

      if (input.status) {
        query = query.where(eq(deliberations.status, input.status)) as typeof query;
      }

      if (input.createdById) {
        query = query.where(eq(deliberations.createdById, input.createdById)) as typeof query;
      }

      return query.limit(input.limit).offset(input.offset);
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().min(1),
        topic: z.string().min(1),
        objectives: z.array(z.string()).default([]),
        constraints: z.array(z.string()).default([]),
        maxRounds: z.number().min(1).max(20).default(5),
        consensusThreshold: z.number().min(0).max(100).default(70),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(deliberations)
        .values({
          ...input,
          createdById: ctx.user.id,
          status: "draft",
        })
        .returning();
      return result[0]!;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: statusSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = {
        status: input.status,
        updatedAt: new Date(),
      };

      if (input.status === "completed" || input.status === "cancelled") {
        updates.completedAt = new Date();
      }

      const result = await ctx.db
        .update(deliberations)
        .set(updates)
        .where(eq(deliberations.id, input.id))
        .returning();
      return result[0] ?? null;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().min(1).optional(),
        topic: z.string().min(1).optional(),
        objectives: z.array(z.string()).optional(),
        constraints: z.array(z.string()).optional(),
        maxRounds: z.number().min(1).max(20).optional(),
        consensusThreshold: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const result = await ctx.db
        .update(deliberations)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(deliberations.id, id))
        .returning();
      return result[0] ?? null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(deliberations)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(deliberations.id, input.id));
      return { success: true };
    }),
});
