import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "../trpc";
import { systemLogger } from "../lib/system-logger";

/**
 * Router para testear el sistema de logging
 * ADMIN ONLY - Protected endpoints for debugging
 */

// Environment check middleware
const isDevelopment = process.env.NODE_ENV === "development";

export const testLoggingRouter = router({
  /**
   * Test básico: Insertar logs de todos los niveles
   */
  testAllLevels: adminProcedure.query(async () => {
    if (!isDevelopment) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Test logging only available in development mode",
      });
    }
    systemLogger.debug("Test debug log", { test: true });
    systemLogger.info("Test info log", { test: true });
    systemLogger.warn("Test warn log", { test: true });
    systemLogger.error("Test error log", new Error("Test error"), { test: true });
    systemLogger.fatal("Test fatal log", new Error("Test fatal error"), { test: true });

    return {
      success: true,
      message: "5 logs created (debug, info, warn, error, fatal)",
      redirectTo: "/admin/logs",
    };
  }),

  /**
   * Test performance: Medir duración de operación
   */
  testPerformance: adminProcedure.query(async () => {
    if (!isDevelopment) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Test logging only available in development mode",
      });
    }
    const result = await systemLogger.measure(
      "Test operation",
      async () => {
        // Simular operación lenta
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { data: "test" };
      },
      { test: true }
    );

    return {
      success: true,
      message: "Performance log created with duration",
      result,
    };
  }),

  /**
   * Test batch: Insertar múltiples logs rápidamente
   */
  testBatch: adminProcedure
    .input(z.object({ count: z.number().min(1).max(100).default(10) }))
    .query(async ({ input }) => {
      if (!isDevelopment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Test logging only available in development mode",
        });
      }
      for (let i = 0; i < input.count; i++) {
        systemLogger.info(`Batch test log ${i + 1}`, {
          test: true,
          batchIndex: i,
        });
      }

      // Flush manualmente para asegurar que se envíen
      await systemLogger.flush();

      return {
        success: true,
        message: `${input.count} logs created in batch`,
      };
    }),

  /**
   * Test con userId: Log asociado a un usuario
   */
  testWithUser: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      if (!isDevelopment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Test logging only available in development mode",
        });
      }
      const logger = systemLogger.withContext({
        userId: input.userId,
        source: "server",
      });

      logger.info("User action test", {
        test: true,
        action: "test_logging",
      });

      return {
        success: true,
        message: `Log created for user ${input.userId}`,
      };
    }),
});
