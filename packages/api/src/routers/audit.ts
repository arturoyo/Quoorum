import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { auditLogs, type AuditAction, type AuditDetails } from "@quoorum/db";

const actionSchema = z.enum([
  "deliberation.created",
  "deliberation.started",
  "deliberation.paused",
  "deliberation.completed",
  "deliberation.cancelled",
  "round.started",
  "round.completed",
  "opinion.submitted",
  "vote.cast",
  "consensus.reached",
  "expert.added",
  "expert.removed",
  "settings.changed",
]) satisfies z.ZodType<AuditAction>;

const detailsSchema = z.object({
  previousValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
  metadata: z.record(z.unknown()).optional(),
}) satisfies z.ZodType<AuditDetails>;

export const auditRouter = router({
  list: publicProcedure
    .input(
      z.object({
        deliberationId: z.string().uuid().optional(),
        userId: z.string().uuid().optional(),
        action: actionSchema.optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt));

      if (input.deliberationId) {
        query = query.where(eq(auditLogs.deliberationId, input.deliberationId)) as typeof query;
      }

      if (input.userId) {
        query = query.where(eq(auditLogs.userId, input.userId)) as typeof query;
      }

      if (input.action) {
        query = query.where(eq(auditLogs.action, input.action)) as typeof query;
      }

      return query.limit(input.limit).offset(input.offset);
    }),

  create: protectedProcedure
    .input(
      z.object({
        action: actionSchema,
        deliberationId: z.string().uuid().optional(),
        entityType: z.string().max(100).optional(),
        entityId: z.string().uuid().optional(),
        details: detailsSchema.optional(),
        ipAddress: z.string().max(45).optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(auditLogs)
        .values({
          ...input,
          userId: ctx.user.id,
        })
        .returning();
      return result[0]!;
    }),

  getByEntity: publicProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.entityType, input.entityType),
            eq(auditLogs.entityId, input.entityId)
          )
        )
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit);
    }),
});
