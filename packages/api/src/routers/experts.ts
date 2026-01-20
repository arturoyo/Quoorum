import { z } from "zod";
import { eq, and, isNull, or, like } from "drizzle-orm";
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

  /**
   * Get category counts for library experts (fast, no full data)
   */
  libraryCategoryCounts: publicProcedure
    .input(
      z.object({
        activeOnly: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [isNull(experts.userId)]; // Only library experts

      if (input.activeOnly) {
        conditions.push(eq(experts.isActive, true));
      }

      // Get all experts with only id and category for counting
      const results = await ctx.db
        .select({
          id: experts.id,
          category: experts.category,
        })
        .from(experts)
        .where(and(...conditions));

      // Count by category
      const counts: Record<string, number> = {};
      results.forEach((expert) => {
        const category = expert.category || 'general';
        counts[category] = (counts[category] || 0) + 1;
      });

      return {
        total: results.length,
        byCategory: counts,
      };
    }),

  /**
   * List library experts (shared, userId = null)
   */
  libraryList: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        activeOnly: z.boolean().default(true),
        limit: z.number().min(1).max(100).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [isNull(experts.userId)]; // Only library experts (userId = null)

      if (input.activeOnly) {
        conditions.push(eq(experts.isActive, true));
      }

      if (input.category) {
        conditions.push(eq(experts.category, input.category));
      }

      if (input.search) {
        conditions.push(
          or(
            like(experts.name, `%${input.search}%`),
            like(experts.expertise, `%${input.search}%`),
            like(experts.description || '', `%${input.search}%`)
          )!
        );
      }

      // Only select necessary fields for performance (id, name, expertise, description, category)
      const results = await ctx.db
        .select({
          id: experts.id,
          name: experts.name,
          expertise: experts.expertise,
          description: experts.description,
          category: experts.category,
        })
        .from(experts)
        .where(and(...conditions))
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  /**
   * List user's custom experts (userId != null)
   */
  myExperts: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        activeOnly: z.boolean().default(true),
        limit: z.number().min(1).max(100).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(experts.userId, ctx.user.id)]; // Only user's custom experts

      if (input.activeOnly) {
        conditions.push(eq(experts.isActive, true));
      }

      if (input.category) {
        conditions.push(eq(experts.category, input.category));
      }

      if (input.search) {
        conditions.push(
          or(
            like(experts.name, `%${input.search}%`),
            like(experts.expertise, `%${input.search}%`),
            like(experts.description || '', `%${input.search}%`)
          )!
        );
      }

      const results = await ctx.db
        .select()
        .from(experts)
        .where(and(...conditions))
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  /**
   * List all experts (library + user's custom) - for ExpertSelector
   */
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        activeOnly: z.boolean().default(true),
        limit: z.number().min(1).max(100).default(25),
        offset: z.number().min(0).default(0),
        includeLibrary: z.boolean().default(true),
        includeMyExperts: z.boolean().default(false),
        userId: z.string().uuid().optional(), // If provided, include user's custom experts
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions: ReturnType<typeof eq>[] = [];

      // Build conditions for library vs custom experts
      if (input.includeLibrary && input.includeMyExperts && input.userId) {
        // Include both library and user's experts
        conditions.push(or(isNull(experts.userId), eq(experts.userId, input.userId))!);
      } else if (input.includeLibrary) {
        // Only library
        conditions.push(isNull(experts.userId));
      } else if (input.includeMyExperts && input.userId) {
        // Only user's experts
        conditions.push(eq(experts.userId, input.userId));
      }

      if (input.activeOnly) {
        conditions.push(eq(experts.isActive, true));
      }

      if (input.category) {
        conditions.push(eq(experts.category, input.category));
      }

      const results = await ctx.db
        .select()
        .from(experts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  /**
   * Fork an expert from library to user's custom experts
   */
  forkFromLibrary: protectedProcedure
    .input(
      z.object({
        libraryExpertId: z.string().uuid(),
        name: z.string().min(1).max(255).optional(), // Optional: customize name
        category: z.string().max(100).optional(), // Optional: change category
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get library expert
      const [libraryExpert] = await ctx.db
        .select()
        .from(experts)
        .where(and(eq(experts.id, input.libraryExpertId), isNull(experts.userId)))
        .limit(1);

      if (!libraryExpert) {
        throw new Error('Expert de biblioteca no encontrado');
      }

      // Create custom expert as fork
      const [forkedExpert] = await ctx.db
        .insert(experts)
        .values({
          userId: ctx.user.id, // User's custom expert
          name: input.name || libraryExpert.name,
          expertise: libraryExpert.expertise,
          description: libraryExpert.description,
          systemPrompt: libraryExpert.systemPrompt,
          aiConfig: libraryExpert.aiConfig,
          category: input.category || libraryExpert.category,
          libraryExpertId: libraryExpert.id, // Reference to original
          isActive: true,
        })
        .returning();

      return forkedExpert;
    }),

  /**
   * Create a new custom expert
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        expertise: z.string().min(1).max(500),
        description: z.string().optional(),
        systemPrompt: z.string().min(1),
        aiConfig: aiConfigSchema,
        category: z.string().max(100).optional(),
        libraryExpertId: z.string().uuid().optional(), // Optional: if forked from library
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(experts)
        .values({
          ...input,
          userId: ctx.user.id, // User's custom expert
        })
        .returning();
      return result[0]!;
    }),

  /**
   * Update expert (only user's custom experts can be updated)
   */
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

      // Verify ownership (only user's custom experts can be updated)
      const [existing] = await ctx.db
        .select({ userId: experts.userId })
        .from(experts)
        .where(eq(experts.id, id))
        .limit(1);

      if (!existing) {
        throw new Error('Experto no encontrado');
      }

      // Library experts (userId = null) cannot be updated
      if (!existing.userId) {
        throw new Error('No puedes modificar expertos de la biblioteca. Crea una copia personalizada primero.');
      }

      // Verify it belongs to the user
      if (existing.userId !== ctx.user.id) {
        throw new Error('No tienes permiso para modificar este experto');
      }

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

  /**
   * Suggest experts automatically based on question context (like deliberation strategy)
   * Analyzes the question and recommends experts using expert-matcher logic
   */
  suggest: protectedProcedure
    .input(z.object({ question: z.string().min(10), context: z.string().optional() }))
    .query(async ({ input }) => {
      // Use the same logic as deliberation strategy
      // Import from main package (these are exported from @quoorum/quoorum)
      const { analyzeQuestion, matchExperts } = await import("@quoorum/quoorum");

      // Analyze question to get areas, topics, complexity
      const analysis = await analyzeQuestion(input.question, input.context);

      // Match experts based on analysis (like in runner-dynamic.ts)
      const matches = matchExperts(analysis, {
        minExperts: 3,
        maxExperts: 7,
        minScore: 30,
        alwaysIncludeCritic: false, // Core critic agent is separate
      });

      // Return suggested experts with match info
      return matches.map((match) => ({
        id: match.expert.id,
        name: match.expert.name,
        title: match.expert.title,
        expertise: match.expert.expertise,
        matchScore: match.score,
        role: match.suggestedRole,
        reasons: match.reasons,
        analysis: {
          complexity: analysis.complexity,
          decisionType: analysis.decisionType,
          areas: analysis.areas.slice(0, 3).map((a) => ({ name: a.area, weight: a.weight })),
        },
      }));
    }),
});
