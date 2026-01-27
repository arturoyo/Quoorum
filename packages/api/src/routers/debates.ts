/**
 * Debates Router - User-facing debate creation and management
 *
 * This router provides debate functionality for regular authenticated users,
 * integrating with the context assessment system.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
import { router, protectedProcedure, expensiveRateLimitedProcedure } from "../trpc";
import { db } from "@quoorum/db";
import { quoorumDebates, users, userContextFiles as userContextFilesTable, profiles, companies, departments, workers, debateFrameworks, scenarios, scenarioUsage } from "@quoorum/db/schema";
import { runDynamicDebate, notifyDebateComplete, selectStrategy, DebateOrchestrator, buildCorporateContext, selectTheme, applyScenario, appliedScenarioToRunOptions } from "@quoorum/quoorum";
import { searchInternet } from "@quoorum/quoorum/context-loader";
import type { ExpertProfile, PatternType, DebateResult, DebateSequence } from "@quoorum/quoorum";
import { logger } from "../lib/logger";
import { systemLogger } from "../lib/system-logger";
import { inngest } from "../lib/inngest-client";
import { debateSequenceToResult } from "../lib/debate-orchestration-adapter";

// Import types from debates module
import type { DebateContext, ContextQuestion, ContextEvaluation, CorporateContext, DebateRecord, DebateMetadata, AdditionalContextItem } from "./debates/types";

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
      // IMPORTANT: quoorum_debates.user_id references profiles.id, not users.id
      // Find or create profile for this user
      let [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1);

      // If profile doesn't exist, create it
      if (!profile) {
        logger.warn('Profile not found for user, creating one', {
          userId: ctx.user.id,
          email: ctx.user.email
        });
        
        const [newProfile] = await db
          .insert(profiles)
          .values({
            userId: ctx.user.id, // Reference to users.id (Supabase Auth)
            email: ctx.user.email,
            name: ctx.user.name || ctx.user.email.split('@')[0],
            role: ctx.user.role || 'user',
            isActive: true,
          })
          .returning();
        
        if (!newProfile) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error al crear el perfil del usuario",
          });
        }
        
        profile = newProfile;
      }

      const profileId = profile.id; // Use profile.id for foreign key

      logger.info("Creating draft debate", {
        userId: ctx.user.id,
        profileId: profileId,
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
          userId: profileId, // Use profile.id, not users.id
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
        selectedExpertIds: z.array(z.string().min(1)).optional(), // IDs de expertos personalizados seleccionados por el usuario (pueden ser slugs como "april_dunford" o UUIDs)
        selectedDepartmentIds: z.array(z.string().uuid()).optional(), // IDs de departamentos corporativos seleccionados por el usuario
        selectedWorkerIds: z.array(z.string().uuid()).optional(), // IDs de profesionales que intervienen en el debate
        frameworkId: z.string().uuid().optional(), // ID del framework de decisión seleccionado (FODA, ROI, Delphi, etc.)
        scenarioId: z.string().uuid().optional(), // ID del escenario preconfigurado (Decision Playbook)
        scenarioVariables: z.record(z.string()).optional(), // Variables para el prompt template del escenario (ej: { user_input: "...", context: "..." })
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
      // IMPORTANT: quoorum_debates.user_id references profiles.id, not users.id
      // Find or create profile for this user
      let [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1);

      // If profile doesn't exist, create it
      if (!profile) {
        logger.warn('Profile not found for user, creating one', {
          userId: ctx.user.id,
          email: ctx.user.email
        });
        
        const [newProfile] = await db
          .insert(profiles)
          .values({
            userId: ctx.user.id, // Reference to users.id (Supabase Auth)
            email: ctx.user.email,
            name: ctx.user.name || ctx.user.email.split('@')[0],
            role: ctx.user.role || 'user',
            isActive: true,
          })
          .returning();
        
        if (!newProfile) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error al crear el perfil del usuario",
          });
        }
        
        profile = newProfile;
      }

      const profileId = profile.id; // Use profile.id for foreign key

      // ============================================================================
      // SCENARIO APPLICATION (if scenarioId provided)
      // ============================================================================
      let appliedScenario: ReturnType<typeof applyScenario> | null = null
      let finalQuestion = input.question
      let finalSelectedExpertIds = input.selectedExpertIds
      let finalSelectedDepartmentIds = input.selectedDepartmentIds
      let finalFrameworkId = input.frameworkId

      if (input.scenarioId) {
        // Load scenario from database
        const [scenario] = await db
          .select()
          .from(scenarios)
          .where(
            and(
              eq(scenarios.id, input.scenarioId),
              eq(scenarios.status, 'active')
            )
          )
          .limit(1)

        if (!scenario) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Escenario no encontrado o no está activo',
          })
        }

        // Check tier access
        // TODO: Implement tier checking based on user subscription

        // Apply scenario configuration
        const variableValues = {
          user_input: input.question, // Use question as user_input
          context: input.context,
          ...input.scenarioVariables,
        }

        try {
          appliedScenario = applyScenario(
            scenario as any, // Type assertion needed because DB schema doesn't match exactly
            variableValues
          )

          // Override debate configuration with scenario values
          finalQuestion = appliedScenario.masterPrompt
          finalSelectedExpertIds = appliedScenario.selectedExpertIds
          finalSelectedDepartmentIds = appliedScenario.selectedDepartmentIds
          finalFrameworkId = appliedScenario.frameworkId

          logger.info('Scenario applied to debate', {
            scenarioId: input.scenarioId,
            scenarioName: appliedScenario.scenarioName,
            expertIds: appliedScenario.selectedExpertIds,
          })
        } catch (scenarioError) {
          logger.error('Error applying scenario', scenarioError instanceof Error ? scenarioError : new Error(String(scenarioError)), {
            scenarioId: input.scenarioId,
          })
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Error al aplicar el escenario: ${scenarioError instanceof Error ? scenarioError.message : String(scenarioError)}`,
          })
        }
      }

      logger.info(input.draftId ? "Updating draft debate" : "Creating debate", {
        userId: ctx.user.id,
        profileId: profileId,
        question: finalQuestion.substring(0, 50),
        draftId: input.draftId,
        scenarioId: input.scenarioId,
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
            eq(userContextFilesTable.userId, ctx.userId), // Use ctx.userId (profile.id) - FK references profiles.id
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

      let debate: DebateRecord;

      // If draftId provided, update existing draft
      if (input.draftId) {
        // First, get existing debate to preserve title
        // Use profileId for the where clause (quoorum_debates.userId references profiles.id)
        const [existingDebate] = await db
          .select({ metadata: quoorumDebates.metadata })
          .from(quoorumDebates)
          .where(
            and(
              eq(quoorumDebates.id, input.draftId),
              eq(quoorumDebates.userId, profileId)
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
              eq(quoorumDebates.userId, profileId)
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
            userId: profileId, // Use profile.id, not users.id
            question: finalQuestion, // Use scenario's master prompt if scenario applied
            context: debateContext,
            mode: "dynamic",
            status: "pending",
            visibility: "private",
            metadata: {
              expertCount: input.expertCount,
              maxRounds: input.maxRounds,
              category: input.category,
              scenarioId: input.scenarioId, // Store scenario ID in metadata
              scenarioName: appliedScenario?.scenarioName,
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
      // If Inngest fails (e.g., API key not configured), fallback to inline execution
      // Use void to explicitly ignore the promise (fire-and-forget with error handling)
      void (async () => {
        try {
          await inngest.send({
            name: "quoorum/debate.created",
            data: {
              debateId: debate.id,
              userId: profileId, // Use profile.id for consistency
              question: input.question,
              context: debateContext,
              expertCount: input.expertCount,
              maxRounds: input.maxRounds,
            },
          });
          logger.info("Debate event sent to Inngest", { debateId: debate.id });
        } catch (inngestError) {
          // Inngest not configured or API key missing - log warning and continue with inline execution
          // This error should NOT block debate creation
          logger.warn("Inngest not available, using inline execution", {
            debateId: debate.id,
            error: inngestError instanceof Error ? inngestError.message : String(inngestError)
          });
        }
      })();

      // Save selected framework if provided (from scenario or direct input)
      if (finalFrameworkId) {
        try {
          await db.insert(debateFrameworks).values({
            debateId: debate.id,
            frameworkId: finalFrameworkId,
          });
          logger.info("Framework saved for debate", {
            debateId: debate.id,
            frameworkId: finalFrameworkId,
          });
        } catch (frameworkError) {
          // Log error but don't fail debate creation
          logger.warn("Failed to save framework for debate", {
            debateId: debate.id,
            frameworkId: finalFrameworkId,
            error: frameworkError instanceof Error ? frameworkError.message : String(frameworkError),
          });
        }
      }

      // Track scenario usage if scenario was applied (fire-and-forget)
      if (input.scenarioId && appliedScenario) {
        void (async () => {
          try {
            // Import scenarioUsage table directly
            const { scenarioUsage } = await import('@quoorum/db')
            const { sql } = await import('drizzle-orm')
            
            // Increment usage count
            await db
              .update(scenarios)
              .set({
                usageCount: sql`${scenarios.usageCount} + 1`,
              })
              .where(eq(scenarios.id, input.scenarioId!))

            // Create usage record
            await db
              .insert(scenarioUsage)
              .values({
                scenarioId: input.scenarioId!,
                debateId: debate.id,
                userId: profileId,
                variablesUsed: input.scenarioVariables || {},
              })
          } catch (trackError) {
            // Log but don't fail debate creation
            logger.warn("Failed to track scenario usage", {
              scenarioId: input.scenarioId,
              debateId: debate.id,
              error: trackError instanceof Error ? trackError.message : String(trackError),
            })
          }
        })()
      }

      // Also start debate inline (fallback if Inngest not configured or as primary method)
      logger.info("Starting debate execution", {
        debateId: debate.id,
        profileId,
        status: debate.status,
        hasInngest: true, // Inngest attempt was made (may have failed)
      });
      
      runDebateAsync(debate.id, profileId, finalQuestion, debateContext, input.executionStrategy, (input.pattern as PatternType | undefined), finalSelectedExpertIds, finalSelectedDepartmentIds, input.selectedWorkerIds).catch(
        (error: unknown) => {
          logger.error(
            "Error starting debate",
            error instanceof Error ? error : new Error(String(error)),
            { 
              debateId: debate.id,
              profileId,
              errorMessage: error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined,
            }
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
      // IMPORTANT: quoorum_debates.user_id references profiles.id, not users.id
      // Find profile for this user
      let [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1);

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Perfil de usuario no encontrado",
        });
      }

      const profileId = profile.id; // Use profile.id for foreign key

      // Use Drizzle ORM for local PostgreSQL
      const [debate] = await db
        .select()
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, profileId) // Use profileId, not ctx.user.id
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
      const startTime = Date.now();
      try {
        logger.info('[debates.list] Starting query', {
          userId: ctx.user.id,
          email: ctx.user.email,
          input,
        });

        // IMPORTANT: quoorum_debates.user_id references profiles.id, not users.id
        // Find profile for this user - optimizado con select solo de id
        const profileStartTime = Date.now();
        const [profile] = await db
          .select({ id: profiles.id })
          .from(profiles)
          .where(eq(profiles.email, ctx.user.email))
          .limit(1);

        const profileTime = Date.now() - profileStartTime;
        logger.info('[debates.list] Profile query completed', {
          profileTime,
          profileFound: !!profile,
        });

        if (!profile) {
          // If profile doesn't exist, return empty list (user has no debates yet)
          logger.info('[debates.list] No profile found, returning empty list');
          return [];
        }

        const profileId = profile.id; // Use profile.id for foreign key

        const conditions = [
          eq(quoorumDebates.userId, profileId), // Use profileId, not ctx.user.id
          isNull(quoorumDebates.deletedAt),
        ];

        if (input.status) {
          conditions.push(eq(quoorumDebates.status, input.status));
        }

        // Filtrar por tags si se proporcionan
        if (input.tags && input.tags.length > 0) {
          // Filtrar debates que tengan al menos uno de los tags especificados
          // Usar SQL para buscar en el array de tags dentro de metadata
          // PostgreSQL: usar EXISTS con jsonb_array_elements_text para cada tag
          const tagValues = input.tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
          if (tagValues.length > 0) {
            // Construir condición OR para cada tag
            const tagOrConditions = tagValues.map(tag => {
              // Usar sql.raw con escape seguro para el tag
              const escapedTag = tag.replace(/'/g, "''");
              return sql`EXISTS (
                SELECT 1 
                FROM jsonb_array_elements_text(${quoorumDebates.metadata}->'tags') AS tag_elem
                WHERE tag_elem = ${sql.raw(`'${escapedTag}'`)}
              )`;
            });
            
            // Combinar todas las condiciones con OR
            if (tagOrConditions.length === 1) {
              conditions.push(tagOrConditions[0]!);
            } else if (tagOrConditions.length > 1) {
              // Construir OR manualmente: (cond1 OR cond2 OR cond3)
              let combined = tagOrConditions[0]!;
              for (let i = 1; i < tagOrConditions.length; i++) {
                combined = sql`${combined} OR ${tagOrConditions[i]!}`;
              }
              conditions.push(sql`(${combined})`);
            }
          }
        }

        // Verificar que las condiciones no estén vacías antes de usar and()
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        const debatesStartTime = Date.now();
        // Optimizar: seleccionar solo campos necesarios en lugar de todos
        // Usar índice compuesto userCreatedIdx para mejor rendimiento
        const debates = await db
          .select({
            id: quoorumDebates.id,
            question: quoorumDebates.question,
            status: quoorumDebates.status,
            mode: quoorumDebates.mode,
            visibility: quoorumDebates.visibility,
            consensusScore: quoorumDebates.consensusScore,
            totalRounds: quoorumDebates.totalRounds,
            totalCostUsd: quoorumDebates.totalCostUsd,
            createdAt: quoorumDebates.createdAt,
            updatedAt: quoorumDebates.updatedAt,
            completedAt: quoorumDebates.completedAt,
            metadata: quoorumDebates.metadata, // Incluir metadata para tags
          })
          .from(quoorumDebates)
          .where(whereClause)
          .orderBy(desc(quoorumDebates.createdAt)) // Usa índice userCreatedIdx
          .limit(input.limit)
          .offset(input.offset);

        const debatesTime = Date.now() - debatesStartTime;
        const totalTime = Date.now() - startTime;
        
        logger.info('[debates.list] Query completed successfully', {
          debatesCount: debates.length,
          debatesTime,
          profileTime,
          totalTime,
        });

        return debates;
      } catch (error) {
        const totalTime = Date.now() - startTime;
        // Log detallado del error para debugging
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        systemLogger.error('[debates.list] Error', error instanceof Error ? error : new Error(errorMessage), {
          userId: ctx.user.id,
          email: ctx.user.email,
          input,
          errorMessage,
          errorStack: errorStack?.substring(0, 500), // Limitar stack trace
          totalTime,
        });
        
        // Lanzar error con mensaje específico
        throw new TRPCError({
          code: error instanceof TRPCError ? error.code : 'INTERNAL_SERVER_ERROR',
          message: error instanceof TRPCError 
            ? error.message 
            : `Error al obtener debates: ${errorMessage}`,
          cause: error,
        });
      }
    }),

  /**
   * List user's debates with cost information for usage tracking
   */
  listWithCosts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Get total count for pagination
        const countResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(quoorumDebates)
          .where(
            and(
              eq(quoorumDebates.userId, ctx.userId),
              isNull(quoorumDebates.deletedAt)
            )
          );

        const total = countResult[0]?.count ?? 0;

        // Get debates with cost fields
        const debates = await db
          .select({
            id: quoorumDebates.id,
            question: quoorumDebates.question,
            status: quoorumDebates.status,
            totalCostUsd: quoorumDebates.totalCostUsd,
            totalCreditsUsed: quoorumDebates.totalCreditsUsed,
            createdAt: quoorumDebates.createdAt,
          })
          .from(quoorumDebates)
          .where(
            and(
              eq(quoorumDebates.userId, ctx.userId),
              isNull(quoorumDebates.deletedAt)
            )
          )
          .orderBy(desc(quoorumDebates.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return {
          debates,
          total,
        };
      } catch (error) {
        systemLogger.error('[debates.listWithCosts] Error', error as Error, {
          userId: ctx.userId,
          input,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch debates with costs: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
            eq(quoorumDebates.userId, profileId) // Use profileId, not ctx.user.id
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
            eq(quoorumDebates.userId, profileId) // Use profileId, not ctx.user.id
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
            eq(quoorumDebates.userId, profileId) // Use profileId, not ctx.user.id
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
            eq(quoorumDebates.userId, profileId) // Use profileId, not ctx.user.id
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
   * Update tags for a debate
   */
  updateTags: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        tags: z.array(z.string()).min(0).max(20), // Máximo 20 tags
      })
    )
    .mutation(async ({ ctx, input }) => {
      // IMPORTANT: quoorum_debates.user_id references profiles.id, not users.id
      // Find profile for this user
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1);

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Perfil de usuario no encontrado",
        });
      }

      const profileId = profile.id; // Use profile.id for foreign key

      // Get existing debate to verify ownership
      const [existingDebate] = await db
        .select()
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, profileId) // Use profileId, not ctx.user.id
          )
        );

      if (!existingDebate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Debate no encontrado",
        });
      }

      // Update tags in metadata
      const currentMetadata = existingDebate.metadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        tags: input.tags.filter(tag => tag.trim().length > 0), // Remove empty tags
      };

      const [updatedDebate] = await db
        .update(quoorumDebates)
        .set({
          metadata: updatedMetadata,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, profileId)
          )
        )
        .returning();

      if (!updatedDebate) {
        logger.error("Database error updating debate tags");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al actualizar los tags del debate.",
        });
      }

      logger.info("[debates.updateTags] Tags updated", {
        debateId: input.id,
        tagsCount: input.tags.length,
      });

      return updatedDebate;
    }),

  /**
   * Delete a debate (soft delete)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // IMPORTANT: quoorum_debates.user_id references profiles.id, not users.id
      // Find profile for this user
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1);

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Perfil de usuario no encontrado",
        });
      }

      const profileId = profile.id; // Use profile.id for foreign key

      // Use Drizzle ORM directly for local PostgreSQL
      // Verify ownership first
      const [existingDebate] = await db
        .select({ id: quoorumDebates.id })
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, profileId) // Use profileId, not ctx.user.id
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
            eq(quoorumDebates.userId, profileId) // Use profileId, not ctx.user.id
          )
        );

      return { success: true };
    }),

  /**
   * Preview narrative theme for a debate question
   * Analyzes question and context to suggest appropriate theme
   */
  previewTheme: protectedProcedure
    .input(
      z.object({
        question: z.string().min(1, "La pregunta no puede estar vacía"),
        context: z.string().optional(),
      })
    )
    .query(({ input }) => {
      // Use Theme Engine to analyze question
      const themeSelection = selectTheme(input.question, input.context);

      return {
        themeId: themeSelection.themeId,
        themeName: themeSelection.theme.name,
        themeDescription: themeSelection.theme.description,
        themeEmoji: themeSelection.theme.emoji,
        reason: themeSelection.reason,
        confidence: themeSelection.confidence,
        shouldUseTheme: themeSelection.confidence >= 0.4, // Threshold check
      };
    }),

  /**
   * Export debate in multiple formats (PDF, PowerPoint, Excel, Markdown, JSON)
   */
  export: protectedProcedure
    .input(
      z.object({
        debateId: z.string().uuid(),
        format: z.enum(['pdf', 'powerpoint', 'excel', 'markdown', 'json']),
        includeFullTranscript: z.boolean().default(true),
        includeArgumentTree: z.boolean().default(false),
        includeConsensusTimeline: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get profile
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1)

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de usuario no encontrado',
        })
      }

      // Get debate
      const [debate] = await db
        .select()
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.debateId),
            eq(quoorumDebates.userId, profile.id)
          )
        )

      if (!debate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Debate no encontrado',
        })
      }

      // Convert debate to DebateResult format
      const debateResult: DebateResult = {
        sessionId: debate.id,
        question: debate.question,
        consensusScore: debate.consensusScore || 0,
        rounds: (debate.rounds as DebateRound[] | null) || [],
        finalRanking: (debate.finalRanking as RankedOption[] | null) || [],
        totalCostUsd: debate.totalCostUsd || 0,
        totalCreditsUsed: debate.totalCreditsUsed || 0,
      }

      // Get experts
      const experts: ExpertProfile[] = (debate.experts as Array<{
        id: string
        name: string
        expertise?: string[]
      }> | null)?.map((e) => ({
        id: e.id,
        name: e.name,
        title: e.expertise?.[0] || 'Expert',
        role: e.expertise?.[0],
        expertise: e.expertise || [],
        topics: [],
        perspective: '',
        systemPrompt: '',
        temperature: 0.7,
        provider: 'google' as const,
        modelId: 'gemini-2.0-flash-exp',
      })) || []

      // Export
      const { exportDebate } = await import('@quoorum/quoorum/export')
      const result = await exportDebate(debateResult, experts, {
        format: input.format,
        includeFullTranscript: input.includeFullTranscript,
        includeArgumentTree: input.includeArgumentTree,
        includeConsensusTimeline: input.includeConsensusTimeline,
      })

      // Return as base64 for client download
      if (Buffer.isBuffer(result.content)) {
        return {
          content: result.content.toString('base64'),
          mimeType: result.mimeType,
          filename: result.filename,
        }
      }

      return {
        content: result.content,
        mimeType: result.mimeType,
        filename: result.filename,
      }
    }),

  /**
   * Get argument tree for a debate
   */
  getArgumentTree: protectedProcedure
    .input(z.object({ debateId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get profile
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1)

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de usuario no encontrado',
        })
      }

      // Get debate
      const [debate] = await db
        .select()
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.debateId),
            eq(quoorumDebates.userId, profile.id)
          )
        )

      if (!debate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Debate no encontrado',
        })
      }

      if (debate.status !== 'completed') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El debate debe estar completado para generar el árbol de argumentos',
        })
      }

      // Convert to DebateResult
      const debateResult: DebateResult = {
        sessionId: debate.id,
        question: debate.question,
        consensusScore: debate.consensusScore || 0,
        rounds: (debate.rounds as DebateRound[] | null) || [],
        finalRanking: (debate.finalRanking as RankedOption[] | null) || [],
        totalCostUsd: debate.totalCostUsd || 0,
        totalCreditsUsed: debate.totalCreditsUsed || 0,
      }

      // Build argument tree
      const { buildArgumentTree } = await import('@quoorum/quoorum/argument-intelligence')
      const tree = await buildArgumentTree(debateResult)

      return tree
    }),

  /**
   * Get consensus timeline for a debate
   */
  getConsensusTimeline: protectedProcedure
    .input(z.object({ debateId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get profile
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1)

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de usuario no encontrado',
        })
      }

      // Get debate
      const [debate] = await db
        .select()
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.debateId),
            eq(quoorumDebates.userId, profile.id)
          )
        )

      if (!debate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Debate no encontrado',
        })
      }

      // Convert to DebateResult
      const debateResult: DebateResult = {
        sessionId: debate.id,
        question: debate.question,
        consensusScore: debate.consensusScore || 0,
        rounds: (debate.rounds as DebateRound[] | null) || [],
        finalRanking: (debate.finalRanking as RankedOption[] | null) || [],
        totalCostUsd: debate.totalCostUsd || 0,
        totalCreditsUsed: debate.totalCreditsUsed || 0,
      }

      // Generate timeline
      const { generateConsensusTimeline } = await import('@quoorum/quoorum/visualizations/consensus-timeline')
      const timeline = generateConsensusTimeline(debateResult)

      // Convert Map to object for JSON serialization
      return timeline.map((point) => ({
        ...point,
        expertAlignment: Object.fromEntries(point.expertAlignment),
      }))
    }),

  /**
   * Get decision evidence (governance certificate) for a debate
   */
  getEvidence: protectedProcedure
    .input(z.object({ debateId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get profile
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1)

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de usuario no encontrado',
        })
      }

      // Get debate
      const [debate] = await db
        .select()
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.debateId),
            eq(quoorumDebates.userId, profile.id)
          )
        )

      if (!debate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Debate no encontrado',
        })
      }

      if (debate.status !== 'completed') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El debate debe estar completado para generar evidencia de decisión',
        })
      }

      // Convert to DebateResult
      const debateResult: DebateResult = {
        sessionId: debate.id,
        question: debate.question,
        consensusScore: debate.consensusScore || 0,
        rounds: (debate.rounds as DebateRound[] | null) || [],
        finalRanking: (debate.finalRanking as RankedOption[] | null) || [],
        totalCostUsd: debate.totalCostUsd || 0,
        totalCreditsUsed: debate.totalCreditsUsed || 0,
      }

      // Generate evidence
      const { generateDecisionEvidence } = await import('@quoorum/quoorum/governance/decision-evidence')
      const evidence = await generateDecisionEvidence(debateResult)

      return evidence
    }),

  /**
   * Calculate quadratic vote for a debate
   */
  calculateQuadraticVote: protectedProcedure
    .input(
      z.object({
        debateId: z.string().uuid(),
        votes: z.record(
          z.string(), // expertId
          z.record(z.string(), z.number()) // option -> points
        ),
        votingMethod: z.enum(['quadratic', 'points']).default('quadratic'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get profile
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1)

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de usuario no encontrado',
        })
      }

      // Get debate
      const [debate] = await db
        .select()
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.debateId),
            eq(quoorumDebates.userId, profile.id)
          )
        )

      if (!debate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Debate no encontrado',
        })
      }

      // Extract options from debate
      const options: string[] = []
      if (debate.finalRanking) {
        const ranking = debate.finalRanking as RankedOption[]
        for (const opt of ranking) {
          options.push(typeof opt === 'string' ? opt : opt.option)
        }
      }

      if (options.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El debate no tiene opciones para votar',
        })
      }

      // Convert votes to Map format
      const votesMap = new Map<string, Map<string, number>>()
      for (const [expertId, allocations] of Object.entries(input.votes)) {
        const allocationsMap = new Map<string, number>()
        for (const [option, points] of Object.entries(allocations)) {
          allocationsMap.set(option, points)
        }
        votesMap.set(expertId, allocationsMap)
      }

      // Calculate vote
      if (input.votingMethod === 'quadratic') {
        const { calculateQuadraticVote } = await import('@quoorum/quoorum/voting/quadratic-voting')
        const result = calculateQuadraticVote(votesMap, options)
        return result
      } else {
        const { calculatePointsVote } = await import('@quoorum/quoorum/voting/quadratic-voting')
        const rankedOptions = calculatePointsVote(votesMap, options)
        return {
          rankedOptions,
          votes: [],
          totalVotes: votesMap.size,
          participationRate: 1.0,
        }
      }
    }),

  /**
   * Get dashboard stats for debates
   * Returns metrics that show the real business value of Quoorum
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    // Total debates
    // Use ctx.userId (profile.id) - quoorum_debates.user_id references profiles.id
    const allDebates = await db
      .select({ id: quoorumDebates.id })
      .from(quoorumDebates)
      .where(
        and(
          eq(quoorumDebates.userId, ctx.userId),
          isNull(quoorumDebates.deletedAt)
        )
      );

    const totalDebates = allDebates.length;

    // Completed debates with full data for metrics
    const completedDebatesData = await db
      .select({
        id: quoorumDebates.id,
        consensusScore: quoorumDebates.consensusScore,
        totalCostUsd: quoorumDebates.totalCostUsd,
        totalRounds: quoorumDebates.totalRounds,
        createdAt: quoorumDebates.createdAt,
        completedAt: quoorumDebates.completedAt,
      })
      .from(quoorumDebates)
      .where(
        and(
          eq(quoorumDebates.userId, ctx.userId),
          eq(quoorumDebates.status, "completed"),
          isNull(quoorumDebates.deletedAt)
        )
      );

    const completedCount = completedDebatesData.length;

    // Debates with consensus score for average calculation
    const debatesWithConsensus = completedDebatesData.filter(
      (d) => d.consensusScore !== null && d.consensusScore !== undefined
    );

    // Average consensus (0-100%)
    const avgConsensus =
      debatesWithConsensus.length > 0
        ? Math.round(
            debatesWithConsensus.reduce((sum, d) => sum + (d.consensusScore || 0), 0) /
              debatesWithConsensus.length * 100
          )
        : 0;

    // Consensus distribution (high >= 90%, medium 70-89%, low < 70%)
    const consensusDistribution = {
      high: debatesWithConsensus.filter((d) => (d.consensusScore || 0) >= 0.9).length,
      medium: debatesWithConsensus.filter(
        (d) => (d.consensusScore || 0) >= 0.7 && (d.consensusScore || 0) < 0.9
      ).length,
      low: debatesWithConsensus.filter((d) => (d.consensusScore || 0) < 0.7).length,
    };

    // Average duration (in minutes) - calculated from createdAt to completedAt
    const debatesWithDuration = completedDebatesData.filter(
      (d) => d.createdAt && d.completedAt
    );
    const avgDurationMinutes =
      debatesWithDuration.length > 0
        ? Math.round(
            debatesWithDuration.reduce((sum, d) => {
              if (!d.createdAt || !d.completedAt) return sum;
              const durationMs =
                new Date(d.completedAt).getTime() - new Date(d.createdAt).getTime();
              return sum + durationMs / (1000 * 60); // Convert to minutes
            }, 0) / debatesWithDuration.length
          )
        : 0;

    // Cost metrics
    const debatesWithCost = completedDebatesData.filter(
      (d) => d.totalCostUsd !== null && d.totalCostUsd !== undefined && d.totalCostUsd > 0
    );
    const totalCostUsd =
      debatesWithCost.reduce((sum, d) => sum + (d.totalCostUsd || 0), 0);
    const avgCostUsd =
      debatesWithCost.length > 0 ? totalCostUsd / debatesWithCost.length : 0;

    // Average rounds
    const debatesWithRounds = completedDebatesData.filter(
      (d) => d.totalRounds !== null && d.totalRounds !== undefined && d.totalRounds > 0
    );
    const avgRounds =
      debatesWithRounds.length > 0
        ? Math.round(
            debatesWithRounds.reduce((sum, d) => sum + (d.totalRounds || 0), 0) /
              debatesWithRounds.length
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
          eq(quoorumDebates.userId, ctx.userId),
          sql`${quoorumDebates.createdAt} >= ${startOfMonth.toISOString()}`,
          isNull(quoorumDebates.deletedAt)
        )
      );

    const thisMonthCount = thisMonthDebates.length;

    return {
      // Legacy fields (for backwards compatibility)
      totalDebates,
      completedDebates: completedCount,
      avgConsensus,
      thisMonth: thisMonthCount,
      // New value-focused metrics
      consensusDistribution,
      avgDurationMinutes,
      totalCostUsd,
      avgCostUsd,
      avgRounds,
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
            eq(quoorumDebates.userId, profileId) // Use profileId, not ctx.user.id
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
            eq(quoorumDebates.userId, profileId) // Use profileId, not ctx.user.id
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
            eq(quoorumDebates.userId, profileId) // Use profileId, not ctx.user.id
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
            eq(quoorumDebates.userId, profileId) // Use profileId, not ctx.user.id
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
            eq(quoorumDebates.userId, profileId) // Use profileId, not ctx.user.id
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
            eq(quoorumDebates.userId, profileId) // Use profileId, not ctx.user.id
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

      const currentContext = (debate.context as DebateContext) || {};
      const additionalContext: AdditionalContextItem[] = (currentContext.additional as AdditionalContextItem[]) || [];
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
            eq(quoorumDebates.userId, profileId) // Use profileId, not ctx.user.id
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
            eq(quoorumDebates.userId, profileId) // Use profileId, not ctx.user.id
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
            eq(quoorumDebates.userId, profileId) // Use profileId, not ctx.user.id
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

  /**
   * SISTEMA DE CONTEXTO INTELIGENTE - FASE 1
   * Genera preguntas críticas iniciales (3-4 esenciales)
   * USA CONTEXTO EXISTENTE para evitar preguntas redundantes
   */
  generateCriticalQuestions: protectedProcedure
    .input(
      z.object({
        question: z.string().min(10, "Question must be at least 10 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // ============================================================================
      // CREDIT DEDUCTION (before AI question generation)
      // ============================================================================
      // Get users.id from profile (ctx.userId is profiles.id)
      const { profiles } = await import("@quoorum/db/schema");
      const [profile] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(eq(profiles.id, ctx.userId))
        .limit(1);

      if (!profile) {
        logger.error("[Critical Questions] Profile not found", { profileId: ctx.userId });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Perfil no encontrado",
        });
      }

      const usersId = profile.userId; // This is users.id (for credit transactions)

      // Estimate cost: ~1500-3000 tokens = ~$0.00015-0.0003 USD = 3-6 créditos
      const QUESTION_GENERATION_COST_USD = 0.00025; // Conservative estimate
      const { deductCredits, hasSufficientCredits, convertUsdToCredits } = await import('@quoorum/quoorum/billing/credit-transactions');
      const QUESTION_GENERATION_CREDITS = convertUsdToCredits(QUESTION_GENERATION_COST_USD); // ~5 créditos

      // Check credits before generation
      const hasCredits = await hasSufficientCredits(usersId, QUESTION_GENERATION_CREDITS);
      if (!hasCredits) {
        throw new TRPCError({
          code: "PAYMENT_REQUIRED",
          message: `Créditos insuficientes. Se requieren ${QUESTION_GENERATION_CREDITS} créditos para generar preguntas críticas.`,
        });
      }

      // Deduct credits atomically BEFORE generation
      const deductionResult = await deductCredits(
        usersId,
        QUESTION_GENERATION_CREDITS,
        undefined, // No debateId for question generation
        'debate_creation', // Source: critical questions generation
        'Generación de preguntas críticas de contexto'
      );

      if (!deductionResult.success) {
        logger.error("[Critical Questions] Credit deduction failed", {
          userId: usersId,
          credits: QUESTION_GENERATION_CREDITS,
          error: deductionResult.error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al procesar el pago de créditos",
        });
      }

      logger.info("[Critical Questions] Credits deducted", {
        userId: usersId,
        credits: QUESTION_GENERATION_CREDITS,
        remainingCredits: deductionResult.remainingCredits,
      });

      logger.info("[Context Phase 1] Generating critical questions with existing context");

      try {
        const { getAIClient } = await import("@quoorum/ai");
        const aiClient = getAIClient();

        // ═══════════════════════════════════════════════════════════
        // CARGAR CONTEXTO EXISTENTE DEL USUARIO
        // ═══════════════════════════════════════════════════════════
        let existingContext = "";

        // 1. User Backstory (contexto personalizado)
        let backstory = null;
        try {
          const { userBackstory } = await import("@quoorum/db/schema");
          const [result] = await db
            .select()
            .from(userBackstory)
            .where(eq(userBackstory.userId, ctx.userId))
            .limit(1);
          backstory = result || null;
        } catch (error) {
          // Si la tabla no existe o hay un error, continuar sin backstory
          logger.warn('[debates.generateCriticalQuestions] Error fetching user backstory', { 
            error: error instanceof Error ? error.message : String(error) 
          });
        }

        if (backstory) {
          const parts: string[] = [];
          if (backstory.role) parts.push(`Rol: ${backstory.role.replace(/_/g, ' ')}`);
          if (backstory.companyName) parts.push(`Empresa: ${backstory.companyName}`);
          if (backstory.industry) parts.push(`Industria: ${backstory.industry}`);
          if (backstory.companySize) {
            const sizeLabels: Record<string, string> = {
              'solo': 'Solo (1 persona)',
              'small_2_10': 'Pequeña (2-10)',
              'medium_11_50': 'Mediana (11-50)',
              'large_50_plus': 'Grande (50+)',
            };
            parts.push(`Tamaño: ${sizeLabels[backstory.companySize] || backstory.companySize}`);
          }
          if (backstory.companyStage) parts.push(`Etapa: ${backstory.companyStage.replace(/_/g, ' ')}`);
          if (backstory.decisionStyle) parts.push(`Estilo de decisión: ${backstory.decisionStyle.replace(/_/g, ' ')}`);
          if (backstory.additionalContext) parts.push(`Contexto adicional: ${backstory.additionalContext}`);

          if (parts.length > 0) {
            existingContext += `\n\n📋 PERFIL DEL USUARIO:\n${parts.join(' | ')}\n`;
          }
        }

        // 2. Company Context (descripción de la empresa)
        const { companies } = await import("@quoorum/db/schema");
        const [company] = await db
          .select()
          .from(companies)
          .where(and(eq(companies.userId, ctx.userId), eq(companies.isActive, true)))
          .limit(1);

        if (company) {
          existingContext += `\n\n🏢 EMPRESA:\n`;
          existingContext += `Nombre: ${company.name}\n`;
          if (company.industry) existingContext += `Industria: ${company.industry}\n`;
          if (company.size) existingContext += `Tamaño: ${company.size}\n`;
          if (company.description) existingContext += `Descripción: ${company.description}\n`;
          if (company.context) existingContext += `Contexto: ${company.context}\n`;
        }

        // 3. Departments Context (contextos de departamentos)
        const { departments } = await import("@quoorum/db/schema");
        const userDepartments = company
          ? await db
              .select()
              .from(departments)
              .where(and(eq(departments.companyId, company.id), eq(departments.isActive, true)))
          : [];

        if (userDepartments.length > 0) {
          existingContext += `\n\n🏛️ DEPARTAMENTOS (${userDepartments.length}):\n`;
          userDepartments.forEach((dept) => {
            existingContext += `- ${dept.name}: ${dept.departmentContext.substring(0, 150)}${dept.departmentContext.length > 150 ? '...' : ''}\n`;
          });
        }

        // Construir mensaje de contexto para la IA
        const contextMessage = existingContext
          ? `\n\n⚠️ CONTEXTO EXISTENTE DEL USUARIO (NO PREGUNTES ESTO):${existingContext}\n\nIMPORTANTE: NO generes preguntas sobre información que YA está en el contexto existente. En su lugar, PROFUNDIZA en aspectos específicos relacionados con la pregunta del usuario que NO estén cubiertos.`
          : "";

        const systemPrompt = `Eres un experto en recopilar contexto para decisiones estratégicas.

OBJETIVO: Generar 3-4 preguntas ESPECÍFICAS, DINÁMICAS y ÚNICAS basadas en la pregunta concreta del usuario.

⚠️ REGLAS CRÍTICAS:
1. Las preguntas DEBEN ser ESPECÍFICAS a la pregunta del usuario, NO genéricas
2. Cada pregunta debe ser ÚNICA y diferente de las otras (no repetir el mismo concepto)
3. Varía el enfoque: una puede ser sobre recursos, otra sobre timing, otra sobre métricas, etc.
4. NO uses la misma pregunta con diferentes palabras

PROCESO:
1. ANALIZA la pregunta del usuario para entender:
   - ¿Qué tipo de decisión es? (lanzamiento, estrategia, inversión, producto, etc.)
   - ¿Qué información específica falta para tomar esa decisión?
   - ¿Qué aspectos únicos de esa decisión necesitan clarificación?

2. GENERA preguntas ESPECÍFICAS y ÚNICAS relacionadas con esa decisión concreta:
   - Si la pregunta es sobre "lanzar al mercado" → Pregunta sobre canales, propuesta de valor, competencia, recursos de marketing
   - Si la pregunta es sobre "inversión" → Pregunta sobre términos, valoración, uso de fondos, tracción
   - Si la pregunta es sobre "producto" → Pregunta sobre features, usuarios objetivo, diferenciación
   - Si la pregunta es sobre "estrategia" → Pregunta sobre objetivos específicos, recursos, timeline, métricas

3. ❌ NUNCA uses preguntas genéricas que se aplican a cualquier decisión:
   - ❌ "¿Cuál es el objetivo principal?" (genérico, ya está en la pregunta)
   - ❌ "¿En qué etapa está tu negocio?" (genérico, no específico a la decisión)
   - ❌ "¿Tienes restricciones de presupuesto o tiempo?" (genérico, no específico)
   - ✅ En su lugar, pregunta aspectos ESPECÍFICOS de la decisión concreta

4. ⚠️ ANTI-DUPLICACIÓN: Asegúrate de que cada pregunta:
   - Aborda un aspecto DIFERENTE de la decisión
   - No repite el mismo concepto con otras palabras
   - Varía el tipo de información que busca (cuantitativa vs cualitativa, corto plazo vs largo plazo, etc.)

EJEMPLOS DE PREGUNTAS ESPECÍFICAS vs GENÉRICAS:

Pregunta del usuario: "¿Cuál es la mejor estrategia para lanzar Quoorum al mercado?"

❌ GENÉRICAS (NO usar):
- "¿Cuál es el objetivo principal que quieres lograr?" (ya está en la pregunta)
- "¿En qué etapa está tu negocio?" (genérico)
- "¿Tienes restricciones de presupuesto o tiempo?" (genérico)

✅ ESPECÍFICAS Y ÚNICAS (usar):
- "¿Qué canales de marketing específicos estás considerando para el lanzamiento?" (free_text, long) - Enfoque: canales
- "¿Cuál es tu propuesta de valor única que te diferencia de la competencia?" (free_text, long) - Enfoque: diferenciación
- "¿Qué presupuesto de marketing tienes asignado para el lanzamiento?" (free_text, short) - Enfoque: recursos
- "¿Has validado la demanda del mercado con usuarios potenciales?" (yes_no) - Enfoque: validación

Pregunta del usuario: "¿Debería invertir en esta startup?"

❌ GENÉRICAS (NO usar):
- "¿Cuál es tu objetivo?" (genérico)
- "¿En qué etapa está tu negocio?" (genérico)

✅ ESPECÍFICAS Y ÚNICAS (usar):
- "¿Qué términos específicos te están proponiendo?" (free_text, short) - Enfoque: términos
- "¿Qué valoración tiene la startup?" (free_text, short) - Enfoque: valoración
- "¿En qué usarán los fondos?" (free_text, long) - Enfoque: uso de fondos
- "¿Qué tracción tienen actualmente?" (free_text, long) - Enfoque: tracción

TIPO DE RESPUESTA:
- "yes_no": SOLO cuando la respuesta binaria es suficiente (ej: "¿Ya tienes producto en el mercado?")
- "multiple_choice": Cuando hay opciones claras y limitadas (2-4 opciones)
- "free_text": PREFERIR cuando se necesita contexto (mayoría de casos)
  - "short": Una línea (ej: "¿Cuánto presupuesto?")
  - "long": Párrafo (ej: "Describe tu estrategia de diferenciación")

⚠️ CONTEXTO EXISTENTE: El usuario ya proporcionó información sobre perfil, empresa y departamentos. NO preguntes información que YA está disponible. PROFUNDIZA en aspectos específicos de la decisión.

⚠️ UNICIDAD: Cada pregunta debe ser única. Si generas dos preguntas similares, combínalas en una o elimina una.

RESPONDE JSON (sin markdown):
[
  {
    "id": "critical_1",
    "priority": "critical",
    "questionType": "yes_no" | "multiple_choice" | "free_text",
    "content": "Pregunta ESPECÍFICA y ÚNICA relacionada con la decisión concreta del usuario",
    "options": ["Op1", "Op2"], // Solo si questionType === "multiple_choice"
    "expectedAnswerType": "short" | "long" // Solo si questionType === "free_text"
  }
]`;

        const userPrompt = `Pregunta del usuario: "${input.question}"${contextMessage}

ANÁLISIS REQUERIDO:
1. Analiza la pregunta del usuario para entender qué tipo de decisión es
2. Identifica qué información ESPECÍFICA falta para tomar esa decisión concreta
3. Genera 3-4 preguntas ESPECÍFICAS relacionadas con esa decisión, NO genéricas

IMPORTANTE: Las preguntas deben ser únicas y específicas a esta decisión. NO uses plantillas genéricas.`;

        const response = await aiClient.generateWithSystem(
          systemPrompt,
          userPrompt,
          {
            modelId: "gemini-2.0-flash-exp",
            temperature: 0.9, // Aumentado para más creatividad y especificidad
            maxTokens: 1200, // Aumentado para permitir preguntas más detalladas
            responseFormat: "json",
          }
        );

        const questions = parseQuestions(response.text, "critical");
        logger.info("[Context Phase 1] Success", { 
          count: questions.length,
          hasBackstory: !!backstory,
          hasCompany: !!company,
          departmentCount: userDepartments.length,
          creditsDeducted: QUESTION_GENERATION_CREDITS,
          remainingCredits: deductionResult.remainingCredits,
        });
        // Retornar preguntas con metadata de créditos deducidos
        // El frontend puede usar esto para actualizar el contador de créditos
        return {
          questions,
          creditsDeducted: QUESTION_GENERATION_CREDITS,
          remainingCredits: deductionResult.remainingCredits ?? 0,
        };
      } catch (error) {
        logger.error("[Context Phase 1] Failed", { error });
        // En caso de error, retornar preguntas fallback sin deducir créditos adicionales
        // (ya se dedujeron antes del error, así que no deducir de nuevo)
        const fallbackQuestions = getFallbackCriticalQuestions();
        return {
          questions: fallbackQuestions,
          creditsDeducted: QUESTION_GENERATION_CREDITS, // Ya se dedujeron antes
          remainingCredits: deductionResult.remainingCredits ?? 0,
        };
      }
    }),

  /**
   * VALIDAR RELEVANCIA DE RESPUESTA
   * Verifica si una respuesta es relevante a la pregunta y solicita explicación si no lo es
   */
  validateAnswerRelevance: protectedProcedure
    .input(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
        previousAnswers: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      logger.info("[Answer Validation] Validating relevance", {
        questionLength: input.question.length,
        answerLength: input.answer.length,
      });

      // ============================================================================
      // CREDIT DEDUCTION (before AI validation)
      // ============================================================================
      // Get users.id from profile (ctx.userId is profiles.id)
      const { profiles } = await import("@quoorum/db/schema");
      const [profile] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(eq(profiles.id, ctx.userId))
        .limit(1);

      if (!profile) {
        logger.error("[Answer Validation] Profile not found", { profileId: ctx.userId });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Perfil no encontrado",
        });
      }

      const usersId = profile.userId; // This is users.id (for credit transactions)

      // Estimate cost: ~300-600 tokens (prompt + response) = ~$0.00003-0.00006 USD = 1 crédito
      const VALIDATION_COST_USD = 0.00005; // Conservative estimate
      const { deductCredits, hasSufficientCredits, convertUsdToCredits } = await import('@quoorum/quoorum/billing/credit-transactions');
      const VALIDATION_CREDITS = convertUsdToCredits(VALIDATION_COST_USD); // ~1 crédito

      // Check credits before validation
      const hasCredits = await hasSufficientCredits(usersId, VALIDATION_CREDITS);
      if (!hasCredits) {
        throw new TRPCError({
          code: "PAYMENT_REQUIRED",
          message: `Créditos insuficientes. Se requieren ${VALIDATION_CREDITS} créditos para validar la respuesta.`,
        });
      }

      // Deduct credits atomically BEFORE validation
      const deductionResult = await deductCredits(
        usersId,
        VALIDATION_CREDITS,
        undefined, // No debateId for answer validation
        'debate_creation', // Source: context question validation
        'Validación de respuesta de contexto'
      );

      if (!deductionResult.success) {
        logger.error("[Answer Validation] Credit deduction failed", {
          userId: usersId,
          credits: VALIDATION_CREDITS,
          error: deductionResult.error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al procesar el pago de créditos",
        });
      }

      logger.info("[Answer Validation] Credits deducted", {
        userId: usersId,
        credits: VALIDATION_CREDITS,
        remainingCredits: deductionResult.remainingCredits,
      });

      try {
        const { getAIClient } = await import("@quoorum/ai");
        const aiClient = getAIClient();

        const systemPrompt = `Eres un validador experto de respuestas en contexto de decisiones estratégicas.

TAREA: Evaluar si una respuesta es RELEVANTE y ÚTIL para la pregunta. Sé permisivo con respuestas que expresan análisis o búsqueda de información.

CRITERIOS:
1. RELEVANCIA: La respuesta debe estar relacionada con la pregunta y tener conexión lógica. No debe ser completamente fuera de tema.

2. NO MARQUES COMO VAGA (isVague: false) si la respuesta:
   - Menciona que está analizando, evaluando opciones, considerando riesgos/beneficios o consecuencias
   - Expresa que busca recomendación fundamentada, datos, mejores prácticas o contexto
   - Tiene más de ~80 caracteres y aporta intención clara (aunque sea en términos generales)
   - Incluye frases como "estoy analizando", "necesito evaluar", "quiero entender", "busco una recomendación", "considerando los riesgos", "objetivos que estoy considerando"
   Estas respuestas son VÁLIDAS y útiles para el debate. No exijas exhaustividad.

3. SÍ MARCA COMO VAGA solo si:
   - Es literalmente "Sí", "No", "Tal vez", "Depende", "No sé" sin ninguna explicación adicional
   - Tiene menos de 25 caracteres cuando la pregunta pide explicación o ejemplos
   - No aporta ninguna intención ni contexto (ej. "Es importante" sin más)

4. isTooShort: true solo si la respuesta tiene menos de 15 caracteres y la pregunta pide desarrollo.

5. Respuestas evasivas: "No tengo claro" o "No estoy seguro" SIN intentar responder ni dar dirección. Si añaden algo útil, no marques evasive.

RESPONDE JSON:
{
  "isRelevant": true/false,
  "relevanceScore": 0-100,
  "isVague": true/false,
  "isTooShort": true/false,
  "reasoning": "Explicación breve",
  "requiresExplanation": true/false,
  "suggestion": "Sugerencia solo si hay mejora clara; si la respuesta es aceptable, cadena vacía",
  "qualityIssues": []
}`;

        // Construir contexto de respuestas anteriores para detectar contradicciones
        const previousContext = input.previousAnswers && Object.keys(input.previousAnswers).length > 0
          ? `\n\nRespuestas anteriores del usuario:\n${Object.entries(input.previousAnswers)
              .map(([qId, ans]) => `- ${ans}`)
              .join('\n')}\n\nVerifica si esta nueva respuesta contradice información previa.`
          : ''

        const response = await aiClient.generateWithSystem(
          systemPrompt,
          `Pregunta: "${input.question}"\n\nRespuesta del usuario: "${input.answer}"${previousContext}\n\nEvalúa la relevancia, utilidad y calidad de esta respuesta.`,
          {
            modelId: "gemini-2.0-flash-exp",
            temperature: 0.3, // Baja temperatura para validación más estricta
            maxTokens: 600,
            responseFormat: "json",
          }
        );

        let validation;
        try {
          let cleanedText = response.text.trim();
          if (cleanedText.startsWith("```json")) {
            cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
          } else if (cleanedText.startsWith("```")) {
            cleanedText = cleanedText.replace(/```\n?/g, "");
          }
          validation = JSON.parse(cleanedText);
        } catch (parseError) {
          logger.error("[Answer Validation] Failed to parse response", { error: parseError });
          // Fallback: asumir relevante si no se puede parsear
          validation = {
            isRelevant: true,
            relevanceScore: 50,
            reasoning: "No se pudo validar automáticamente, se asume relevante",
            requiresExplanation: false,
            suggestion: "",
          };
        }

        let isVague = validation.isVague ?? false;
        let qualityIssues = Array.isArray(validation.qualityIssues) ? validation.qualityIssues : [];
        const relevanceScore = validation.relevanceScore ?? 50;

        // Override: respuestas largas y razonablemente relevantes no se consideran vagas
        if (isVague && input.answer.length >= 80 && relevanceScore >= 55) {
          isVague = false;
          qualityIssues = qualityIssues.filter((q) => q !== "vague" && q !== "generic");
        }

        logger.info("[Answer Validation] Success", {
          isRelevant: validation.isRelevant,
          score: relevanceScore,
          isVague,
        });

        return {
          isRelevant: validation.isRelevant ?? true,
          relevanceScore,
          isVague,
          isTooShort: validation.isTooShort ?? false,
          reasoning: validation.reasoning || "",
          requiresExplanation: validation.requiresExplanation ?? false,
          suggestion: validation.suggestion || "",
          qualityIssues,
          creditsDeducted: VALIDATION_CREDITS,
          remainingCredits: deductionResult.remainingCredits ?? 0,
        };
      } catch (error) {
        logger.error("[Answer Validation] Failed", { error });
        // Fallback: asumir relevante en caso de error
        return {
          isRelevant: true,
          relevanceScore: 50,
          reasoning: "Error al validar, se asume relevante",
          requiresExplanation: false,
          suggestion: "",
        };
      }
    }),

  /**
   * SISTEMA DE CONTEXTO INTELIGENTE - EVALUACIÓN
   * Evalúa calidad (score 0-100) y genera follow-ups dinámicos
   * Incluye contexto de internet si está disponible
   */
  evaluateContextQuality: protectedProcedure
    .input(
      z.object({
        question: z.string().min(10),
        answers: z.record(z.string()),
        currentPhase: z.enum(["critical", "deep", "refine"]).default("critical"),
        internetContext: z.string().nullish(),
        totalAnswersCount: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // ============================================================================
      // CREDIT DEDUCTION (before AI evaluation)
      // ============================================================================
      // Get users.id from profile (ctx.userId is profiles.id)
      const { profiles } = await import("@quoorum/db/schema");
      const [profile] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(eq(profiles.id, ctx.userId))
        .limit(1);

      if (!profile) {
        logger.error("[Context Evaluation] Profile not found", { profileId: ctx.userId });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Perfil no encontrado",
        });
      }

      const usersId = profile.userId; // This is users.id (for credit transactions)

      // Estimate cost: ~1000-2000 tokens = ~$0.0001-0.0002 USD = 2-4 créditos
      const EVALUATION_COST_USD = 0.00015; // Conservative estimate
      const { deductCredits, hasSufficientCredits, convertUsdToCredits } = await import('@quoorum/quoorum/billing/credit-transactions');
      const EVALUATION_CREDITS = convertUsdToCredits(EVALUATION_COST_USD); // ~3 créditos

      // Check credits before evaluation
      const hasCredits = await hasSufficientCredits(usersId, EVALUATION_CREDITS);
      if (!hasCredits) {
        throw new TRPCError({
          code: "PAYMENT_REQUIRED",
          message: `Créditos insuficientes. Se requieren ${EVALUATION_CREDITS} créditos para evaluar el contexto.`,
        });
      }

      // Deduct credits atomically BEFORE evaluation
      const deductionResult = await deductCredits(
        usersId,
        EVALUATION_CREDITS,
        undefined, // No debateId for context evaluation
        'debate_creation', // Source: context quality evaluation
        'Evaluación de calidad de contexto'
      );

      if (!deductionResult.success) {
        logger.error("[Context Evaluation] Credit deduction failed", {
          userId: usersId,
          credits: EVALUATION_CREDITS,
          error: deductionResult.error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al procesar el pago de créditos",
        });
      }

      logger.info("[Context Evaluation] Credits deducted", {
        userId: usersId,
        credits: EVALUATION_CREDITS,
        remainingCredits: deductionResult.remainingCredits,
      });

      const totalAnswers = input.totalAnswersCount ?? Object.keys(input.answers).length;
      const maxAnswers = 8;
      // Máximo 8 respuestas y solo 1 ronda de follow-ups (critical → deep). No deep → refine.
      const noMoreFollowUps =
        totalAnswers >= maxAnswers ||
        input.currentPhase === "refine" ||
        input.currentPhase === "deep";

      logger.info("[Context Evaluation] Evaluating quality", {
        hasInternetContext: !!input.internetContext,
        totalAnswers,
        noMoreFollowUps,
      });

      try {
        const { getAIClient } = await import("@quoorum/ai");
        const aiClient = getAIClient();

        const contextSummary = Object.entries(input.answers)
          .map(([id, answer]) => `${id}: ${answer}`)
          .join("\n");

        const fullContextSummary = input.internetContext
          ? `${contextSummary}\n\n--- CONTEXTO DE INTERNET ---\n${input.internetContext}`
          : contextSummary;

        const systemPrompt = `Eres evaluador experto de contexto para decisiones estratégicas.

TAREA:
1. Evalúa calidad del contexto (score 0-100)
2. Identifica qué FALTA o está incompleto
3. Genera 2-3 preguntas follow-up SOLO si hace falta

SCORE 0-100:
- 0-40: Insuficiente - faltan aspectos críticos
- 40-60: Básico - suficiente para empezar
- 60-80: Bueno - suficiente para deliberar
- 80-100: Excelente - información completa

REGLA: Si el usuario ya ha respondido 6 o más preguntas O el score es >= 60, pon "shouldContinue": false y "followUpQuestions": [].
Solo genera más preguntas si falta algo CRÍTICO (score < 50) y hay menos de 6 respuestas.

FASE: ${input.currentPhase}
RESPUESTAS YA DADAS: ${totalAnswers}

RESPONDE JSON:
{
  "score": 75,
  "reasoning": "Explicación breve",
  "missingAspects": ["Falta X", "Falta Y"],
  "shouldContinue": true,
  "followUpQuestions": [
    {
      "id": "deep_1",
      "priority": "high",
      "questionType": "yes_no",
      "content": "Pregunta",
      "options": []
    }
  ]
}`;

        const response = await aiClient.generateWithSystem(
          systemPrompt,
          `Pregunta: "${input.question}"\n\nContexto:\n${fullContextSummary}\n\nEvalúa y genera 2-3 follow-ups solo si es necesario.`,
          {
            modelId: "gemini-2.0-flash-exp",
            temperature: 0.6,
            maxTokens: 1000,
            responseFormat: "json",
          }
        );

        let evaluation = parseEvaluation(response.text);
        if (noMoreFollowUps) {
          evaluation = {
            ...evaluation,
            shouldContinue: false,
            followUpQuestions: [],
          };
          logger.info("[Context Evaluation] Capped follow-ups", { totalAnswers, phase: input.currentPhase });
        }
        logger.info("[Context Evaluation] Success", { 
          score: evaluation.score,
          creditsDeducted: EVALUATION_CREDITS,
          remainingCredits: deductionResult.remainingCredits,
        });
        return {
          ...evaluation,
          creditsDeducted: EVALUATION_CREDITS,
          remainingCredits: deductionResult.remainingCredits ?? 0,
        };
      } catch (error) {
        logger.error("[Context Evaluation] Failed", { error });
        return getFallbackEvaluation();
      }
    }),

  /**
   * LEGACY: Generate dynamic contextual questions
   * Mantener compatibilidad con código existente
   */
  generateContextualQuestions: protectedProcedure
    .input(
      z.object({
        question: z.string().min(10, "Question must be at least 10 characters"),
        context: z.string().optional(),
        mode: z.enum(['quick', 'deep']).optional().default('deep'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      logger.info("[Contextual Questions] Generating dynamic questions", {
        userId: ctx.userId,
        questionLength: input.question.length,
        mode: input.mode,
      });

      try {
        const { getAIClient } = await import("@quoorum/ai");
        const aiClient = getAIClient();

        // Get user backstory for personalization
        let backstory = null;
        try {
          const { userBackstory } = await import("@quoorum/db/schema");
          const [result] = await db
            .select()
            .from(userBackstory)
            .where(eq(userBackstory.userId, ctx.userId))
            .limit(1);
          backstory = result || null;
        } catch (error) {
          // Si la tabla no existe o hay un error, continuar sin backstory
          logger.warn('[debates.generateCriticalQuestions] Error fetching user backstory', { 
            error: error instanceof Error ? error.message : String(error) 
          });
        }

        // Build backstory context string
        let backstoryContext = "";
        if (backstory) {
          const parts: string[] = [];
          if (backstory.role) {
            parts.push(`Rol: ${backstory.role.replace(/_/g, ' ')}`);
          }
          if (backstory.companyName) {
            parts.push(`Empresa: ${backstory.companyName}`);
          }
          if (backstory.industry) {
            parts.push(`Industria: ${backstory.industry}`);
          }
          if (backstory.companySize) {
            const sizeLabels: Record<string, string> = {
              'solo': 'Solo (1 persona)',
              'small_2_10': 'Pequeña (2-10)',
              'medium_11_50': 'Mediana (11-50)',
              'large_50_plus': 'Grande (50+)',
            };
            parts.push(`Tamaño: ${sizeLabels[backstory.companySize] || backstory.companySize}`);
          }
          if (backstory.companyStage) {
            parts.push(`Etapa: ${backstory.companyStage.replace(/_/g, ' ')}`);
          }
          if (backstory.decisionStyle) {
            parts.push(`Estilo de decisión: ${backstory.decisionStyle.replace(/_/g, ' ')}`);
          }

          if (parts.length > 0) {
            backstoryContext = `\n\nPERFIL DEL USUARIO:\n${parts.join(' | ')}`;
            if (backstory.additionalContext) {
              backstoryContext += `\nContexto adicional: ${backstory.additionalContext}`;
            }
          }
        }

        const questionCount = input.mode === 'quick' ? '1 pregunta' : '3-5 preguntas';
        const modeInstructions = input.mode === 'quick'
          ? 'MODO RÁPIDO: Genera SOLO 1 pregunta, la más crítica y esencial para entender el contexto.'
          : 'MODO PROFUNDO: Genera 3-5 preguntas para obtener contexto completo.';

        const systemPrompt = `Eres un asistente que ayuda a recopilar contexto para debates estratégicos.

${modeInstructions}

Analiza la pregunta del usuario y genera ${questionCount} contextual${input.mode === 'quick' ? '' : 'es'} DINÁMICA${input.mode === 'quick' ? '' : 'S'}:

1. **Decide el tipo de interacción**:
   - "question": Pregunta directa que necesita respuesta
   - "assumption": Suposición inteligente que el usuario valida

2. **Decide el tipo de respuesta óptimo**:
   - "yes_no": Para preguntas binarias obvias (¿Ya has intentado X? ¿Tienes presupuesto?)
   - "multiple_choice": Para opciones claras y limitadas (¿Qué industria? ¿Qué tamaño de equipo?)
   - "free_text": Para respuestas abiertas y complejas (¿Cuál es tu estrategia actual?)

3. **Sé inteligente**:
   - Si algo es obvio, ASÚMELO y pregunta "¿Correcto?" (assumption + yes_no)
   - Si hay opciones claras (2-4), usa multiple_choice con botones
   - Solo usa free_text cuando realmente necesites detalles

4. **Ordena por importancia**: Pregunta lo más crítico primero.

5. **Personaliza según el perfil del usuario**: Usa la información del perfil para:
   - NO preguntar lo que ya sabemos (industria, tamaño, etc.)
   - Ajustar el lenguaje y nivel de detalle según su rol y estilo
   - Hacer suposiciones inteligentes basadas en su contexto

RESPONDE SOLO CON JSON VÁLIDO (sin markdown, sin explicaciones):
[
  {
    "type": "question" | "assumption",
    "questionType": "yes_no" | "multiple_choice" | "free_text",
    "content": "Texto de la pregunta/suposición",
    "options": ["Opción 1", "Opción 2", ...] // Solo si questionType === "multiple_choice"
  }
]${backstoryContext}`;

        const userPrompt = `Pregunta del usuario: "${input.question}"
${input.context ? `\nContexto adicional: "${input.context}"` : ""}

Genera ${questionCount} contextual${input.mode === 'quick' ? '' : 'es'} DINÁMICA${input.mode === 'quick' ? '' : 'S'} con tipos de respuesta óptimos.
${input.mode === 'quick' ? 'Recuerda: SOLO 1 pregunta, la más esencial.' : ''}
${backstory ? 'IMPORTANTE: Ya conoces al usuario (perfil arriba), NO preguntes lo obvio.' : ''}`;

        const response = await aiClient.generateWithSystem(
          systemPrompt,
          userPrompt,
          {
            modelId: "gemini-2.0-flash-exp",
            temperature: 0.7,
            maxTokens: 1000,
            responseFormat: "json",
          }
        );

        // Parse and validate response
        let questions;
        try {
          // Remove markdown code blocks if present
          let cleanedText = response.text.trim();
          if (cleanedText.startsWith("```json")) {
            cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
          } else if (cleanedText.startsWith("```")) {
            cleanedText = cleanedText.replace(/```\n?/g, "");
          }

          questions = JSON.parse(cleanedText);

          // Validate structure
          if (!Array.isArray(questions)) {
            throw new Error("Response is not an array");
          }

          // Validate each question has required fields
          questions = questions.map((q: ContextQuestion) => ({
            type: q.type || "question",
            questionType: q.questionType || "free_text",
            content: q.content || q.question || "",
            options: q.questionType === "multiple_choice" ? q.options || [] : undefined,
          }));

        } catch (parseError) {
          logger.error("[Contextual Questions] Failed to parse AI response", {
            error: parseError instanceof Error ? parseError.message : String(parseError),
            rawResponse: response.text,
          });

          // Fallback to generic questions
          questions = [
            {
              type: "question",
              questionType: "free_text",
              content: "¿Cuál es tu objetivo principal con esta decisión?",
            },
            {
              type: "question",
              questionType: "yes_no",
              content: "¿Tienes alguna restricción de presupuesto o tiempo?",
            },
            {
              type: "question",
              questionType: "free_text",
              content: "¿Qué información adicional sería útil para tomar esta decisión?",
            },
          ];
        }

        logger.info("[Contextual Questions] Generated successfully", {
          count: questions.length,
          types: questions.map((q: ContextQuestion) => `${q.type}:${q.questionType}`),
        });

        return questions;
      } catch (error) {
        logger.error("[Contextual Questions] Generation failed", {
          error: error instanceof Error ? error.message : String(error),
        });

        // Fallback to generic questions
        return [
          {
            type: "question",
            questionType: "free_text",
            content: "¿Cuál es tu objetivo principal con esta decisión?",
          },
          {
            type: "question",
            questionType: "yes_no",
            content: "¿Tienes alguna restricción de presupuesto o tiempo?",
          },
        ];
      }
    }),

  /**
   * Generate contextual suggested questions based on company, departments, professionals, and experts
   * Uses AI to create personalized questions relevant to the user's business context
   */
  /**
   * Generar respuestas sugeridas dinámicas para una pregunta específica
   * Usa IA para generar respuestas contextualizadas en lugar de hardcodeadas
   */
  suggestAnswersForQuestion: protectedProcedure
    .input(
      z.object({
        question: z.string().min(10, "Question must be at least 10 characters"),
        count: z.number().min(1).max(5).default(3),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { getAIClient, parseAIJson } = await import("@quoorum/ai");
        const aiClient = getAIClient();

        const systemPrompt = `Eres un asistente experto que ayuda a usuarios a responder preguntas estratégicas de negocio.

OBJETIVO: Generar ${input.count} respuestas sugeridas ÚNICAS y ESPECÍFICAS para la pregunta del usuario.

REGLAS CRÍTICAS:
1. Cada respuesta debe ser ÚNICA y diferente de las otras
2. Las respuestas deben ser ESPECÍFICAS a la pregunta, no genéricas
3. Deben ser respuestas que un usuario real podría dar (naturales, no robóticas)
4. Varía el enfoque: una puede ser más técnica, otra más estratégica, otra más práctica
5. Las respuestas deben tener entre 80-200 caracteres (suficiente para ser útil pero no excesivo)

FORMATO JSON:
{
  "suggestions": [
    {
      "id": "suggested-1",
      "text": "Respuesta completa y específica aquí",
      "description": "Breve descripción del enfoque (máx 30 caracteres)"
    }
  ]
}`;

        const userPrompt = `Genera ${input.count} respuestas sugeridas ÚNICAS para esta pregunta:

"${input.question}"

IMPORTANTE:
- Cada respuesta debe ser diferente y específica
- No uses plantillas genéricas
- Varía el enfoque y perspectiva
- Las respuestas deben ser naturales y útiles`;

        const response = await aiClient.generateWithSystem(
          systemPrompt,
          userPrompt,
          {
            modelId: "gemini-2.0-flash-exp",
            temperature: 0.9, // Alta creatividad para respuestas únicas
            maxTokens: 800,
            responseFormat: "json",
          }
        );

        const parsed = parseAIJson<{ suggestions: Array<{ id: string; text: string; description: string }> }>(response.text);

        if (!parsed || !Array.isArray(parsed.suggestions)) {
          throw new Error("Invalid AI response format");
        }

        // Validar y limpiar respuestas
        const suggestions = parsed.suggestions
          .filter((s) => s.text && s.text.trim().length >= 50 && s.text.trim().length <= 300)
          .slice(0, input.count)
          .map((s) => ({
            id: s.id || `suggested-${Date.now()}-${Math.random()}`,
            text: s.text.trim(),
            description: (s.description || "").trim().substring(0, 50),
          }));

        // Deduplicación: eliminar respuestas con contenido similar
        const uniqueSuggestions = []
        const seenTexts = new Set<string>()
        
        for (const suggestion of suggestions) {
          const normalizedText = suggestion.text.toLowerCase().trim()
          // Verificar similitud (si más del 80% del texto coincide, es duplicado)
          let isDuplicate = false
          for (const seen of seenTexts) {
            const similarity = calculateSimilarity(normalizedText, seen)
            if (similarity > 0.8) {
              isDuplicate = true
              break
            }
          }
          
          if (!isDuplicate) {
            seenTexts.add(normalizedText)
            uniqueSuggestions.push(suggestion)
          }
        }

        // Si después de deduplicación tenemos menos de lo solicitado, rellenar con fallback
        if (uniqueSuggestions.length < input.count) {
          logger.warn("[suggestAnswersForQuestion] Got fewer unique suggestions than requested", {
            requested: input.count,
            received: uniqueSuggestions.length,
          });
        }

        logger.info("[suggestAnswersForQuestion] Generated suggestions", {
          count: uniqueSuggestions.length,
          questionPreview: input.question.substring(0, 50),
        });

        return uniqueSuggestions.length > 0 ? uniqueSuggestions : getFallbackSuggestedAnswers(input.count);
      } catch (error) {
        logger.error("[suggestAnswersForQuestion] Failed to generate suggestions", {
          error: error instanceof Error ? error.message : String(error),
        });

        // Fallback a respuestas genéricas pero variadas
        return getFallbackSuggestedAnswers(input.count);
      }
    }),

  suggestInitialQuestions: protectedProcedure
    .input(
      z.object({
        count: z.number().min(1).max(5).default(3), // Number of questions to generate
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Import AI client
        const { getAIClient, parseAIJson } = await import("@quoorum/ai");
        const aiClient = getAIClient();

        // Get company context
        const [company] = await db
          .select()
          .from(companies)
          .where(eq(companies.userId, ctx.userId))
          .limit(1);

        // Get user's departments
        const userDepartments = await db
          .select({
            id: departments.id,
            name: departments.name,
            type: departments.type,
            description: departments.description,
          })
          .from(departments)
          .where(eq(departments.userId, ctx.userId))
          .limit(20);

        // Get user's workers
        const userWorkers = await db
          .select({
            id: workers.id,
            name: workers.name,
            role: workers.role,
            expertise: workers.expertise,
            responsibilities: workers.responsibilities,
          })
          .from(workers)
          .where(eq(workers.userId, ctx.userId)) // Use ctx.userId (profile.id) - FK references profiles.id
          .limit(20);

        // Get available experts (for context, not to include in questions)
        const { getAllExperts } = await import("@quoorum/quoorum");
        const allExperts = getAllExperts(true); // companyOnly = true
        const expertCategories = Array.from(
          new Set(allExperts.map((e) => e.category).filter(Boolean))
        ).slice(0, 10);

        // Build context string for AI
        const contextParts: string[] = [];

        if (company) {
          contextParts.push(`EMPRESA: ${company.name}`);
          if (company.industry) contextParts.push(`Industria: ${company.industry}`);
          if (company.size) contextParts.push(`Tamaño: ${company.size}`);
          if (company.context) contextParts.push(`Contexto: ${company.context.substring(0, 500)}`);
          if (company.description) contextParts.push(`Descripción: ${company.description.substring(0, 300)}`);
        }

        if (userDepartments.length > 0) {
          contextParts.push(
            `DEPARTAMENTOS (${userDepartments.length}): ${userDepartments.map((d) => d.name).join(", ")}`
          );
          userDepartments.slice(0, 5).forEach((dept) => {
            if (dept.description) {
              contextParts.push(`  - ${dept.name}: ${dept.description.substring(0, 200)}`);
            }
          });
        }

        if (userWorkers.length > 0) {
          contextParts.push(
            `PROFESIONALES (${userWorkers.length}): ${userWorkers.map((w) => w.name).join(", ")}`
          );
          userWorkers.slice(0, 5).forEach((worker) => {
            const info: string[] = [];
            if (worker.role) info.push(`Rol: ${worker.role}`);
            if (worker.expertise) info.push(`Expertise: ${worker.expertise}`);
            if (worker.responsibilities) info.push(`Responsabilidades: ${worker.responsibilities.substring(0, 150)}`);
            if (info.length > 0) {
              contextParts.push(`  - ${worker.name}: ${info.join(" | ")}`);
            }
          });
        }

        if (expertCategories.length > 0) {
          contextParts.push(
            `ÁREAS DE EXPERTISE DISPONIBLES: ${expertCategories.join(", ")}`
          );
        }

        const fullContext = contextParts.join("\n");

        // Generate questions using AI
        const systemPrompt = `Eres un experto consultor de estrategia empresarial. Tu trabajo es generar preguntas de debate estratégico altamente relevantes y contextualizadas para una empresa específica.

REGLAS:
1. Genera exactamente ${input.count} preguntas únicas y específicas
2. Las preguntas DEBEN estar basadas en el contexto de la empresa, departamentos, profesionales y áreas de expertise disponibles
3. Las preguntas deben ser:
   - Relevantes para la industria y etapa de la empresa
   - Específicas a los departamentos y roles existentes
   - Accionables (que lleven a decisiones concretas)
   - Estratégicas (no operativas del día a día)
4. Evita preguntas genéricas o que no tengan relación con el contexto
5. Prioriza preguntas que involucren múltiples departamentos o áreas de expertise
6. Si hay profesionales específicos, considera sus roles y responsabilidades
7. Las preguntas deben ser en español y tener entre 20-100 caracteres

FORMATO DE RESPUESTA (JSON estricto):
{
  "questions": [
    "Pregunta 1 completa aquí",
    "Pregunta 2 completa aquí",
    "Pregunta 3 completa aquí"
  ]
}`;

        const userPrompt = `Genera ${input.count} preguntas de debate estratégico basadas en este contexto:

${fullContext || "No hay contexto específico disponible. Genera preguntas generales pero relevantes para empresas en crecimiento."}

Genera preguntas que sean:
- Altamente relevantes para esta empresa específica
- Que consideren los departamentos y profesionales existentes
- Que aborden desafíos estratégicos reales
- Que sean accionables y lleven a decisiones concretas`;

        logger.info("[debates.suggestInitialQuestions] Generating contextual questions", {
          userId: ctx.userId,
          hasCompany: !!company,
          departmentsCount: userDepartments.length,
          workersCount: userWorkers.length,
          expertCategoriesCount: expertCategories.length,
          requestedCount: input.count,
        });

        const response = await aiClient.generateWithSystem(
          systemPrompt,
          userPrompt,
          {
            modelId: "gemini-2.0-flash-exp", // Free tier
            temperature: 0.8, // Creative but focused
            maxTokens: 1000,
          }
        );

        // Parse JSON response
        const parsed = parseAIJson<{ questions: string[] }>(response.text);

        if (!parsed || !Array.isArray(parsed.questions)) {
          throw new Error("Invalid AI response format");
        }

        // Validate and clean questions
        const questions = parsed.questions
          .filter((q) => typeof q === "string" && q.trim().length >= 10 && q.trim().length <= 200)
          .slice(0, input.count)
          .map((q) => q.trim());

        // If we got fewer questions than requested, fill with fallback
        if (questions.length < input.count) {
          logger.warn("[debates.suggestInitialQuestions] Got fewer questions than requested", {
            requested: input.count,
            received: questions.length,
          });
        }

        logger.info("[debates.suggestInitialQuestions] Generated questions", {
          count: questions.length,
          questions: questions.map((q) => q.substring(0, 50)),
        });

        return questions;
      } catch (error) {
        logger.error("[debates.suggestInitialQuestions] Failed to generate questions", {
          error: error instanceof Error ? error.message : String(error),
          userId: ctx.userId,
        });

        // Fallback to generic questions if AI fails
        // Note: This is a client-side utility, so we'll return a simple fallback array
        const fallbackQuestions = [
          "¿Cuál es la mejor estrategia para mi negocio?",
          "¿Debería invertir en esta oportunidad?",
          "¿Qué decisión estratégica debo tomar?",
        ];
        return fallbackQuestions.slice(0, input.count);
      }
    }),
});

/**
 * Helper: Run debate asynchronously
 */
async function runDebateAsync(
  debateId: string,
  userId: string, // This is profileId (from ctx.userId)
  question: string,
  context?: DebateContext,
  executionStrategy?: 'sequential' | 'parallel', // Estrategia de ejecución de agentes dentro de una ronda
  pattern?: PatternType, // Patrón de orquestación (simple, tournament, adversarial, etc.)
  selectedExpertIds?: string[], // IDs de expertos personalizados seleccionados por el usuario
  selectedDepartmentIds?: string[], // IDs de departamentos corporativos seleccionados por el usuario
        selectedWorkerIds?: string[] // IDs de profesionales que intervienen (orquestador aún no los usa)
): Promise<void> {
  // ============================================================================
  // CONVERT PROFILE ID TO USERS ID (for credit transactions)
  // ============================================================================
  // IMPORTANT: userId parameter is profileId, but credit functions need users.id
  // profiles.userId references users.id, so we need to get it from the profile
  const [profile] = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  if (!profile) {
    logger.error('Profile not found for credit deduction', { profileId: userId, debateId })
    await db
      .update(quoorumDebates)
      .set({ 
        status: 'failed', 
        completedAt: new Date(),
        metadata: { error: 'Profile not found' }
      })
      .where(eq(quoorumDebates.id, debateId))
    return
  }

  const usersId = profile.userId // This is users.id (for credit transactions)

  // ============================================================================
  // CREDIT PRE-FLIGHT CHECK
  // ============================================================================
  // Estimate max credits needed (worst case: MAX_ROUNDS * 4 agents * ~$0.02 per message)
  // Average debate: 5 rounds * 4 agents * 500 tokens * $0.0001/token = $0.10 = 35 credits
  // Conservative estimate: 20 rounds max = $0.40 = 140 credits
  const estimatedCreditsMax = 140

  // Check if user has sufficient balance
  const { hasSufficientCredits, deductCredits, refundCredits, convertUsdToCredits } = await import('@quoorum/quoorum/billing/credit-transactions')
  const hasBalance = await hasSufficientCredits(usersId, estimatedCreditsMax)
  
  if (!hasBalance) {
    // Update debate to failed status with clear error message
    await db
      .update(quoorumDebates)
      .set({ 
        status: 'failed', 
        completedAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          error: 'Insufficient credits',
          errorDetails: `Required: ${estimatedCreditsMax} credits`,
        }
      })
      .where(and(eq(quoorumDebates.id, debateId), eq(quoorumDebates.userId, userId)))
    
    logger.error('Debate failed: Insufficient credits', {
      debateId,
      userId,
      requiredCredits: estimatedCreditsMax,
    })
    return // Exit early, don't start debate
  }

  // ============================================================================
  // ATOMIC CREDIT DEDUCTION (Pre-charge)
  // ============================================================================
  // Deduct estimated credits BEFORE starting debate execution
  const deductionResult = await deductCredits(
    usersId, // Use users.id, not profileId
    estimatedCreditsMax,
    debateId,
    'debate_execution',
    `Debate execution - estimated max cost: ${estimatedCreditsMax} credits`
  )
  
  if (!deductionResult.success) {
    // Update debate to failed status
    await db
      .update(quoorumDebates)
      .set({ 
        status: 'failed', 
        completedAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          error: 'Failed to deduct credits',
          errorDetails: deductionResult.error ?? 'Credit deduction failed',
        }
      })
      .where(and(eq(quoorumDebates.id, debateId), eq(quoorumDebates.userId, userId)))
    
    logger.error('Debate failed: Credit deduction failed', {
      debateId,
      userId,
      error: deductionResult.error,
    })
    return // Exit early, don't start debate
  }

  // Track if refund was issued (to avoid double refund on error)
  let refundIssued = false

  try {
    logger.info("Starting debate execution", {
      debateId,
      userId,
      question: question.substring(0, 50),
      hasContext: !!context,
      executionStrategy,
      pattern,
      selectedExpertIds: selectedExpertIds?.length || 0,
      selectedDepartmentIds: selectedDepartmentIds?.length || 0,
    });
    
    // Update status to in_progress (only after credit deduction succeeds)
    await db
      .update(quoorumDebates)
      .set({ status: "in_progress", startedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(quoorumDebates.id, debateId), eq(quoorumDebates.userId, userId)));
    
    logger.info("Debate status updated to in_progress", { debateId });

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

    // Load corporate intelligence (company + departments) if selectedDepartmentIds provided
    let corporateContext: CorporateContext | undefined = undefined
    if (selectedDepartmentIds && selectedDepartmentIds.length > 0) {
      try {
        // Use centralized buildCorporateContext function
        const corporateData = await buildCorporateContext(userId, selectedDepartmentIds)

        if (corporateData) {
          corporateContext = {
            companyContext: corporateData.company.context,
            departmentContexts: corporateData.departments.map((dept) => ({
              departmentName: dept.name,
              departmentContext: dept.context,
              customPrompt: dept.customPrompt || undefined,
            })),
            contextSummary: corporateData.contextSummary, // Full formatted context for AI
          }

          logger.info('Corporate intelligence loaded', {
            debateId,
            companyName: corporateData.company.name,
            departmentCount: corporateData.departments.length,
            departments: corporateData.departments.map((d) => d.name),
          })
        }
      } catch (error) {
        logger.warn('Failed to load corporate intelligence', {
          error: error instanceof Error ? error.message : String(error),
          debateId,
        })
        // Continue without corporate context (non-blocking)
      }
    }

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
    let result: DebateResult | DebateSequence

    if (finalPattern === 'simple') {
      // SIMPLE PATTERN: Use runDynamicDebate directly (core + experts in single debate)
      result = await runDynamicDebate({
      sessionId: debateId,
      question,
      context: loadedContext,
      executionStrategy: finalExecutionStrategy, // Pass execution strategy (sequential: agents see each other, parallel: faster but no same-round responses)
      selectedExpertIds: selectedExpertIds, // Pass selected custom experts if provided
      corporateContext: corporateContext, // Pass corporate intelligence (4-layer context injection)
      selectedDepartmentIds: selectedDepartmentIds, // Pass selected department IDs for agent configuration
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

        const metadata = (debate.metadata as DebateMetadata) || {}
        const context = (debate.context as DebateContext) || {}

        return {
          isPaused: metadata.paused === true,
          forceConsensus: metadata.forceConsensus === true,
          additionalContext: ((context.additional as AdditionalContextItem[]) || []).map((item) => item.content),
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
    // [WARNING] IMPORTANT: Respect result.status - could be 'failed' if execution failed
    const [currentDebate] = await db
      .select({ metadata: quoorumDebates.metadata })
      .from(quoorumDebates)
      .where(eq(quoorumDebates.id, debateId))
    
    const currentMetadata = (currentDebate?.metadata as DebateMetadata) || {}
    
    // ============================================================================
    // CALCULATE ACTUAL CREDITS USED & REFUND DIFFERENCE
    // ============================================================================
    const actualCostUsd = estimateCost(result.rounds.length, mappedExperts?.length ?? 4)
    const actualCreditsUsed = convertUsdToCredits(actualCostUsd)
    const creditsToRefund = estimatedCreditsMax - actualCreditsUsed

    if (creditsToRefund > 0) {
      const refundResult = await refundCredits(
        usersId, // Use users.id, not profileId
        creditsToRefund,
        debateId,
        'refund',
        'Refund unused credits after debate completion'
      )
      refundIssued = refundResult.success
      
      if (refundResult.success) {
        logger.info('Credits refunded after debate completion', {
          debateId,
          userId,
          refunded: creditsToRefund,
          actualUsed: actualCreditsUsed,
          estimated: estimatedCreditsMax,
        })
      }
    }

    await db
      .update(quoorumDebates)
      .set({
        status: result.status === "failed" ? "failed" : "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
        consensusScore: result.consensusScore,
        totalRounds: result.rounds.length,
        totalCostUsd: actualCostUsd,
        totalCreditsUsed: actualCreditsUsed, // Actual credits consumed (calculated from USD cost)
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
      // IMPORTANT: userId here is profile.id (not users.id)
      // Get profile email directly from profiles table
      const [profile] = await db
        .select({ email: profiles.email })
        .from(profiles)
        .where(eq(profiles.id, userId));

      if (profile?.email && mappedExperts) {
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
          userId, // profile.id - correct for notifications
          profile.email,
          result,
          expertProfiles,
          { email: true, inApp: true, push: false } // Push notifications disabled for now
        );

        // Also trigger Inngest event as backup (worker will also create notification)
        try {
          await inngest.send({
            name: 'quoorum/debate.completed',
            data: { debateId, userId }, // userId is profile.id - correct
          })
        } catch (inngestError) {
          // Don't fail if Inngest event fails (notification already sent directly above)
          logger.warn('Failed to send Inngest event for debate completion', {
            debateId,
            userId,
            error: inngestError instanceof Error ? inngestError.message : String(inngestError),
          })
        }

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
    // ============================================================================
    // ROLLBACK: Refund all credits if debate fails mid-execution
    // ============================================================================
    if (!refundIssued) {
      // Calculate actual credits used (if any) - try to get from result if available
      let actualCreditsUsed = 0
      try {
        // Try to calculate from result if it exists
        if (result && 'rounds' in result && Array.isArray(result.rounds)) {
          const actualCostUsd = estimateCost(result.rounds.length, 4) // Default to 4 experts
          actualCreditsUsed = convertUsdToCredits(actualCostUsd)
        }
      } catch {
        // If calculation fails, assume 0 credits used
        actualCreditsUsed = 0
      }

      const creditsToRefund = estimatedCreditsMax - actualCreditsUsed

      if (creditsToRefund > 0) {
        await refundCredits(
          usersId, // Use users.id, not profileId
          creditsToRefund,
          debateId,
          'debate_failed',
          `Debate failed mid-execution: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
        
        logger.info('Credits refunded after debate failure', {
          debateId,
          userId,
          refunded: creditsToRefund,
          actualUsed: actualCreditsUsed,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

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
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: 'execution_error',
        },
      })
      .where(and(eq(quoorumDebates.id, debateId), eq(quoorumDebates.userId, userId)));

    // Send failure notification
    try {
      const { notifyDebateFailed } = await import("./quoorum-notifications");
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

// ═══════════════════════════════════════════════════════════
// CONTEXT SYSTEM HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Parse and validate questions from AI response
 */
function parseQuestions(text: string, priority: string): ContextQuestion[] {
  try {
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/```\n?/g, "");
    }

    const questions = JSON.parse(cleanedText);

    if (!Array.isArray(questions)) {
      throw new Error("Response is not an array");
    }

    // ═══════════════════════════════════════════════════════════
    // DEDUPLICACIÓN: Eliminar preguntas duplicadas por contenido
    // ═══════════════════════════════════════════════════════════
    const seenContents = new Set<string>()
    const uniqueQuestions: ContextQuestion[] = []
    const usedIds = new Set<string>()

    for (let index = 0; index < questions.length; index++) {
      const q = questions[index] as Record<string, unknown>
      const content = ((q.content as string) || (q.question as string) || "").trim()
      
      // Saltar si el contenido está vacío o es duplicado
      if (!content || seenContents.has(content.toLowerCase())) {
        logger.warn("[parseQuestions] Skipping duplicate or empty question", { 
          index, 
          content: content.substring(0, 50),
          duplicate: seenContents.has(content.toLowerCase())
        })
        continue
      }

      // Generar ID único si no existe o está duplicado
      let questionId = (q.id as string) || `${priority}_${index + 1}`
      let idCounter = 1
      while (usedIds.has(questionId)) {
        questionId = `${priority}_${index + 1}_${idCounter}`
        idCounter++
      }
      usedIds.add(questionId)

      seenContents.add(content.toLowerCase())
      
      uniqueQuestions.push({
        id: questionId,
        priority: (q.priority as string) || priority,
        questionType: (q.questionType as ContextQuestion['questionType']) || "free_text",
        content,
        options: q.questionType === "multiple_choice" ? (q.options as string[]) || [] : undefined,
        expectedAnswerType: q.expectedAnswerType === "short" || q.expectedAnswerType === "long" 
          ? (q.expectedAnswerType as 'short' | 'long')
          : undefined,
      })
    }

    if (uniqueQuestions.length === 0) {
      logger.warn("[parseQuestions] No unique questions after deduplication, using fallback")
      throw new Error("No unique questions generated")
    }

    logger.info("[parseQuestions] Deduplication complete", {
      originalCount: questions.length,
      uniqueCount: uniqueQuestions.length,
      removed: questions.length - uniqueQuestions.length
    })

    return uniqueQuestions
  } catch (error) {
    logger.error("[parseQuestions] Failed", { error });
    throw error;
  }
}

/**
 * Parse and validate evaluation from AI response
 */
function parseEvaluation(text: string): ContextEvaluation {
  try {
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/```\n?/g, "");
    }

    const evaluation = JSON.parse(cleanedText);

    return {
      score: Math.min(100, Math.max(0, evaluation.score || 60)),
      reasoning: evaluation.reasoning || "Contexto evaluado",
      missingAspects: Array.isArray(evaluation.missingAspects) ? evaluation.missingAspects : [],
      contradictions: Array.isArray(evaluation.contradictions) ? evaluation.contradictions : [],
      duplicatedInfo: Array.isArray(evaluation.duplicatedInfo) ? evaluation.duplicatedInfo : [],
      qualityIssues: Array.isArray(evaluation.qualityIssues) ? evaluation.qualityIssues : [],
      shouldContinue: evaluation.shouldContinue !== false,
      followUpQuestions: (() => {
        if (!Array.isArray(evaluation.followUpQuestions)) {
          return []
        }
        
        // ═══════════════════════════════════════════════════════════
        // DEDUPLICACIÓN: Eliminar preguntas follow-up duplicadas
        // ═══════════════════════════════════════════════════════════
        const seenContents = new Set<string>()
        const usedIds = new Set<string>()
        const uniqueFollowUps: ContextQuestion[] = []
        
        for (let index = 0; index < evaluation.followUpQuestions.length; index++) {
          const q = evaluation.followUpQuestions[index] as Record<string, unknown>
          const content = ((q.content as string) || (q.question as string) || "").trim()
          
          // Saltar si el contenido está vacío o es duplicado
          if (!content || seenContents.has(content.toLowerCase())) {
            logger.warn("[parseEvaluation] Skipping duplicate follow-up question", {
              index,
              content: content.substring(0, 50)
            })
            continue
          }
          
          // Generar ID único
          let questionId = (q.id as string) || `followup_${index + 1}`
          let idCounter = 1
          while (usedIds.has(questionId)) {
            questionId = `followup_${index + 1}_${idCounter}`
            idCounter++
          }
          usedIds.add(questionId)
          
          seenContents.add(content.toLowerCase())
          
          uniqueFollowUps.push({
            id: questionId,
            priority: (q.priority as string) || "medium",
            questionType: (q.questionType as ContextQuestion['questionType']) || "free_text",
            content,
            options: q.questionType === "multiple_choice" ? (q.options as string[]) || [] : undefined,
          })
        }
        
        if (uniqueFollowUps.length < evaluation.followUpQuestions.length) {
          logger.warn("[parseEvaluation] Removed duplicate follow-up questions", {
            originalCount: evaluation.followUpQuestions.length,
            uniqueCount: uniqueFollowUps.length
          })
        }
        
        return uniqueFollowUps
      })(),
    };
  } catch (error) {
    logger.error("[parseEvaluation] Failed", { error });
    throw error;
  }
}

/**
 * Fallback critical questions if AI fails
 * NOTA: Este fallback solo se usa si la IA falla completamente.
 * Las preguntas son genéricas como último recurso, pero deberían ser reemplazadas por preguntas específicas de la IA.
 */
function getFallbackCriticalQuestions(): ContextQuestion[] {
  // Intentar generar preguntas más específicas basadas en palabras clave de la pregunta
  // Si no hay contexto, usar preguntas genéricas como último recurso
  return [
    {
      id: "critical_1",
      priority: "critical",
      questionType: "free_text",
      content: "¿Qué información específica necesitas para tomar esta decisión?",
      expectedAnswerType: "long",
    },
    {
      id: "critical_2",
      priority: "critical",
      questionType: "free_text",
      content: "¿Cuáles son los factores más importantes que debes considerar?",
      expectedAnswerType: "long",
    },
    {
      id: "critical_3",
      priority: "critical",
      questionType: "free_text",
      content: "¿Qué recursos o limitaciones específicas afectan esta decisión?",
      expectedAnswerType: "short",
    },
  ];
}

/**
 * Fallback evaluation if AI fails
 */
function getFallbackEvaluation(): ContextEvaluation {
  return {
    score: 60,
    reasoning: "Contexto básico recopilado. Suficiente para empezar.",
    missingAspects: [],
    contradictions: [],
    duplicatedInfo: [],
    qualityIssues: [],
    shouldContinue: false,
    followUpQuestions: [],
  };
}

/**
 * Calcular similitud entre dos textos (simple, basado en palabras comunes)
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  
  const intersection = new Set([...words1].filter(w => words2.has(w)))
  const union = new Set([...words1, ...words2])
  
  if (union.size === 0) return 0
  return intersection.size / union.size
}

/**
 * Fallback para respuestas sugeridas si la IA falla
 */
function getFallbackSuggestedAnswers(count: number): Array<{ id: string; text: string; description: string }> {
  const fallbacks = [
    {
      id: "suggested-1",
      text: "Estoy evaluando opciones concretas (timing, recursos, impacto en el negocio) y necesito contrastar riesgos y beneficios a corto y largo plazo con datos o referencias del sector antes de decidir.",
      description: "Evaluación con datos",
    },
    {
      id: "suggested-2",
      text: "Quiero comparar alternativas específicas —costes, plazos, viabilidad— y ver cómo encajan con mis objetivos actuales. Busco criterios claros para priorizar y descartar opciones.",
      description: "Comparación de alternativas",
    },
    {
      id: "suggested-3",
      text: "Busco una recomendación fundamentada con datos, mejores prácticas del sector y mi contexto, que concrete pasos o criterios aplicables para esta decisión.",
      description: "Recomendación aplicable",
    },
  ]
  
  return fallbacks.slice(0, count)
}
