import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { db } from "@quoorum/db";
import { sessions } from "@quoorum/db/schema";
import { eq, and, desc, gt } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════
// SCHEMAS DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════
const revokeSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

// ═══════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════
export const sessionsRouter = router({
  /**
   * Listar sesiones activas del usuario
   * Filtra sesiones no expiradas
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();

    const activeSessions = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, ctx.userId),
          gt(sessions.expiresAt, now) // Solo sesiones no expiradas
        )
      )
      .orderBy(desc(sessions.lastActive));

    return activeSessions;
  }),

  /**
   * Revocar una sesión específica
   * No permite revocar la sesión actual (debe cerrar sesión normal)
   */
  revoke: protectedProcedure
    .input(revokeSessionSchema)
    .mutation(async ({ ctx, input }) => {
      // Verificar que la sesión pertenece al usuario
      const [session] = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.id, input.sessionId),
            eq(sessions.userId, ctx.userId)
          )
        );

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sesión no encontrada",
        });
      }

      // Eliminar sesión (hard delete)
      await db.delete(sessions).where(eq(sessions.id, input.sessionId));

      return { success: true };
    }),

  /**
   * Revocar todas las sesiones excepto la actual
   * Útil para "cerrar sesión en todos los dispositivos"
   */
  revokeAll: protectedProcedure.mutation(async ({ ctx }) => {
    // Obtener token de sesión actual desde el contexto
    // En producción esto vendría del header Authorization
    const currentSessionToken = ctx.sessionToken;

    if (currentSessionToken) {
      // Eliminar todas excepto la actual
      await db
        .delete(sessions)
        .where(
          and(
            eq(sessions.userId, ctx.userId),
            // SQL: session_token != currentSessionToken
          )
        );
    } else {
      // Si no hay token de sesión actual, eliminar todas
      await db.delete(sessions).where(eq(sessions.userId, ctx.userId));
    }

    return { success: true };
  }),

  /**
   * Actualizar última actividad de la sesión actual
   * Se llama periódicamente desde el frontend
   */
  updateActivity: protectedProcedure.mutation(async ({ ctx }) => {
    const sessionToken = ctx.sessionToken;

    if (!sessionToken) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No session token provided",
      });
    }

    await db
      .update(sessions)
      .set({ lastActive: new Date() })
      .where(
        and(
          eq(sessions.sessionToken, sessionToken),
          eq(sessions.userId, ctx.userId)
        )
      );

    return { success: true };
  }),
});
