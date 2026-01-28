import { z } from "zod";
import { eq, and, isNull, or, like, inArray } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { experts, companies } from "@quoorum/db";
import type { AIConfig } from "@quoorum/ai";
import { logger } from "../lib/logger";

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

  /** Get id+name for multiple experts (e.g. Phase 4 review). */
  getByIds: publicProcedure
    .input(z.object({ ids: z.array(z.string().min(1)).max(50) })) // Acepta slugs (ej: "april_dunford") o UUIDs
    .query(async ({ ctx, input }) => {
      if (input.ids.length === 0) return [];
      
      // Los expertos del sistema tienen slugs, los personalizados tienen UUIDs
      // Separar UUIDs de slugs antes de hacer queries
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const validUuids = input.ids.filter((id) => uuidRegex.test(id))
      const slugs = input.ids.filter((id) => !uuidRegex.test(id))
      
      const results: Array<{ id: string; name: string }> = [];
      
      // NO buscar en tabla de expertos personalizados - solo expertos del sistema (slugs)
      // Los expertos personalizados han sido eliminados, solo usamos expertos del sistema
      
      // Buscar en EXPERT_DATABASE (slugs del sistema)
      if (slugs.length > 0) {
        const { getExpert } = await import("@quoorum/quoorum");
        const foundUuids = new Set(validUuids);
        
        for (const slug of slugs) {
          // Solo buscar si no está ya en resultados de DB
          if (!foundUuids.has(slug)) {
            const expert = getExpert(slug);
            if (expert) {
              results.push({ id: expert.id, name: expert.name });
            }
          }
        }
      }
      
      return results;
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

      // Only select necessary fields for performance (id, name, expertise, description, category, aiConfig)
      const results = await ctx.db
        .select({
          id: experts.id,
          name: experts.name,
          expertise: experts.expertise,
          description: experts.description,
          category: experts.category,
          aiConfig: experts.aiConfig,
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
   * List all experts (library only) - for ExpertSelector
   * [WARN] MODIFICADO: Solo retorna expertos de biblioteca (userId = null)
   * Los expertos personalizados han sido eliminados
   */
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        activeOnly: z.boolean().default(true),
        limit: z.number().min(1).max(100).default(25),
        offset: z.number().min(0).default(0),
        includeLibrary: z.boolean().default(true),
        includeMyExperts: z.boolean().default(false), // Ignorado - siempre false
        userId: z.string().uuid().optional(), // Ignorado - no se usan expertos personalizados
      })
    )
    .query(async ({ ctx, input }) => {
      // Solo expertos de biblioteca (userId = null)
      const conditions = [isNull(experts.userId)];

      if (input.activeOnly) {
        conditions.push(eq(experts.isActive, true));
      }

      if (input.category) {
        conditions.push(eq(experts.category, input.category));
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
   * Fork an expert from library to user's custom experts
   * [WARN] DESHABILITADO: Los expertos personalizados han sido eliminados
   */
  forkFromLibrary: protectedProcedure
    .input(
      z.object({
        libraryExpertId: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        category: z.string().max(100).optional(),
      })
    )
    .mutation(async () => {
      throw new Error('Los expertos personalizados han sido eliminados. Solo se pueden usar expertos del sistema.');
    }),

  /**
   * Create a new custom expert
   * [WARN] DESHABILITADO: Los expertos personalizados han sido eliminados
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
        libraryExpertId: z.string().uuid().optional(),
      })
    )
    .mutation(async () => {
      throw new Error('Los expertos personalizados han sido eliminados. Solo se pueden usar expertos del sistema.');
    }),

  /**
   * Update expert (only user's custom experts can be updated)
   * [WARN] DESHABILITADO: Los expertos personalizados han sido eliminados
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
    .mutation(async () => {
      throw new Error('Los expertos personalizados han sido eliminados. Solo se pueden usar expertos del sistema.');
    }),

  /**
   * Delete expert
   * [WARN] DESHABILITADO: Los expertos personalizados han sido eliminados
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async () => {
      throw new Error('Los expertos personalizados han sido eliminados. Solo se pueden usar expertos del sistema.');
    }),

  /**
   * Suggest experts automatically based on question context using AI
   * Uses intelligent AI matching considering:
   * - Full company context (industry, size, stage)
   * - Question analysis (complexity, areas, topics)
   * - Expert synergies and diversity
   */
  suggest: protectedProcedure
    .input(z.object({ question: z.string().min(10), context: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      // Import AI-powered matcher and question analyzer
      const { analyzeQuestion, getAllExperts, matchExpertsWithAI } = await import("@quoorum/quoorum");

      // Get company context for better suggestions
      const [company] = await ctx.db
        .select()
        .from(companies)
        .where(eq(companies.userId, ctx.userId))
        .limit(1);

      // Analyze question to get areas, topics, complexity
      const analysis = await analyzeQuestion(input.question, input.context);

      logger.info('[experts.suggest] Question analysis:', {
        question: input.question.substring(0, 100),
        complexity: analysis.complexity,
        decisionType: analysis.decisionType,
        areasCount: analysis.areas.length,
        areas: analysis.areas.map(a => ({ area: a.area, weight: a.weight })),
        topicsCount: analysis.topics?.length || 0,
        topics: analysis.topics?.slice(0, 5),
        hasCompanyContext: !!company
      });

      const allExperts = getAllExperts(true); // companyOnly = true
      logger.info('[experts.suggest] Total experts in database:', { count: allExperts.length });

      // Use AI-powered matching with company context
      const matches = await matchExpertsWithAI(
        input.question,
        analysis,
        allExperts,
        {
          minExperts: 3,
          maxExperts: 7,
          alwaysIncludeCritic: true,
          companyOnly: true,
          companyContext: company ? {
            name: company.name,
            industry: company.industry || undefined,
            size: company.size || undefined,
            description: company.description || undefined,
            context: company.context || undefined,
          } : undefined,
        }
      );

      logger.info('[experts.suggest] AI matches found:', {
        count: matches.length,
        experts: matches.map(m => ({ id: m.expert.id, name: m.expert.name, score: m.score, role: m.suggestedRole }))
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
        synergy: match.synergy,
        analysis: {
          complexity: analysis.complexity,
          decisionType: analysis.decisionType,
          areas: analysis.areas.slice(0, 3).map((a) => ({ name: a.area, weight: a.weight })),
        },
      }));
    }),
});
