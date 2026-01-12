import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { opinions, type OpinionMetadata } from "@forum/db";

const metadataSchema = z.object({
  tokensUsed: z.number().optional(),
  latencyMs: z.number().optional(),
  modelVersion: z.string().optional(),
}) satisfies z.ZodType<OpinionMetadata>;

export const opinionsRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(opinions)
        .where(eq(opinions.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  listByRound: publicProcedure
    .input(
      z.object({
        roundId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(opinions)
        .where(eq(opinions.roundId, input.roundId))
        .orderBy(desc(opinions.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  create: protectedProcedure
    .input(
      z.object({
        roundId: z.string().uuid(),
        expertId: z.string().uuid(),
        content: z.string().min(1),
        reasoning: z.string().min(1),
        confidence: z.number().min(0).max(1),
        qualityScore: z.number().min(0).max(1).optional(),
        position: z.number().optional(),
        metadata: metadataSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.insert(opinions).values(input).returning();
      return result[0]!;
    }),

  updateQualityScore: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        qualityScore: z.number().min(0).max(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(opinions)
        .set({ qualityScore: input.qualityScore })
        .where(eq(opinions.id, input.id))
        .returning();
      return result[0] ?? null;
    }),
});
