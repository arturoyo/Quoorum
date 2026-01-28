import { z } from "zod";
import { router, protectedProcedure, publicProcedure, adminProcedure } from "../trpc";
import { db } from "@quoorum/db";
import { systemLogs } from "@quoorum/db/schema";
import { desc, and, eq, gte, lte, like, or } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════
// SCHEMAS DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════
const logLevelSchema = z.enum(["debug", "info", "warn", "error", "fatal"]);
const logSourceSchema = z.enum(["client", "server", "worker", "cron"]);

const createLogSchema = z.object({
  level: logLevelSchema,
  source: logSourceSchema,
  message: z.string().min(1).max(1000),
  metadata: z.record(z.unknown()).optional(),
  errorName: z.string().max(255).optional(),
  errorMessage: z.string().optional(),
  errorStack: z.string().optional(),
  durationMs: z.number().optional(),
});

const listLogsSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  level: logLevelSchema.optional(),
  source: logSourceSchema.optional(),
  userId: z.string().uuid().optional(),
  search: z.string().optional(), // Buscar en message
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const statsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ═══════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════
export const systemLogsRouter = router({
  // -----------------------------------------------------------
  // CREATE: Insertar log (requiere autenticación)
  // SECURITY FIX: Changed from publicProcedure to protectedProcedure
  // -----------------------------------------------------------
  create: protectedProcedure
    .input(createLogSchema)
    .mutation(async ({ ctx, input }) => {
      // Sanitize metadata to prevent injection
      const sanitizedMetadata = input.metadata
        ? JSON.parse(JSON.stringify(input.metadata))
        : undefined;

      const [log] = await db
        .insert(systemLogs)
        .values({
          ...input,
          metadata: sanitizedMetadata,
          userId: ctx.userId, // Now requires authenticated user
        })
        .returning();

      return log;
    }),

  // -----------------------------------------------------------
  // BATCH CREATE: Insertar múltiples logs (requiere autenticación)
  // SECURITY FIX: Changed from publicProcedure to protectedProcedure
  // -----------------------------------------------------------
  createBatch: protectedProcedure
    .input(z.array(createLogSchema).max(50)) // Reduced max to 50 for rate limiting
    .mutation(async ({ ctx, input }) => {
      if (input.length === 0) return [];

      const logs = await db
        .insert(systemLogs)
        .values(
          input.map((log) => ({
            ...log,
            // Sanitize metadata
            metadata: log.metadata
              ? JSON.parse(JSON.stringify(log.metadata))
              : undefined,
            userId: ctx.userId, // Now requires authenticated user
          }))
        )
        .returning();

      return logs;
    }),

  // -----------------------------------------------------------
  // LIST: Obtener logs con filtros (solo admins)
  // -----------------------------------------------------------
  list: adminProcedure
    .input(listLogsSchema)
    .query(async ({ input }) => {
      // Admin verification handled by adminProcedure middleware

      const { limit, offset, level, source, userId, search, startDate, endDate } = input;

      // Construir condiciones
      const conditions = [];

      if (level) {
        conditions.push(eq(systemLogs.level, level));
      }

      if (source) {
        conditions.push(eq(systemLogs.source, source));
      }

      if (userId) {
        conditions.push(eq(systemLogs.userId, userId));
      }

      if (search) {
        conditions.push(
          or(
            like(systemLogs.message, `%${search}%`),
            like(systemLogs.errorMessage, `%${search}%`)
          )
        );
      }

      if (startDate) {
        conditions.push(gte(systemLogs.createdAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(systemLogs.createdAt, new Date(endDate)));
      }

      const logs = await db
        .select()
        .from(systemLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(systemLogs.createdAt))
        .limit(limit)
        .offset(offset);

      // Contar total para paginación
      const countResult = await db
        .select({ count: db.$count(systemLogs) })
        .from(systemLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const count = countResult[0]?.count ?? 0;

      return {
        logs,
        total: Number(count),
        hasMore: offset + limit < Number(count),
      };
    }),

  // -----------------------------------------------------------
  // STATS: Estadísticas de logs (solo admins)
  // -----------------------------------------------------------
  stats: adminProcedure
    .input(statsSchema)
    .query(async ({ input }) => {
      // Admin verification handled by adminProcedure middleware

      const { startDate, endDate } = input;

      const conditions = [];
      if (startDate) {
        conditions.push(gte(systemLogs.createdAt, new Date(startDate)));
      }
      if (endDate) {
        conditions.push(lte(systemLogs.createdAt, new Date(endDate)));
      }

      // Total logs
      const totalResult = await db
        .select({ total: db.$count(systemLogs) })
        .from(systemLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = totalResult[0]?.total ?? 0;

      // Por nivel
      const byLevel = await db
        .select({
          level: systemLogs.level,
          count: db.$count(systemLogs),
        })
        .from(systemLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(systemLogs.level);

      // Por source
      const bySource = await db
        .select({
          source: systemLogs.source,
          count: db.$count(systemLogs),
        })
        .from(systemLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(systemLogs.source);

      return {
        total: Number(total),
        byLevel: byLevel.map((row) => ({
          level: row.level,
          count: Number(row.count),
        })),
        bySource: bySource.map((row) => ({
          source: row.source,
          count: Number(row.count),
        })),
      };
    }),

  // -----------------------------------------------------------
  // DELETE OLD: Eliminar logs antiguos (solo admins, para limpieza)
  // -----------------------------------------------------------
  deleteOld: adminProcedure
    .input(
      z.object({
        olderThanDays: z.number().min(1).max(365).default(30),
      })
    )
    .mutation(async ({ input }) => {
      // Admin verification handled by adminProcedure middleware

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - input.olderThanDays);

      const deleted = await db
        .delete(systemLogs)
        .where(lte(systemLogs.createdAt, cutoffDate))
        .returning({ id: systemLogs.id });

      return { deletedCount: deleted.length };
    }),
});
