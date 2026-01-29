/**
 * Integration Pairings Router
 * Generate, complete, list, and revoke pairing codes for Slack/Discord bots.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, gt } from "drizzle-orm";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "@quoorum/db";
import { integrationPairings, profiles } from "@quoorum/db/schema";
import crypto from "crypto";

// ============================================
// HELPERS
// ============================================

function generatePairingCode(): string {
  // 8-char uppercase alphanumeric (no ambiguous chars like 0/O, 1/I/L)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = crypto.randomBytes(8)
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('')
}

// ============================================
// ROUTER
// ============================================

export const integrationPairingsRouter = router({
  // List active pairings for a company
  list: protectedProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, ctx.userId),
      });
      if (!profile) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Profile not found" });
      }

      return db
        .select()
        .from(integrationPairings)
        .where(eq(integrationPairings.companyId, input.companyId))
        .orderBy(desc(integrationPairings.createdAt));
    }),

  // Generate a new pairing code
  createPairing: protectedProcedure
    .input(z.object({
      companyId: z.string().uuid(),
      platform: z.enum(["slack", "discord", "teams"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, ctx.userId),
      });
      if (!profile) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Profile not found" });
      }

      const code = generatePairingCode()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min TTL

      const [pairing] = await db
        .insert(integrationPairings)
        .values({
          companyId: input.companyId,
          createdBy: profile.id,
          pairingCode: code,
          platform: input.platform,
          expiresAt,
        })
        .returning();

      return pairing;
    }),

  // Complete pairing (called by bot via API key or webhook)
  completePairing: publicProcedure
    .input(z.object({
      pairingCode: z.string().length(8),
      externalId: z.string().min(1).max(255),
      externalChannelId: z.string().max(255).optional(),
      externalName: z.string().max(255).optional(),
    }))
    .mutation(async ({ input }) => {
      const [pairing] = await db
        .select()
        .from(integrationPairings)
        .where(and(
          eq(integrationPairings.pairingCode, input.pairingCode),
          eq(integrationPairings.status, 'pending'),
          gt(integrationPairings.expiresAt, new Date()),
        ));

      if (!pairing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired pairing code",
        });
      }

      const [completed] = await db
        .update(integrationPairings)
        .set({
          status: 'completed',
          externalId: input.externalId,
          externalChannelId: input.externalChannelId,
          externalName: input.externalName,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(integrationPairings.id, pairing.id))
        .returning();

      return { success: true, companyId: completed.companyId };
    }),

  // Revoke a pairing
  revoke: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, ctx.userId),
      });
      if (!profile) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Profile not found" });
      }

      const [existing] = await db
        .select()
        .from(integrationPairings)
        .where(eq(integrationPairings.id, input.id));

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pairing not found" });
      }

      await db
        .update(integrationPairings)
        .set({
          status: 'revoked',
          revokedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(integrationPairings.id, input.id));

      return { success: true };
    }),
});
