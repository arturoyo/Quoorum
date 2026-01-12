import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { consensus, type DissentingExpert } from "@quoorum/db";

const dissentingExpertSchema = z.object({
  expertId: z.string(),
  reason: z.string(),
}) satisfies z.ZodType<DissentingExpert>;

export const consensusRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(consensus)
        .where(eq(consensus.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  getByDeliberation: publicProcedure
    .input(z.object({ deliberationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(consensus)
        .where(eq(consensus.deliberationId, input.deliberationId))
        .orderBy(desc(consensus.createdAt));
    }),

  getLatestByDeliberation: publicProcedure
    .input(z.object({ deliberationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(consensus)
        .where(eq(consensus.deliberationId, input.deliberationId))
        .orderBy(desc(consensus.createdAt))
        .limit(1);
      return result[0] ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        deliberationId: z.string().uuid(),
        roundId: z.string().uuid().optional(),
        achieved: z.boolean(),
        score: z.number().min(0).max(1),
        summary: z.string().min(1),
        recommendation: z.string().optional(),
        dissenting: z.array(dissentingExpertSchema).default([]),
        qualityAssessment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.insert(consensus).values(input).returning();
      return result[0]!;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        achieved: z.boolean().optional(),
        score: z.number().min(0).max(1).optional(),
        summary: z.string().min(1).optional(),
        recommendation: z.string().optional(),
        dissenting: z.array(dissentingExpertSchema).optional(),
        qualityAssessment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const result = await ctx.db
        .update(consensus)
        .set(data)
        .where(eq(consensus.id, id))
        .returning();
      return result[0] ?? null;
    }),
});
