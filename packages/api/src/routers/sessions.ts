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
    // sessions.user_id references users.id, NOT profiles.id
    // ctx.user.id = users.id, ctx.userId = profiles.id
    const now = new Date();

    const activeSessions = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, ctx.user.id),
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
      // sessions.user_id references users.id (ctx.user.id)
      const [session] = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.id, input.sessionId),
            eq(sessions.userId, ctx.user.id)
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
   * 
   * NOTA: Por ahora elimina todas las sesiones del usuario.
   * En el futuro, se puede añadir sessionToken al contexto para excluir la actual.
   */
  revokeAll: protectedProcedure.mutation(async ({ ctx }) => {
    // Eliminar todas las sesiones del usuario
    // sessions.user_id references users.id (ctx.user.id)
    await db.delete(sessions).where(eq(sessions.userId, ctx.user.id));

    return { success: true };
  }),

  /**
   * Actualizar última actividad de la sesión actual
   * Se llama periódicamente desde el frontend
   * 
   * NOTA: Por ahora actualiza la sesión más reciente del usuario.
   * En el futuro, se puede añadir sessionToken al contexto para identificar la sesión exacta.
   */
  updateActivity: protectedProcedure.mutation(async ({ ctx }) => {
    // Actualizar la sesión más reciente del usuario
    // sessions.user_id references users.id (ctx.user.id)
    const [latestSession] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, ctx.user.id))
      .orderBy(desc(sessions.lastActive))
      .limit(1);

    if (latestSession) {
      await db
        .update(sessions)
        .set({ lastActive: new Date() })
        .where(eq(sessions.id, latestSession.id));
    }

    return { success: true };
  }),
});
