/**
 * Debates Router - User-facing debate creation and management
 *
 * This router provides debate functionality for regular authenticated users,
 * integrating with the context assessment system.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure, expensiveRateLimitedProcedure } from "../trpc.js";
import { db } from "@forum/db";
import { forumDebates, profiles } from "@forum/db/schema";
import { runDynamicDebate } from "@forum/forum";
import { logger } from "../lib/logger.js";
import { inngest } from "../lib/inngest-client.js";

// ============================================
// TYPES
// ============================================

interface DebateContext {
  sources?: Array<{ type: string; content: string }>;
  constraints?: string[];
  background?: string;
  assessment?: {
    overallScore: number;
    readinessLevel: string;
    summary: string;
  };
  [key: string]: unknown;
}

// ============================================
// RATE LIMITED PROCEDURE FOR DEBATE CREATION
// ============================================

const debateRateLimitedProcedure = expensiveRateLimitedProcedure;

// ============================================
// ROUTER
// ============================================

export const debatesRouter = router({
  /**
   * Create a new debate
   * Integrates with context assessment for better debate quality
   */
  create: debateRateLimitedProcedure
    .input(
      z.object({
        question: z.string().min(20, "La pregunta debe tener al menos 20 caracteres").max(1000),
        context: z.string().optional(),
        category: z.string().optional(),
        expertCount: z.number().min(4).max(10).default(6),
        maxRounds: z.number().min(3).max(10).default(5),
        assessment: z
          .object({
            overallScore: z.number(),
            readinessLevel: z.string(),
            summary: z.string(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user exists in profiles
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, ctx.user.id));

      if (!profile) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Perfil de usuario no encontrado",
        });
      }

      // Build context object
      const debateContext: DebateContext = {
        background: input.context,
        constraints: [],
      };

      if (input.assessment) {
        debateContext.assessment = input.assessment;
      }

      if (input.category) {
        debateContext.sources = [{ type: "category", content: input.category }];
      }

      // Create debate record
      const [debate] = await db
        .insert(forumDebates)
        .values({
          userId: ctx.user.id,
          question: input.question,
          context: debateContext,
          mode: "dynamic",
          status: "pending",
          visibility: "private",
          metadata: {
            expertCount: input.expertCount,
            maxRounds: input.maxRounds,
            category: input.category,
          },
        })
        .returning();

      if (!debate) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al crear el debate",
        });
      }

      // Trigger debate execution asynchronously via Inngest
      await inngest.send({
        name: "forum/debate.created",
        data: {
          debateId: debate.id,
          userId: ctx.user.id,
          question: input.question,
          context: debateContext,
          expertCount: input.expertCount,
          maxRounds: input.maxRounds,
        },
      });

      // Also start debate inline (fallback if Inngest not configured)
      runDebateAsync(debate.id, ctx.user.id, input.question, debateContext).catch(
        (error: unknown) => {
          logger.error(
            "Error starting debate",
            error instanceof Error ? error : new Error(String(error)),
            { debateId: debate.id }
          );
        }
      );

      return {
        id: debate.id,
        status: debate.status,
        question: debate.question,
      };
    }),

  /**
   * Get debate by ID (user can only see their own debates)
   */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [debate] = await db
        .select()
        .from(forumDebates)
        .where(
          and(
            eq(forumDebates.id, input.id),
            eq(forumDebates.userId, ctx.user.id)
          )
        );

      if (!debate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Debate no encontrado",
        });
      }

      return debate;
    }),

  /**
   * List user's debates
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
        status: z.enum(["pending", "in_progress", "completed", "failed", "cancelled"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Build conditions array
      const conditions = [eq(forumDebates.userId, ctx.user.id)];

      if (input.status) {
        conditions.push(eq(forumDebates.status, input.status));
      }

      const debates = await db
        .select()
        .from(forumDebates)
        .where(and(...conditions))
        .orderBy(desc(forumDebates.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return debates;
    }),

  /**
   * Cancel a pending debate
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [debate] = await db
        .select()
        .from(forumDebates)
        .where(
          and(
            eq(forumDebates.id, input.id),
            eq(forumDebates.userId, ctx.user.id)
          )
        );

      if (!debate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Debate no encontrado",
        });
      }

      if (debate.status !== "pending" && debate.status !== "in_progress") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Solo se pueden cancelar debates pendientes o en progreso",
        });
      }

      await db
        .update(forumDebates)
        .set({
          status: "cancelled",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(forumDebates.id, input.id),
            eq(forumDebates.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Get debate status (lightweight query for polling)
   */
  status: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [debate] = await db
        .select({
          id: forumDebates.id,
          status: forumDebates.status,
          totalRounds: forumDebates.totalRounds,
          consensusScore: forumDebates.consensusScore,
          updatedAt: forumDebates.updatedAt,
        })
        .from(forumDebates)
        .where(
          and(
            eq(forumDebates.id, input.id),
            eq(forumDebates.userId, ctx.user.id)
          )
        );

      if (!debate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Debate no encontrado",
        });
      }

      return debate;
    }),
});

