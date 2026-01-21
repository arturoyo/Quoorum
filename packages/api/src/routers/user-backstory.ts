import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "@quoorum/db/client.js";
import { userBackstory } from "@quoorum/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const backstorySchema = z.object({
  companyName: z.string().min(1).max(255).optional(),
  role: z
    .enum([
      "founder",
      "ceo",
      "cto",
      "product_manager",
      "investor",
      "consultant",
      "team_lead",
      "individual_contributor",
      "other",
    ])
    .optional(),
  industry: z
    .enum([
      "saas",
      "ecommerce",
      "fintech",
      "healthtech",
      "edtech",
      "marketplace",
      "consumer",
      "enterprise",
      "hardware",
      "services",
      "other",
    ])
    .optional(),
  companySize: z.enum(["solo", "small_2_10", "medium_11_50", "large_50_plus"]).optional(),
  companyStage: z.enum(["idea", "mvp", "early_revenue", "growth", "scale", "mature"]).optional(),
  decisionStyle: z.enum(["fast_intuitive", "balanced", "thorough_analytical"]).optional(),
  additionalContext: z.string().max(1000).optional(),
  preferences: z
    .object({
      preferredExperts: z.array(z.string()).optional(),
      defaultMode: z.enum(["quick", "deep", "flash"]).optional(),
      focusAreas: z.array(z.string()).optional(),
    })
    .optional(),
});

// ============================================================================
// ROUTER
// ============================================================================

export const userBackstoryRouter = router({
  /**
   * Get current user's backstory
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const [backstory] = await db
      .select()
      .from(userBackstory)
      .where(eq(userBackstory.userId, ctx.userId))
      .limit(1);

    return backstory || null;
  }),

  /**
   * Create or update user's backstory
   */
  upsert: protectedProcedure.input(backstorySchema).mutation(async ({ ctx, input }) => {
    // Check if backstory exists
    const [existing] = await db
      .select()
      .from(userBackstory)
      .where(eq(userBackstory.userId, ctx.userId))
      .limit(1);

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(userBackstory)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(userBackstory.userId, ctx.userId))
        .returning();

      return updated;
    } else {
      // Create new
      const [created] = await db
        .insert(userBackstory)
        .values({
          userId: ctx.userId,
          ...input,
        })
        .returning();

      return created;
    }
  }),

  /**
   * Check if user has completed onboarding
   */
  hasCompleted: protectedProcedure.query(async ({ ctx }) => {
    const [backstory] = await db
      .select()
      .from(userBackstory)
      .where(eq(userBackstory.userId, ctx.userId))
      .limit(1);

    // Consider onboarding complete if at least role and industry are set
    const isComplete = Boolean(backstory?.role && backstory?.industry);

    return {
      completed: isComplete,
      backstory: backstory || null,
    };
  }),

  /**
   * Delete user's backstory
   */
  delete: protectedProcedure.mutation(async ({ ctx }) => {
    await db.delete(userBackstory).where(eq(userBackstory.userId, ctx.userId));

    return { success: true };
  }),

  /**
   * Get backstory summary (for AI context)
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const [backstory] = await db
      .select()
      .from(userBackstory)
      .where(eq(userBackstory.userId, ctx.userId))
      .limit(1);

    if (!backstory) {
      return null;
    }

    // Generate human-readable summary
    const parts: string[] = [];

    if (backstory.role) {
      const roleLabel = backstory.role.replace(/_/g, " ");
      parts.push(`Role: ${roleLabel}`);
    }

    if (backstory.companyName) {
      parts.push(`Company: ${backstory.companyName}`);
    }

    if (backstory.industry) {
      const industryLabel = backstory.industry.replace(/_/g, " ");
      parts.push(`Industry: ${industryLabel}`);
    }

    if (backstory.companyStage) {
      const stageLabel = backstory.companyStage.replace(/_/g, " ");
      parts.push(`Stage: ${stageLabel}`);
    }

    if (backstory.decisionStyle) {
      const styleLabel = backstory.decisionStyle.replace(/_/g, " ");
      parts.push(`Decision Style: ${styleLabel}`);
    }

    return {
      summary: parts.join(" | "),
      backstory,
    };
  }),
});
