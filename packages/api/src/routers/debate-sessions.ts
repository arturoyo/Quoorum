/**
 * Debate Sessions Router
 * Gateway Control Plane: pause, resume, inject context, force consensus.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { db } from "@quoorum/db";
import { debateSessions, profiles } from "@quoorum/db/schema";

// ============================================
// ROUTER
// ============================================

export const debateSessionsRouter = router({
  // Get current session state for a debate
  getState: protectedProcedure
    .input(z.object({ debateId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, ctx.userId),
      });
      if (!profile) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Profile not found" });
      }

      const [session] = await db
        .select()
        .from(debateSessions)
        .where(and(
          eq(debateSessions.debateId, input.debateId),
          eq(debateSessions.createdBy, profile.id),
        ));

      return session ?? null;
    }),

  // Create a new session for a debate
  create: protectedProcedure
    .input(z.object({
      debateId: z.string().uuid(),
      maxRounds: z.number().int().min(1).max(50).default(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, ctx.userId),
      });
      if (!profile) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Profile not found" });
      }

      const [session] = await db
        .insert(debateSessions)
        .values({
          debateId: input.debateId,
          maxRounds: input.maxRounds,
          createdBy: profile.id,
          state: 'initializing',
          startedAt: new Date(),
        })
        .returning();

      return session;
    }),

  // Pause a running debate
  pause: protectedProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      reason: z.string().max(255).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, ctx.userId),
      });
      if (!profile) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Profile not found" });
      }

      const [session] = await db
        .select()
        .from(debateSessions)
        .where(and(
          eq(debateSessions.id, input.sessionId),
          eq(debateSessions.createdBy, profile.id),
        ));

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }
      if (session.state !== 'running') {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Session is not running" });
      }

      const [updated] = await db
        .update(debateSessions)
        .set({
          state: 'paused',
          pausedAt: new Date(),
          pausedBy: profile.id,
          pauseReason: input.reason,
          updatedAt: new Date(),
        })
        .where(eq(debateSessions.id, input.sessionId))
        .returning();

      return updated;
    }),

  // Resume a paused debate
  resume: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, ctx.userId),
      });
      if (!profile) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Profile not found" });
      }

      const [session] = await db
        .select()
        .from(debateSessions)
        .where(and(
          eq(debateSessions.id, input.sessionId),
          eq(debateSessions.createdBy, profile.id),
        ));

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }
      if (session.state !== 'paused') {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Session is not paused" });
      }

      const [updated] = await db
        .update(debateSessions)
        .set({
          state: 'running',
          pausedAt: null,
          pausedBy: null,
          pauseReason: null,
          updatedAt: new Date(),
        })
        .where(eq(debateSessions.id, input.sessionId))
        .returning();

      return updated;
    }),

  // Inject additional context mid-debate
  addContext: protectedProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      text: z.string().min(1).max(5000),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, ctx.userId),
      });
      if (!profile) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Profile not found" });
      }

      const [session] = await db
        .select()
        .from(debateSessions)
        .where(and(
          eq(debateSessions.id, input.sessionId),
          eq(debateSessions.createdBy, profile.id),
        ));

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }

      const currentContext = (session.additionalContext ?? []) as Array<{
        text: string
        injectedAt: string
        injectedBy: string
      }>;

      const newContext = [
        ...currentContext,
        {
          text: input.text,
          injectedAt: new Date().toISOString(),
          injectedBy: profile.id,
        },
      ];

      const [updated] = await db
        .update(debateSessions)
        .set({
          additionalContext: newContext,
          updatedAt: new Date(),
        })
        .where(eq(debateSessions.id, input.sessionId))
        .returning();

      return updated;
    }),

  // Force consensus / conclude debate
  forceConsensus: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, ctx.userId),
      });
      if (!profile) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Profile not found" });
      }

      const [session] = await db
        .select()
        .from(debateSessions)
        .where(and(
          eq(debateSessions.id, input.sessionId),
          eq(debateSessions.createdBy, profile.id),
        ));

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }
      if (session.state !== 'running' && session.state !== 'paused') {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Session cannot be force concluded" });
      }

      const [updated] = await db
        .update(debateSessions)
        .set({
          state: 'force_concluded',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(debateSessions.id, input.sessionId))
        .returning();

      return updated;
    }),

  // Update live metadata (called by debate runner)
  updateMetadata: protectedProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      currentRound: z.number().int().optional(),
      state: z.enum(['initializing', 'running', 'paused', 'waiting_input', 'consensus_reached', 'force_concluded', 'failed', 'completed']).optional(),
      liveMetadata: z.object({
        consensusScore: z.number().optional(),
        dominantPosition: z.string().optional(),
        activeExperts: z.array(z.string()).optional(),
        lastRoundSummary: z.string().optional(),
        argumentCount: z.number().optional(),
      }).optional(),
      errorMessage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if (input.currentRound !== undefined) updateData.currentRound = input.currentRound;
      if (input.state !== undefined) updateData.state = input.state;
      if (input.liveMetadata !== undefined) updateData.liveMetadata = input.liveMetadata;
      if (input.errorMessage !== undefined) updateData.errorMessage = input.errorMessage;
      if (input.state === 'completed' || input.state === 'consensus_reached') {
        updateData.completedAt = new Date();
      }

      const [updated] = await db
        .update(debateSessions)
        .set(updateData)
        .where(eq(debateSessions.id, input.sessionId))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }

      return updated;
    }),
});
