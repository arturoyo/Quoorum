/**
 * Debates Router - User-facing debate creation and management
 *
 * This router provides debate functionality for regular authenticated users,
 * integrating with the context assessment system.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
import { router, protectedProcedure, expensiveRateLimitedProcedure } from "../trpc.js";
import { db } from "@quoorum/db";
import { quoorumDebates, users, userContextFiles as userContextFilesTable } from "@quoorum/db/schema";
import { runDynamicDebate, notifyDebateComplete, selectStrategy, DebateOrchestrator } from "@quoorum/quoorum";
import type { ExpertProfile, PatternType } from "@quoorum/quoorum";
import { logger } from "../lib/logger.js";
import { inngest } from "../lib/inngest-client.js";
import { debateSequenceToResult } from "../lib/debate-orchestration-adapter.js";

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
  // Structured prompting fields (from course - Fase de Contexto)
  userRole?: string; // "Soy CEO de startup B2B SaaS"
  teamSize?: string; // "5-10 personas"
  budget?: string; // "€50k - €100k"
  deadline?: string; // "3 meses"
  successCriteria?: string[]; // ["ROI > 20%", "Churn < 5%"]
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
   * Create a draft debate (when user sends first message)
   * Creates the debate in the database immediately for better UX
   */
      createDraft: protectedProcedure
    .input(
      z.object({
        question: z.string().min(1, "La pregunta no puede estar vacía").max(5000, "La pregunta no puede exceder 5000 caracteres"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      logger.info("Creating draft debate", {
        userId: ctx.user.id,
        question: input.question.substring(0, 50)
      });

      // Generate title from question (first 60 chars or until punctuation)
      let title = input.question.substring(0, 60);
      const punctuationMatch = title.match(/[.!?]/);
      if (punctuationMatch && punctuationMatch.index) {
        title = title.substring(0, punctuationMatch.index);
      }
      if (input.question.length > 60) {
        title += "...";
      }

      // Use Drizzle ORM to create debate in local PostgreSQL
      const [debate] = await db
        .insert(quoorumDebates)
        .values({
          userId: ctx.user.id,
          question: input.question,
          context: { background: "" },
          mode: "dynamic",
          status: "draft", // Draft state - not yet executed
          visibility: "private",
          metadata: {
            title: title,
            createdViaContextAssessment: true,
          },
        })
        .returning();

      if (!debate) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al crear el debate",
        });
      }

      return {
        id: debate.id,
        title: title,
        question: debate.question,
        status: debate.status,
      };
    }),

  /**
   * Create a new debate or update existing draft
   * Integrates with context assessment for better debate quality
   */
  create: debateRateLimitedProcedure
    .input(
      z.object({
        draftId: z.string().uuid().optional(), // If provided, update existing draft instead of creating new
        question: z.string().min(20, "La pregunta debe tener al menos 20 caracteres").max(5000, "La pregunta no puede exceder 5000 caracteres"),
        context: z.string().optional(),
        category: z.string().optional(),
        expertCount: z.number().min(4).max(10).default(6),
        maxRounds: z.number().min(3).max(10).default(5),
        executionStrategy: z.enum(['sequential', 'parallel']).optional(), // Estrategia de ejecución de agentes dentro de una ronda
        pattern: z.enum(['simple', 'sequential', 'parallel', 'conditional', 'iterative', 'tournament', 'adversarial', 'ensemble', 'hierarchical']).optional(), // Patrón de orquestación (si no se proporciona, se determina automáticamente)
        selectedExpertIds: z.array(z.string().uuid()).optional(), // IDs de expertos personalizados seleccionados por el usuario
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
      // User is already verified in protectedProcedure middleware
      // Skip profile check to avoid Postgres connection issues

      logger.info(input.draftId ? "Updating draft debate" : "Creating debate", {
        userId: ctx.user.id,
        question: input.question.substring(0, 50),
        draftId: input.draftId
      });

      // Get user's active context files
      const userContextFilesList = await db
        .select({
          name: userContextFilesTable.name,
          content: userContextFilesTable.content,
          order: userContextFilesTable.order,
        })
        .from(userContextFilesTable)
        .where(
          and(
            eq(userContextFilesTable.userId, ctx.user.id),
            eq(userContextFilesTable.isActive, true)
          )
        )
        .orderBy(userContextFilesTable.order, userContextFilesTable.createdAt);

      // Combine user context files into a single string
      const userContextContent = userContextFilesList
        .map((file) => `## ${file.name}\n\n${file.content}`)
        .join('\n\n---\n\n');

      // Combine user context with provided context
      const combinedContext = userContextContent 
        ? (input.context 
          ? `${userContextContent}\n\n---\n\n## Contexto Adicional del Usuario\n\n${input.context}`
          : userContextContent)
        : input.context || undefined;

      // Build context object
      const debateContext: DebateContext = {
        background: combinedContext,
        constraints: [],
      };

      if (input.assessment) {
        debateContext.assessment = input.assessment;
      }

      if (input.category) {
        debateContext.sources = [{ type: "category", content: input.category }];
      }

      let debate: any;

      // If draftId provided, update existing draft
      if (input.draftId) {
        // First, get existing debate to preserve title
        const [existingDebate] = await db
          .select({ metadata: quoorumDebates.metadata })
          .from(quoorumDebates)
          .where(
            and(
              eq(quoorumDebates.id, input.draftId),
              eq(quoorumDebates.userId, ctx.user.id)
            )
          );

        if (!existingDebate) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Debate borrador no encontrado",
          });
        }

        const existingTitle = existingDebate?.metadata?.title;

        // Now update the debate
        const [updatedDebate] = await db
          .update(quoorumDebates)
          .set({
            context: debateContext,
            status: "pending",
            metadata: {
              expertCount: input.expertCount,
              maxRounds: input.maxRounds,
              category: input.category,
              title: existingTitle, // Preserve existing title
              createdViaContextAssessment: true,
              pattern: input.pattern || 'simple', // Save selected pattern
            },
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(quoorumDebates.id, input.draftId),
              eq(quoorumDebates.userId, ctx.user.id)
            )
          )
          .returning();

        if (!updatedDebate) {
          logger.error("Database error updating draft debate");
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error al actualizar el debate. Por favor, intenta de nuevo.",
          });
        }

        debate = updatedDebate;
      } else {
        // Create new debate
        const [newDebate] = await db
          .insert(quoorumDebates)
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

        if (!newDebate) {
          logger.error("Database error creating debate");
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error al crear el debate. Por favor, intenta de nuevo.",
          });
        }

        debate = newDebate;
      }

      // Trigger debate execution asynchronously via Inngest
      await inngest.send({
        name: "quoorum/debate.created",
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
      runDebateAsync(debate.id, ctx.user.id, input.question, debateContext, input.executionStrategy, (input.pattern as PatternType | undefined), input.selectedExpertIds).catch(
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
      // Use Drizzle ORM for local PostgreSQL
      const [debate] = await db
        .select()
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
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
        status: z.enum(["draft", "pending", "in_progress", "completed", "failed", "cancelled"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        console.log('[debates.list] Starting query', { userId: ctx.user.id, input });

        // Use Drizzle ORM directly for local PostgreSQL
        const conditions = [
          eq(quoorumDebates.userId, ctx.user.id),
          isNull(quoorumDebates.deletedAt), // Exclude soft-deleted debates
        ];

        if (input.status) {
          conditions.push(eq(quoorumDebates.status, input.status));
        }

        console.log('[debates.list] Executing database query');
        const debates = await db
          .select()
          .from(quoorumDebates)
          .where(and(...conditions))
          .orderBy(desc(quoorumDebates.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        console.log('[debates.list] Query successful', { count: debates.length });
        return debates;
      } catch (error) {
        console.error('[debates.list] Error:', error);
        console.error('[debates.list] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          userId: ctx.user.id,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch debates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  /**
   * Cancel a pending debate
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [debate] = await db
        .select()
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
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
        .update(quoorumDebates)
        .set({
          status: "cancelled",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Update debate metadata (title, etc.)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Use Drizzle ORM directly for local PostgreSQL
      // First, get existing debate to verify ownership and merge metadata
      const [existingDebate] = await db
        .select()
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
          )
        );

      if (!existingDebate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Debate no encontrado",
        });
      }

      // Update debate
      const [updatedDebate] = await db
        .update(quoorumDebates)
        .set({
          metadata: {
            ...existingDebate.metadata,
            ...input.metadata,
          },
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
          )
        )
        .returning();

      if (!updatedDebate) {
        logger.error("Database error updating debate");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al actualizar el debate.",
        });
      }

      return updatedDebate;
    }),

  /**
   * Delete a debate (soft delete)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Use Drizzle ORM directly for local PostgreSQL
      // Verify ownership first
      const [existingDebate] = await db
        .select({ id: quoorumDebates.id })
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
          )
        );

      if (!existingDebate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Debate no encontrado",
        });
      }

      // Soft delete
      await db
        .update(quoorumDebates)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Get dashboard stats for debates
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    // Total debates
    const allDebates = await db
      .select({ id: quoorumDebates.id })
      .from(quoorumDebates)
      .where(
        and(
          eq(quoorumDebates.userId, ctx.user.id),
          isNull(quoorumDebates.deletedAt)
        )
      );

    const totalDebates = allDebates.length;

    // Completed debates
    const completedDebates = await db
      .select({ id: quoorumDebates.id })
      .from(quoorumDebates)
      .where(
        and(
          eq(quoorumDebates.userId, ctx.user.id),
          eq(quoorumDebates.status, "completed"),
          isNull(quoorumDebates.deletedAt)
        )
      );

    const completedCount = completedDebates.length;

    // Average consensus
    const debatesWithConsensus = await db
      .select({ consensusScore: quoorumDebates.consensusScore })
      .from(quoorumDebates)
      .where(
        and(
          eq(quoorumDebates.userId, ctx.user.id),
          eq(quoorumDebates.status, "completed"),
          isNull(quoorumDebates.deletedAt),
          sql`${quoorumDebates.consensusScore} IS NOT NULL`
        )
      );

    const avgConsensus =
      debatesWithConsensus.length > 0
        ? Math.round(
            debatesWithConsensus.reduce((sum, d) => sum + (d.consensusScore || 0), 0) /
              debatesWithConsensus.length * 100
          )
        : 0;

    // This month count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthDebates = await db
      .select({ id: quoorumDebates.id })
      .from(quoorumDebates)
      .where(
        and(
          eq(quoorumDebates.userId, ctx.user.id),
          sql`${quoorumDebates.createdAt} >= ${startOfMonth.toISOString()}`,
          isNull(quoorumDebates.deletedAt)
        )
      );

    const thisMonthCount = thisMonthDebates.length;

    return {
      totalDebates,
      completedDebates: completedCount,
      avgConsensus,
      thisMonth: thisMonthCount,
    };
  }),

  /**
   * Get debate status (lightweight query for polling)
   */
  status: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [debate] = await db
        .select({
          id: quoorumDebates.id,
          status: quoorumDebates.status,
          totalRounds: quoorumDebates.totalRounds,
          consensusScore: quoorumDebates.consensusScore,
          processingStatus: quoorumDebates.processingStatus,
          updatedAt: quoorumDebates.updatedAt,
        })
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
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

  // ═══════════════════════════════════════════════════════════
  // INTERACTIVE CONTROLS
  // ═══════════════════════════════════════════════════════════

  /**
   * Pause a debate in progress
   */
  pause: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [debate] = await db
        .select({ status: quoorumDebates.status })
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
          )
        );

      if (!debate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Debate no encontrado",
        });
      }

      if (debate.status !== "in_progress") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Solo se pueden pausar debates en progreso",
        });
      }

      await db
        .update(quoorumDebates)
        .set({
          metadata: sql`jsonb_set(metadata, '{paused}', 'true'::jsonb)`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
          )
        );

      logger.info("Debate paused", { debateId: input.id, userId: ctx.user.id });

      return { success: true, message: "Debate pausado" };
    }),

  /**
   * Resume a paused debate
   */
  resume: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [debate] = await db
        .select({ status: quoorumDebates.status, metadata: quoorumDebates.metadata })
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
          )
        );

      if (!debate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Debate no encontrado",
        });
      }

      if (debate.status !== "in_progress") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Solo se pueden reanudar debates en progreso",
        });
      }

      await db
        .update(quoorumDebates)
        .set({
          metadata: sql`jsonb_set(metadata, '{paused}', 'false'::jsonb)`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
          )
        );

      logger.info("Debate resumed", { debateId: input.id, userId: ctx.user.id });

      return { success: true, message: "Debate reanudado" };
    }),

  /**
   * Add context during a debate
   */
  addContext: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        context: z.string().min(10, "El contexto debe tener al menos 10 caracteres").max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [debate] = await db
        .select({ status: quoorumDebates.status, context: quoorumDebates.context })
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
          )
        );

      if (!debate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Debate no encontrado",
        });
      }

      if (debate.status !== "in_progress") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Solo se puede añadir contexto a debates en progreso",
        });
      }

      const currentContext = (debate.context as any) || {};
      const additionalContext = currentContext.additional || [];
      additionalContext.push({
        content: input.context,
        addedAt: new Date().toISOString(),
      });

      await db
        .update(quoorumDebates)
        .set({
          context: {
            ...currentContext,
            additional: additionalContext,
          },
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
          )
        );

      logger.info("Context added to debate", {
        debateId: input.id,
        userId: ctx.user.id,
        contextLength: input.context.length
      });

      return { success: true, message: "Contexto añadido al debate" };
    }),

  /**
   * Force consensus on a debate (end early)
   */
  forceConsensus: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [debate] = await db
        .select({ status: quoorumDebates.status })
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
          )
        );

      if (!debate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Debate no encontrado",
        });
      }

      if (debate.status !== "in_progress") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Solo se puede forzar consenso en debates en progreso",
        });
      }

      await db
        .update(quoorumDebates)
        .set({
          metadata: sql`jsonb_set(metadata, '{forceConsensus}', 'true'::jsonb)`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
          )
        );

      logger.info("Consensus forced on debate", { debateId: input.id, userId: ctx.user.id });

      return { success: true, message: "Se forzará consenso en la próxima ronda" };
    }),

  /**
   * Generate optimized meta-prompt for deliberation
   * Takes user's question + context and creates an optimized prompt for agents
   */
  generateOptimizedPrompt: protectedProcedure
    .input(
      z.object({
        contextInfo: z.string().min(10, "Context must be at least 10 characters"),
      })
    )
    .mutation(async ({ input }) => {
      logger.info("[Meta-Prompt] Generating optimized prompt", {
        contextLength: input.contextInfo.length,
      });

      try {
        // Import AI client
        const { getAIClient } = await import("@quoorum/ai");
        const aiClient = getAIClient();

        // Generate optimized prompt using AI
        const response = await aiClient.generate(
          `Imagina que tienes que crear un prompt para deliberar sobre lo siguiente:\n\n${input.contextInfo}\n\nCrea un prompt claro, conciso y bien estructurado que capture toda la información esencial para que los expertos puedan deliberar efectivamente. El prompt debe ser directo y enfocado en la pregunta principal y el contexto clave.`,
          {
            modelId: "gemini-2.0-flash-exp", // Free tier
            temperature: 0.7,
            maxTokens: 500,
          }
        );

        const optimizedPrompt = response.text.trim();

        logger.info("[Meta-Prompt] Generated successfully", {
          originalLength: input.contextInfo.length,
          optimizedLength: optimizedPrompt.length,
        });

        return optimizedPrompt;
      } catch (error) {
        logger.error("[Meta-Prompt] Generation failed", {
          error: error instanceof Error ? error.message : String(error),
        });

        // Fallback to original context if AI fails
        return input.contextInfo;
      }
    }),
});

