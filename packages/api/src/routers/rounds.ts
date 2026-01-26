import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { rounds, type RoundStatus } from "@quoorum/db";

const statusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
]) satisfies z.ZodType<RoundStatus>;

export const roundsRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(rounds)
        .where(eq(rounds.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  listByDeliberation: publicProcedure
    .input(
      z.object({
        deliberationId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(rounds)
        .where(eq(rounds.deliberationId, input.deliberationId))
        .orderBy(desc(rounds.roundNumber))
        .limit(input.limit)
        .offset(input.offset);
    }),

  create: protectedProcedure
    .input(
      z.object({
        deliberationId: z.string().uuid(),
        roundNumber: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(rounds)
        .values({
          deliberationId: input.deliberationId,
          roundNumber: input.roundNumber,
          status: "pending",
        })
        .returning();
      return result[0]!;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: statusSchema,
        summary: z.string().optional(),
        moderatorNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status, ...rest } = input;
      const updates: Record<string, unknown> = { status, ...rest };

      if (status === "in_progress") {
        updates.startedAt = new Date();
      } else if (status === "completed") {
        updates.completedAt = new Date();
      }

      const result = await ctx.db
        .update(rounds)
        .set(updates)
        .where(eq(rounds.id, id))
        .returning();
      return result[0] ?? null;
    }),

  getCurrentRound: publicProcedure
    .input(z.object({ deliberationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(rounds)
        .where(
          and(
            eq(rounds.deliberationId, input.deliberationId),
            eq(rounds.status, "in_progress")
          )
        )
        .limit(1);
      return result[0] ?? null;
    }),
});
