import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";
import { systemLogger } from "../lib/system-logger.js";

/**
 * Router para testear el sistema de logging
 * Solo para desarrollo - eliminar en producción
 */
export const testLoggingRouter = router({
  /**
   * Test básico: Insertar logs de todos los niveles
   */
  testAllLevels: publicProcedure.query(async () => {
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
  testPerformance: publicProcedure.query(async () => {
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
  testBatch: publicProcedure
    .input(z.object({ count: z.number().min(1).max(100).default(10) }))
    .query(async ({ input }) => {
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
  testWithUser: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
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
