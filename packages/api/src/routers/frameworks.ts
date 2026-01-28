import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "@quoorum/db/client";
import { frameworks, debateFrameworks } from "@quoorum/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getAIClient } from "@quoorum/ai";
import { logger } from "../lib/logger";
import { trackAICall } from "@quoorum/quoorum/ai-cost-tracking";
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
   * Suggest frameworks automatically based on question context using AI
   * Analyzes the question and suggests the most appropriate decision framework
   */
  suggest: protectedProcedure
    .input(z.object({ question: z.string().min(10), context: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      // Get all active frameworks
      const allFrameworks = await db
        .select()
        .from(frameworks)
        .where(eq(frameworks.isActive, true))
        .orderBy(frameworks.name);

      if (allFrameworks.length === 0) {
        return [];
      }

      // Use AI to analyze the question and suggest frameworks
      const startTime = Date.now();
      try {
        const aiClient = getAIClient();

        const systemPrompt = `Eres un experto en frameworks de toma de decisiones.
Analiza la pregunta del usuario y sugiere el framework más apropiado para estructurar la respuesta final del debate.

Frameworks disponibles:
${allFrameworks.map((f, i) => `${i + 1}. ${f.name} (${f.slug}): ${f.description}`).join('\n')}

Responde SOLO con un JSON array de frameworks sugeridos, ordenados por relevancia (más relevante primero).
Cada framework debe incluir:
- slug: el slug del framework
- matchScore: puntuación de 0-100 de qué tan apropiado es
- reasoning: explicación breve de por qué es apropiado

Ejemplo de respuesta:
[
  {
    "slug": "swot-analysis",
    "matchScore": 85,
    "reasoning": "La pregunta requiere análisis de fortalezas, debilidades, oportunidades y amenazas"
  },
  {
    "slug": "pros-and-cons",
    "matchScore": 60,
    "reasoning": "Alternativa válida para comparar opciones"
  }
]`;

        const userPrompt = `Pregunta del usuario: "${input.question}"
${input.context ? `Contexto adicional: "${input.context}"` : ''}

¿Qué framework(s) de decisión sería(n) más apropiado(s) para estructurar la respuesta final?`;

        const response = await aiClient.generate(userPrompt, {
          systemPrompt,
          modelId: "gemini-2.0-flash-exp",
          temperature: 0.3,
          maxTokens: 1000,
        });

        // Track AI cost
        void trackAICall({
          userId: ctx.userId,
          operationType: 'frameworks_suggestion',
          provider: 'google',
          modelId: 'gemini-2.0-flash-exp',
          promptTokens: response.usage?.promptTokens || 0,
          completionTokens: response.usage?.completionTokens || 0,
          latencyMs: Date.now() - startTime,
          success: true,
          inputSummary: input.question.substring(0, 500),
          outputSummary: response.text.substring(0, 500),
        });

        // Parse JSON response
        const jsonMatch = response.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          // Fallback: return first framework
          return allFrameworks.slice(0, 1).map((f) => ({
            id: f.id,
            slug: f.slug,
            name: f.name,
            description: f.description,
            matchScore: 50,
            reasoning: "Framework sugerido automáticamente",
          }));
        }

        const suggested = JSON.parse(jsonMatch[0]) as Array<{
          slug: string;
          matchScore: number;
          reasoning: string;
        }>;

        // Map to framework data
        const result = suggested
          .map((s) => {
            const framework = allFrameworks.find((f) => f.slug === s.slug);
            if (!framework) return null;
            return {
              id: framework.id,
              slug: framework.slug,
              name: framework.name,
              description: framework.description,
              matchScore: s.matchScore,
              reasoning: s.reasoning,
            };
          })
          .filter((f): f is NonNullable<typeof f> => f !== null);

        // If no matches, return first framework as fallback
        if (result.length === 0) {
          return allFrameworks.slice(0, 1).map((f) => ({
            id: f.id,
            slug: f.slug,
            name: f.name,
            description: f.description,
            matchScore: 50,
            reasoning: "Framework sugerido automáticamente",
          }));
        }

        logger.info('[frameworks.suggest] AI suggestions:', {
          question: input.question.substring(0, 100),
          suggestionsCount: result.length,
          topSuggestion: result[0]?.slug,
        });

        return result;
      } catch (error) {
        // Track failed AI call
        void trackAICall({
          userId: ctx.userId,
          operationType: 'frameworks_suggestion',
          provider: 'google',
          modelId: 'gemini-2.0-flash-exp',
          promptTokens: 0,
          completionTokens: 0,
          latencyMs: Date.now() - startTime,
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          inputSummary: input.question.substring(0, 500),
        });

        logger.error('[frameworks.suggest] AI suggestion failed:', error instanceof Error ? error : undefined);

        // Fallback: return first framework
        return allFrameworks.slice(0, 1).map((f) => ({
          id: f.id,
          slug: f.slug,
          name: f.name,
          description: f.description,
          matchScore: 50,
          reasoning: "Framework sugerido automáticamente",
        }));
      }
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
    // No userId filter: frameworks are public catalog data, shared across all users
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