/**
 * Helper: Run debate asynchronously
 */
async function runDebateAsync(
  debateId: string,
  userId: string,
  question: string,
  context?: DebateContext
): Promise<void> {
  try {
    // Update status to in_progress
    await db
      .update(forumDebates)
      .set({ status: "in_progress", startedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(forumDebates.id, debateId), eq(forumDebates.userId, userId)));

    // Map context to LoadedContext format
    type ContextSourceType = "manual" | "internet" | "repo";
    const loadedContext = {
      sources: (context?.sources ?? []).map((s) => ({
        type: (s.type === "internet" || s.type === "repo" ? s.type : "manual") as ContextSourceType,
        content: s.content,
      })),
      combinedContext: context?.background ?? "",
    };

    // Run debate
    const result = await runDynamicDebate({
      sessionId: debateId,
      question,
      context: loadedContext,
      forceMode: "dynamic",
    });

    // Map result types
    const mappedExperts = result.experts?.map((e) => ({
      id: e.id,
      name: e.name,
      expertise: e.specializations ?? [],
    }));

    const mappedRanking = result.finalRanking?.map((r) => ({
      option: r.option,
      score: r.score ?? 0,
      reasoning: r.reasoning,
    }));

    // Update debate with results
    await db
      .update(forumDebates)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
        consensusScore: result.consensusScore,
        totalRounds: result.rounds.length,
        totalCostUsd: estimateCost(result.rounds.length, mappedExperts?.length ?? 4),
        finalRanking: mappedRanking,
        rounds: result.rounds,
        experts: mappedExperts,
        qualityMetrics: result.qualityMetrics,
        interventions: result.interventions,
      })
      .where(and(eq(forumDebates.id, debateId), eq(forumDebates.userId, userId)));
  } catch (error) {
    logger.error(
      "Debate execution failed",
      error instanceof Error ? error : new Error(String(error)),
      { debateId }
    );

    await db
      .update(forumDebates)
      .set({
        status: "failed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(forumDebates.id, debateId), eq(forumDebates.userId, userId)));
  }
}

/**
 * Helper: Estimate debate cost
 */
function estimateCost(rounds: number, experts: number): number {
  const avgTokensPerMessage = 125; // ~500 characters / 4
  const inputTokensPerRound = avgTokensPerMessage * experts * 2;
  const outputTokensPerRound = avgTokensPerMessage * experts;

  const totalInputTokens = inputTokensPerRound * rounds;
  const totalOutputTokens = outputTokensPerRound * rounds;

  // GPT-4o-mini pricing
  const inputCost = (totalInputTokens / 1000) * 0.00015;
  const outputCost = (totalOutputTokens / 1000) * 0.0006;

  return Number((inputCost + outputCost).toFixed(4));
}
