import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { experts } from "@quoorum/db";
import type { AIConfig } from "@quoorum/ai";

const aiConfigSchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "groq"]),
  model: z.string(),
  apiKey: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
}) satisfies z.ZodType<AIConfig>;

export const expertsRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(experts)
        .where(eq(experts.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        activeOnly: z.boolean().default(true),
        limit: z.number().min(1).max(100).default(25),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.db.select().from(experts);

      if (input.activeOnly) {
        query = query.where(eq(experts.isActive, true)) as typeof query;
      }

      return query.limit(input.limit).offset(input.offset);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        expertise: z.string().min(1).max(500),
        description: z.string().optional(),
        systemPrompt: z.string().min(1),
        aiConfig: aiConfigSchema,
        category: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.insert(experts).values(input).returning();
      return result[0]!;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        expertise: z.string().min(1).max(500).optional(),
        description: z.string().optional(),
        systemPrompt: z.string().min(1).optional(),
        aiConfig: aiConfigSchema.optional(),
        category: z.string().max(100).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const result = await ctx.db
        .update(experts)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(experts.id, id))
        .returning();
      return result[0] ?? null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(experts)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(experts.id, input.id));
      return { success: true };
    }),
});
