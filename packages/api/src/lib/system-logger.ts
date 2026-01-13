/**
 * Sistema de logging propio de Quoorum
 * Reemplaza Sentry/PostHog con almacenamiento en Supabase
 *
 * Uso:
 * import { systemLogger } from '@quoorum/api/lib/system-logger'
 *
 * systemLogger.info('Usuario creado', { userId: '123' })
 * systemLogger.error('Error al crear usuario', error, { userId: '123' })
 */

import { db } from "@quoorum/db";
import { systemLogs } from "@quoorum/db/schema";

const isDev = process.env.NODE_ENV === "development";
const MAX_BATCH_SIZE = 50;
const BATCH_INTERVAL_MS = 5000; // 5 segundos

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
type LogSource = "client" | "server" | "worker" | "cron";

interface LogEntry {
  level: LogLevel;
  source: LogSource;
  message: string;
  metadata?: Record<string, unknown>;
  errorName?: string;
  errorMessage?: string;
  errorStack?: string;
  durationMs?: number;
  userId?: string | null;
}

// ═══════════════════════════════════════════════════════════
// BATCH QUEUE (para mejor performance)
// ═══════════════════════════════════════════════════════════
let batchQueue: LogEntry[] = [];
let flushTimer: NodeJS.Timeout | null = null;

async function flushBatch() {
  if (batchQueue.length === 0) return;

  const logsToInsert = [...batchQueue];
  batchQueue = [];

  try {
    await db.insert(systemLogs).values(logsToInsert);
  } catch (error) {
    // Si falla, logear en consola como fallback
    if (isDev) {
      // eslint-disable-next-line no-console
      console.error("[SystemLogger] Failed to insert batch:", error);
    }
  }
}

function scheduleBatchFlush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
  }

  flushTimer = setTimeout(() => {
    void flushBatch();
  }, BATCH_INTERVAL_MS);
}

function addToBatch(entry: LogEntry) {
  batchQueue.push(entry);

  // Flush inmediato si:
  // 1. Queue está lleno
  // 2. Es un error crítico (error/fatal)
  if (batchQueue.length >= MAX_BATCH_SIZE || entry.level === "error" || entry.level === "fatal") {
    void flushBatch();
  } else {
    scheduleBatchFlush();
  }
}

// ═══════════════════════════════════════════════════════════
// LOGGER CLASS
// ═══════════════════════════════════════════════════════════
class SystemLogger {
  private source: LogSource = "server";
  private userId: string | null = null;

  /**
   * Configura el source del logger (client, server, worker, cron)
   */
  setSource(source: LogSource) {
    this.source = source;
  }

  /**
   * Configura el userId para logs asociados a un usuario
   */
  setUserId(userId: string | null) {
    this.userId = userId;
  }

  /**
   * Crea un logger con contexto específico
   */
  withContext(context: { source?: LogSource; userId?: string }) {
    const logger = new SystemLogger();
    logger.source = context.source || this.source;
    logger.userId = context.userId || this.userId;
    return logger;
  }

  private log(
    level: LogLevel,
    message: string,
    errorOrMetadata?: Error | Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) {
    // Log en consola en desarrollo
    if (isDev) {
      const logFn =
        level === "error" || level === "fatal"
          ? console.error
          : level === "warn"
            ? console.warn
            : console.log;

      // eslint-disable-next-line no-console
      logFn(`[${level.toUpperCase()}] ${message}`, errorOrMetadata, metadata);
    }

    // Preparar entry para DB
    const entry: LogEntry = {
      level,
      source: this.source,
      message,
      userId: this.userId,
    };

    if (errorOrMetadata instanceof Error) {
      entry.errorName = errorOrMetadata.name;
      entry.errorMessage = errorOrMetadata.message;
      entry.errorStack = errorOrMetadata.stack;
      entry.metadata = metadata;
    } else if (errorOrMetadata) {
      entry.metadata = errorOrMetadata;
    }

    // Añadir a batch para insertar
    addToBatch(entry);
  }

  /**
   * DEBUG: Información detallada para debugging
   * Solo se loguea si DEBUG=true
   */
  debug(message: string, metadata?: Record<string, unknown>) {
    if (isDev && process.env.DEBUG) {
      this.log("debug", message, metadata);
    }
  }

  /**
   * INFO: Información general del sistema
   */
  info(message: string, metadata?: Record<string, unknown>) {
    this.log("info", message, metadata);
  }

  /**
   * WARN: Advertencias que no son errores
   */
  warn(message: string, metadata?: Record<string, unknown>) {
    this.log("warn", message, metadata);
  }

  /**
   * ERROR: Errores manejables
   */
  error(
    message: string,
    errorOrMetadata?: Error | Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) {
    this.log("error", message, errorOrMetadata, metadata);
  }

  /**
   * FATAL: Errores críticos que requieren atención inmediata
   */
  fatal(
    message: string,
    errorOrMetadata?: Error | Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) {
    this.log("fatal", message, errorOrMetadata, metadata);

    // Flush inmediato para logs críticos
    void flushBatch();
  }

  /**
   * PERFORMANCE: Medir duración de operaciones
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      this.info(`${operation} completed`, {
        ...metadata,
        durationMs: duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.error(`${operation} failed`, error as Error, {
        ...metadata,
        durationMs: duration,
      });

      throw error;
    }
  }

  /**
   * Flush manual del batch (útil al cerrar la app)
   */
  async flush() {
    await flushBatch();
  }
}

// ═══════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════
export const systemLogger = new SystemLogger();

// Cleanup on process exit
if (typeof process !== "undefined") {
  process.on("beforeExit", () => {
    void systemLogger.flush();
  });
}

export default systemLogger;