/**
 * Helper: Run debate asynchronously
 */
async function runDebateAsync(
  debateId: string,
  userId: string,
  question: string,
  context?: DebateContext,
  executionStrategy?: 'sequential' | 'parallel', // Estrategia de ejecución de agentes dentro de una ronda
  pattern?: PatternType, // Patrón de orquestación (simple, tournament, adversarial, etc.)
  selectedExpertIds?: string[] // IDs de expertos personalizados seleccionados por el usuario
): Promise<void> {
  try {
    // Update status to in_progress
    await db
      .update(quoorumDebates)
      .set({ status: "in_progress", startedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(quoorumDebates.id, debateId), eq(quoorumDebates.userId, userId)));

    // Event 1: Validating and starting (5%)
    await updateProcessingStatus(
      debateId,
      userId,
      "validating",
      "Validando pregunta e iniciando deliberación...",
      5
    );

    // Event 2: Analyzing context (15%)
    await updateProcessingStatus(
      debateId,
      userId,
      "analyzing",
      "Analizando contexto y complejidad de la pregunta...",
      15
    );

    // Map context to LoadedContext format
    type ContextSourceType = "manual" | "internet" | "repo";
    const loadedContext = {
      sources: (context?.sources ?? []).map((s) => ({
        type: (s.type === "internet" || s.type === "repo" ? s.type : "manual") as ContextSourceType,
        content: s.content,
      })),
      combinedContext: context?.background ?? "",
    };

    // Event 3: Selecting experts (25%)
    await updateProcessingStatus(
      debateId,
      userId,
      "matching",
      "Seleccionando expertos especializados...",
      25
    );

    // Event 4: Preparing rounds (30%)
    await updateProcessingStatus(
      debateId,
      userId,
      "preparing",
      "Preparando rondas de deliberación...",
      30
    );

    // Run debate (35-80% happens inside runDynamicDebate with onProgress callback)
    // Track messages for the current round (for real-time UI updates)
    let currentRoundMessages: Array<{
      agentKey: string;
      agentName: string;
      model: string;
      content: string;
      timestamp: string;
    }> = [];

    // Track estimated total rounds (set by onProgress callback)
    let estimatedTotalRounds = 20; // Default fallback

    // Determine orchestration pattern (if not provided, auto-determine using selectStrategy)
    let finalPattern: PatternType = pattern || 'simple'
    
    if (!pattern) {
      // Auto-determine pattern using selectStrategy if not provided by user
      try {
        const strategyAnalysis = await selectStrategy(question, { patternMode: 'auto' })
        finalPattern = strategyAnalysis.recommendedPattern

        logger.info(`[Debate ${debateId}] Pattern auto-determined`, {
          recommendedPattern: finalPattern,
          confidence: strategyAnalysis.confidence,
          reasoning: strategyAnalysis.reasoning,
        })
      } catch (error) {
        logger.warn(`[Debate ${debateId}] Failed to determine pattern, using simple`, {
          error: error instanceof Error ? error.message : String(error)
        })
        // Default to simple on error
        finalPattern = 'simple'
      }
    } else {
      logger.info(`[Debate ${debateId}] Using user-selected pattern`, {
        pattern: finalPattern,
      })
    }

    // Determine execution strategy for agents within rounds
    let finalExecutionStrategy: 'sequential' | 'parallel' = executionStrategy || 'sequential'

    // Use orchestrated debate for complex patterns (tournament, adversarial, ensemble, etc.)
    // Simple pattern uses direct runner (core + experts in one debate)
    let result: any // DebateResult | DebateSequence

    if (finalPattern === 'simple') {
      // SIMPLE PATTERN: Use runDynamicDebate directly (core + experts in single debate)
      result = await runDynamicDebate({
      sessionId: debateId,
      question,
      context: loadedContext,
      executionStrategy: finalExecutionStrategy, // Pass execution strategy (sequential: agents see each other, parallel: faster but no same-round responses)
      selectedExpertIds: selectedExpertIds, // Pass selected custom experts if provided
      checkDebateState: async () => {
        // Check debate state from DB before each round
        const [debate] = await db
          .select({ 
            metadata: quoorumDebates.metadata,
            context: quoorumDebates.context,
          })
          .from(quoorumDebates)
          .where(eq(quoorumDebates.id, debateId))
        
        if (!debate) {
          return { isPaused: false, forceConsensus: false, additionalContext: [] }
        }

        const metadata = (debate.metadata as any) || {}
        const context = (debate.context as any) || {}
        
        return {
          isPaused: metadata.paused === true,
          forceConsensus: metadata.forceConsensus === true,
          additionalContext: (context.additional || []).map((item: { content: string; addedAt: string }) => item.content),
        }
      },
      onProgress: async (progress) => {
        // Clear messages when starting a new round
        if (progress.phase === 'deliberating') {
          currentRoundMessages = [];
        }

        // Store estimated total rounds for use in onMessageGenerated
        if (progress.totalRounds) {
          estimatedTotalRounds = progress.totalRounds;

          // Log estimated rounds for debugging
          logger.info(`[Debate ${debateId}] Estimated rounds set to ${estimatedTotalRounds}`, {
            phase: progress.phase,
            currentRound: progress.currentRound,
          });
        }

        // Forward progress events to DB
        await updateProcessingStatus(
          debateId,
          userId,
          progress.phase,
          progress.message,
          progress.progress,
          progress.currentRound,
          progress.totalRounds,
          currentRoundMessages
        );
      },
      onMessageGenerated: async (message) => {
        // Log message generation
        logger.info(`[Debate ${debateId}] Message generated`, {
          round: message.round,
          agentKey: message.agentKey,
          agentName: message.agentName,
          model: message.modelId,
          contentLength: message.content.length,
        });

        // Add message to current round for real-time updates
        currentRoundMessages.push({
          agentKey: message.agentKey,
          agentName: message.agentName,
          model: message.modelId ?? 'unknown',
          content: message.content,
          timestamp: message.createdAt.toISOString(),
        });

        // Update processingStatus with new message
        await updateProcessingStatus(
          debateId,
          userId,
          'deliberating',
          `${message.agentName} está deliberando...`,
          // Calculate progress based on message position in round
          30 + Math.floor((50 / estimatedTotalRounds) * (message.round || 1)),
          message.round,
          estimatedTotalRounds, // Use estimated rounds instead of hardcoded 20
          currentRoundMessages
        );
      },
    })
    } else {
      // COMPLEX PATTERNS: Use DebateOrchestrator (tournament, adversarial, ensemble, etc.)
      // Each SubDebate in the orchestration uses runDynamicDebate internally (core + experts)
      const orchestrator = new DebateOrchestrator({
        patternMode: 'manual',
        preferredPattern: finalPattern,
        requireApproval: false, // Skip approval for API calls
        maxTotalCost: 10.0, // Max $10 per debate
        warnAtCost: 5.0,
        parallelLimit: 5, // Max 5 concurrent sub-debates
      })

      logger.info(`[Debate ${debateId}] Using orchestrated pattern: ${finalPattern}`, {
        pattern: finalPattern,
      })

      // Execute orchestrated sequence
      const sequence = await orchestrator.run(question, userId, {
        pattern: finalPattern,
        skipApproval: true,
      })

      // Adapt DebateSequence to DebateResult format for UI compatibility
      result = debateSequenceToResult(sequence, debateId)

      logger.info(`[Debate ${debateId}] Orchestrated debate completed`, {
        pattern: finalPattern,
        phases: sequence.results.length,
        totalCost: sequence.totalCost,
        status: sequence.status,
      })
    }

    // Event 5: Calculating consensus (85%)
    await updateProcessingStatus(
      debateId,
      userId,
      "calculating",
      "Calculando consenso y ranking final...",
      85
    );

    // Map result types
    const mappedExperts = result.experts?.map((e) => ({
      id: e.id,
      name: e.name,
      expertise: e.specializations ?? [],
    }));

    const mappedRanking = result.finalRanking?.map((r) => ({
      option: r.option,
      score: r.score ?? r.successRate ?? 0, // Use successRate if score is not set
      reasoning: r.reasoning,
    }));

    // Event 6: Finalizing (95%)
    await updateProcessingStatus(
      debateId,
      userId,
      "finalizing",
      "Finalizando y guardando resultados...",
      95
    );

    // Update debate with results
    // ⚠️ IMPORTANT: Respect result.status - could be 'failed' if execution failed
    const [currentDebate] = await db
      .select({ metadata: quoorumDebates.metadata })
      .from(quoorumDebates)
      .where(eq(quoorumDebates.id, debateId))
    
    const currentMetadata = (currentDebate?.metadata as any) || {}
    
    await db
      .update(quoorumDebates)
      .set({
        status: result.status === "failed" ? "failed" : "completed",
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
        metadata: {
          ...currentMetadata,
          pattern: finalPattern, // Save pattern used for execution
        },
      })
      .where(and(eq(quoorumDebates.id, debateId), eq(quoorumDebates.userId, userId)));

    // Event 7: Completed (100%)
    await updateProcessingStatus(
      debateId,
      userId,
      "completed",
      "Debate completado exitosamente",
      100,
      result.rounds.length,
      result.rounds.length
    );

    // Send notification to user
    try {
      // Get user email
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId));

      if (user?.email && mappedExperts) {
        // Convert experts to ExpertProfile format for notification
        const expertProfiles: ExpertProfile[] = mappedExperts.map((e) => ({
          id: e.id,
          name: e.name,
          title: e.expertise?.[0] || "Expert",
          role: e.expertise?.[0],
          expertise: e.expertise ?? [],
          topics: [],
          perspective: "",
          systemPrompt: "",
          temperature: 0.7,
          provider: "google" as const,
          modelId: "gemini-2.0-flash-exp",
        }));

        await notifyDebateComplete(
          userId,
          user.email,
          result,
          expertProfiles,
          { email: true, inApp: true, push: false } // Push notifications disabled for now
        );

        logger.info("Notification sent for completed debate", { debateId, userId });
      }
    } catch (notificationError) {
      // Don't fail the debate if notification fails
      logger.error(
        "Failed to send debate completion notification",
        notificationError instanceof Error ? notificationError : new Error(String(notificationError)),
        { debateId, userId }
      );
    }
  } catch (error) {
    logger.error(
      "Debate execution failed",
      error instanceof Error ? error : new Error(String(error)),
      { debateId }
    );

    await db
      .update(quoorumDebates)
      .set({
        status: "failed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(quoorumDebates.id, debateId), eq(quoorumDebates.userId, userId)));

    // Send failure notification
    try {
      const { notifyDebateFailed } = await import("./notifications.js");
      await notifyDebateFailed(userId, debateId);
      logger.info("Failure notification sent", { debateId, userId });
    } catch (notificationError) {
      logger.error(
        "Failed to send debate failure notification",
        notificationError instanceof Error ? notificationError : new Error(String(notificationError)),
        { debateId, userId }
      );
    }
  }
}

/**
 * Helper: Update processing status for UI cascade
 */
async function updateProcessingStatus(
  debateId: string,
  userId: string,
  phase: string,
  message: string,
  progress: number,
  currentRound?: number,
  totalRounds?: number,
  roundMessages?: Array<{
    agentKey: string;
    agentName: string;
    model: string;
    content: string;
    timestamp: string;
  }>
): Promise<void> {
  await db
    .update(quoorumDebates)
    .set({
      processingStatus: {
        phase,
        message,
        progress,
        currentRound,
        totalRounds,
        timestamp: new Date().toISOString(),
        roundMessages: roundMessages ?? [],
      },
      updatedAt: new Date(),
    })
    .where(and(eq(quoorumDebates.id, debateId), eq(quoorumDebates.userId, userId)));
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
