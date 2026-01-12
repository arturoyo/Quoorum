import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { votes } from "@forum/db";

export const votesRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(votes)
        .where(eq(votes.id, input.id))
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
        .from(votes)
        .where(eq(votes.roundId, input.roundId))
        .orderBy(desc(votes.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  listByOpinion: publicProcedure
    .input(
      z.object({
        opinionId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(votes)
        .where(eq(votes.opinionId, input.opinionId))
        .orderBy(desc(votes.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  create: protectedProcedure
    .input(
      z.object({
        roundId: z.string().uuid(),
        expertId: z.string().uuid(),
        opinionId: z.string().uuid(),
        weight: z.number().min(0).max(10).default(1),
        score: z.number().min(-10).max(10),
        justification: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.insert(votes).values(input).returning();
      return result[0]!;
    }),

  getByExpertAndRound: publicProcedure
    .input(
      z.object({
        expertId: z.string().uuid(),
        roundId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(votes)
        .where(
          and(eq(votes.expertId, input.expertId), eq(votes.roundId, input.roundId))
        );
    }),
});
