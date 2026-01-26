import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "@quoorum/db/client";
import { frameworks, debateFrameworks } from "@quoorum/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  runProsAndCons,
  runSWOTAnalysis,
  runEisenhowerMatrix,
} from "@quoorum/quoorum/frameworks";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const prosAndConsInputSchema = z.object({
  question: z.string().min(10, "La pregunta debe tener al menos 10 caracteres").max(500),
  context: z.string().max(2000).optional(),
  userBackstory: z
    .object({
      role: z.string().optional(),
      industry: z.string().optional(),
      companyStage: z.string().optional(),
    })
    .optional(),
});

const swotAnalysisInputSchema = z.object({
  question: z.string().min(10, "La pregunta debe tener al menos 10 caracteres").max(500),
  context: z.string().max(2000).optional(),
  userBackstory: z
    .object({
      role: z.string().optional(),
      industry: z.string().optional(),
      companyStage: z.string().optional(),
    })
    .optional(),
});

const eisenhowerMatrixInputSchema = z.object({
  question: z.string().min(10, "La pregunta debe tener al menos 10 caracteres").max(500),
  tasks: z.array(z.string()).max(20).optional(), // Max 20 tasks
  context: z.string().max(2000).optional(),
  userBackstory: z
    .object({
      role: z.string().optional(),
      industry: z.string().optional(),
      companyStage: z.string().optional(),
    })
    .optional(),
});

// ============================================================================
// ROUTER
// ============================================================================

export const frameworksRouter = router({
  /**
   * List all active frameworks
   */
  list: publicProcedure.query(async () => {
    const allFrameworks = await db
      .select()
      .from(frameworks)
      .where(eq(frameworks.isActive, true))
      .orderBy(frameworks.name);

    return allFrameworks;
  }),

  /**
   * Get framework by slug
   */
  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const [framework] = await db
      .select()
      .from(frameworks)
      .where(and(eq(frameworks.slug, input.slug), eq(frameworks.isActive, true)))
      .limit(1);

    if (!framework) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Framework no encontrado",
      });
    }

    return framework;
  }),

  /**
   * Run Pros and Cons analysis
   */
  runProsAndCons: protectedProcedure
    .input(prosAndConsInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get user backstory for context
        const userBackstory = input.userBackstory || undefined;

        // Run the framework
        const result = await runProsAndCons({
          question: input.question,
          context: input.context,
          userBackstory,
        });

        // Track framework usage (we'll create the debate record separately if needed)
        // For now, just return the result

        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error al ejecutar el análisis Pros and Cons",
        });
      }
    }),

  /**
   * Run SWOT Analysis
   */
  runSWOTAnalysis: protectedProcedure
    .input(swotAnalysisInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get user backstory for context
        const userBackstory = input.userBackstory || undefined;

        // Run the framework
        const result = await runSWOTAnalysis({
          question: input.question,
          context: input.context,
          userBackstory,
        });

        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error al ejecutar el análisis SWOT",
        });
      }
    }),

  /**
   * Run Eisenhower Matrix
   */
  runEisenhowerMatrix: protectedProcedure
    .input(eisenhowerMatrixInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get user backstory for context
        const userBackstory = input.userBackstory || undefined;

        // Run the framework
        const result = await runEisenhowerMatrix({
          question: input.question,
          tasks: input.tasks,
          context: input.context,
          userBackstory,
        });

        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error al ejecutar la Matriz de Eisenhower",
        });
      }
    }),

  /**
   * Track framework usage (after debate is created)
   */
  trackUsage: protectedProcedure
    .input(
      z.object({
        debateId: z.string().uuid(),
        frameworkSlug: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Get framework by slug
      const [framework] = await db
        .select()
        .from(frameworks)
        .where(eq(frameworks.slug, input.frameworkSlug))
        .limit(1);

      if (!framework) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Framework no encontrado",
        });
      }

      // Create debate_frameworks record
      await db.insert(debateFrameworks).values({
        debateId: input.debateId,
        frameworkId: framework.id,
      });

      return { success: true };
    }),

  /**
   * Get framework usage stats (admin)
   */
  getUsageStats: protectedProcedure.query(async () => {
    // Get count of debates per framework
    const stats = await db
      .select({
        frameworkId: debateFrameworks.frameworkId,
        count: db.$count(debateFrameworks.id),
      })
      .from(debateFrameworks)
      .groupBy(debateFrameworks.frameworkId);

    // Join with frameworks to get names
    const frameworksList = await db.select().from(frameworks);

    return frameworksList.map((framework) => {
      const stat = stats.find((s) => s.frameworkId === framework.id);
      return {
        ...framework,
        usageCount: stat?.count || 0,
      };
    });
  }),
});
