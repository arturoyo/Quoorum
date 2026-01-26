import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { db } from "@quoorum/db";
import { notificationSettings } from "@quoorum/db/schema";
import { eq } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════
// SCHEMAS DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════
const updateNotificationSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  debateUpdates: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  securityAlerts: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});

// ═══════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════
export const notificationSettingsRouter = router({
  /**
   * Obtener configuración de notificaciones del usuario
   * Crea configuración por defecto si no existe
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    // ctx.userId es profiles.id (referenciado por notification_settings.user_id)
    // ctx.user.id es users.id (NO usar para notification_settings)
    if (!ctx.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Usuario no autenticado",
      });
    }

    // Buscar configuración existente
    const [existing] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, ctx.userId));

    // Si no existe, crear con valores por defecto
    if (!existing) {
      const [created] = await db
        .insert(notificationSettings)
        .values({
          userId: ctx.userId,
          emailNotifications: true,
          debateUpdates: true,
          weeklyDigest: true,
          pushNotifications: false,
          securityAlerts: true,
          marketingEmails: false,
        })
        .returning();

      return created;
    }

    return existing;
  }),

  /**
   * Actualizar configuración de notificaciones
   */
  update: protectedProcedure
    .input(updateNotificationSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      // ctx.userId es profiles.id (referenciado por notification_settings.user_id)
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuario no autenticado",
        });
      }

      // Buscar configuración existente
      const [existing] = await db
        .select({ id: notificationSettings.id })
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, ctx.userId));

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Configuración de notificaciones no encontrada",
        });
      }

      // Actualizar
      const [updated] = await db
        .update(notificationSettings)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(notificationSettings.userId, ctx.userId))
        .returning();

      return updated;
    }),
});
