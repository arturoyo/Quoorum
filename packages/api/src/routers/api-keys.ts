import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { db } from "@quoorum/db";
import { apiKeys } from "@quoorum/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";

// ═══════════════════════════════════════════════════════════
// SCHEMAS DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════
const createApiKeySchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
});

const deleteApiKeySchema = z.object({
  id: z.string().uuid(),
});

// ═══════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════
function generateApiKey(): { key: string; hash: string; prefix: string } {
  // Generar key aleatoria: quoorum_live_[32 chars random]
  const randomPart = randomBytes(24).toString("base64url"); // URL-safe base64
  const key = `quoorum_live_${randomPart}`;

  // Hash para almacenar en DB (nunca guardar la key en texto plano)
  const hash = createHash("sha256").update(key).digest("hex");

  // Prefix para mostrar al usuario (primeros 20 chars)
  const prefix = key.substring(0, 20) + "...";

  return { key, hash, prefix };
}

// ═══════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════
export const apiKeysRouter = router({
  /**
   * Listar API keys del usuario
   * No devuelve las keys completas, solo metadatos
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        prefix: apiKeys.prefix,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.userId, ctx.userId),
          eq(apiKeys.isActive, true) // Solo keys activas
        )
      )
      .orderBy(desc(apiKeys.createdAt));

    return keys;
  }),

  /**
   * Crear nueva API key
   * IMPORTANTE: La key completa solo se devuelve UNA VEZ
   */
  create: protectedProcedure
    .input(createApiKeySchema)
    .mutation(async ({ ctx, input }) => {
      const { key, hash, prefix } = generateApiKey();

      const [created] = await db
        .insert(apiKeys)
        .values({
          userId: ctx.userId,
          name: input.name,
          keyHash: hash,
          prefix,
        })
        .returning();

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create API key",
        });
      }

      // [WARNING] IMPORTANTE: Solo devolver la key AHORA
      // No se podrá recuperar después
      return {
        id: created.id,
        name: created.name,
        key, // ← Solo esta vez
        prefix: created.prefix,
        createdAt: created.createdAt,
      };
    }),

  /**
   * Eliminar (revocar) API key
   * Soft delete - marca como revocada pero no elimina
   */
  delete: protectedProcedure
    .input(deleteApiKeySchema)
    .mutation(async ({ ctx, input }) => {
      // Verificar propiedad
      const [existing] = await db
        .select({ id: apiKeys.id })
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.id, input.id),
            eq(apiKeys.userId, ctx.userId),
            eq(apiKeys.isActive, true)
          )
        );

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key no encontrada",
        });
      }

      // Soft delete
      await db
        .update(apiKeys)
        .set({ revokedAt: new Date() })
        .where(eq(apiKeys.id, input.id));

      return { success: true };
    }),

  /**
   * Verificar si una API key es válida
   * Usado internamente por el sistema de autenticación
   */
  verify: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input }) => {
      const hash = createHash("sha256").update(input.key).digest("hex");

      const [key] = await db
        .select()
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.keyHash, hash),
            eq(apiKeys.isActive, true) // Solo keys activas
          )
        );

      if (!key) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "API key inválida o revocada",
        });
      }

      // Actualizar lastUsedAt
      await db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, key.id));

      return {
        valid: true,
        userId: key.userId,
      };
    }),
});
