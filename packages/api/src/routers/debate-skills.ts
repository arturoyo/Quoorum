/**
 * Debate Skills Router
 * CRUD for skills + marketplace browsing.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "@quoorum/db";
import { debateSkills, companySkills, profiles } from "@quoorum/db/schema";

// ============================================
// ROUTER
// ============================================

export const debateSkillsRouter = router({
  // Browse all available skills (marketplace)
  browse: publicProcedure
    .input(z.object({
      category: z.enum(["strategy", "finance", "marketing", "operations", "hr", "legal", "product", "custom"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const conditions = [eq(debateSkills.isActive, true)];
      if (input?.category) {
        conditions.push(eq(debateSkills.category, input.category));
      }

      return db
        .select()
        .from(debateSkills)
        .where(and(...conditions))
        .orderBy(desc(debateSkills.usageCount));
    }),

  // Get a specific skill
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const [skill] = await db
        .select()
        .from(debateSkills)
        .where(eq(debateSkills.slug, input.slug));

      if (!skill) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
      }
      return skill;
    }),

  // List company's enabled skills
  listCompanySkills: protectedProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .query(async ({ input }) => {
      return db
        .select({
          companySkill: companySkills,
          skill: debateSkills,
        })
        .from(companySkills)
        .innerJoin(debateSkills, eq(companySkills.skillId, debateSkills.id))
        .where(and(
          eq(companySkills.companyId, input.companyId),
          eq(companySkills.isEnabled, true),
        ));
    }),

  // Enable a skill for a company
  enableForCompany: protectedProcedure
    .input(z.object({
      companyId: z.string().uuid(),
      skillId: z.string().uuid(),
      customPromptOverride: z.string().max(5000).optional(),
      customExpertsOverride: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const [created] = await db
        .insert(companySkills)
        .values({
          companyId: input.companyId,
          skillId: input.skillId,
          customPromptOverride: input.customPromptOverride,
          customExpertsOverride: input.customExpertsOverride,
          isEnabled: true,
        })
        .onConflictDoNothing()
        .returning();

      return created;
    }),

  // Disable a skill for a company
  disableForCompany: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db
        .update(companySkills)
        .set({ isEnabled: false, updatedAt: new Date() })
        .where(eq(companySkills.id, input.id));

      return { success: true };
    }),

  // Increment usage count (called when a debate uses a skill)
  recordUsage: protectedProcedure
    .input(z.object({ skillId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [skill] = await db
        .select({ usageCount: debateSkills.usageCount })
        .from(debateSkills)
        .where(eq(debateSkills.id, input.skillId));

      if (!skill) return;

      await db
        .update(debateSkills)
        .set({
          usageCount: (skill.usageCount ?? 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(debateSkills.id, input.skillId));
    }),

  // Seed predefined skills (admin)
  seedPredefined: protectedProcedure
    .mutation(async ({ ctx }) => {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, ctx.userId),
      });

      // Dynamic import to avoid bundling predefined skills in all routes
      const { PREDEFINED_SKILLS } = await import('@quoorum/quoorum/skills/predefined-skills') as {
        PREDEFINED_SKILLS: Array<{
          slug: string
          name: string
          description: string
          category: 'strategy' | 'finance' | 'marketing' | 'operations' | 'hr' | 'legal' | 'product' | 'custom'
          icon: string
          systemPromptTemplate: string
          suggestedExperts: string[]
          suggestedRounds: number
          outputTemplate: string
        }>
      };

      let seeded = 0;
      for (const skill of PREDEFINED_SKILLS) {
        const [existing] = await db
          .select({ id: debateSkills.id })
          .from(debateSkills)
          .where(eq(debateSkills.slug, skill.slug));

        if (!existing) {
          await db.insert(debateSkills).values({
            slug: skill.slug,
            name: skill.name,
            description: skill.description,
            category: skill.category,
            icon: skill.icon,
            systemPromptTemplate: skill.systemPromptTemplate,
            suggestedExperts: skill.suggestedExperts,
            suggestedRounds: skill.suggestedRounds,
            outputTemplate: skill.outputTemplate,
            visibility: 'system',
            createdBy: profile?.id,
          });
          seeded++;
        }
      }

      return { seeded, total: PREDEFINED_SKILLS.length };
    }),
});
