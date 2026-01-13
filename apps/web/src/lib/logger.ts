/**
 * Cliente de logging para frontend
 * Envía logs al backend via fetch (HTTP)
 *
 * Uso:
 * import { logger } from '@/lib/logger'
 *
 * logger.info('Debate created', { debateId: '123' })
 * logger.error('Failed to create debate', error)
 */

const isDev = process.env.NODE_ENV === "development";
const MAX_BATCH_SIZE = 20;
const BATCH_INTERVAL_MS = 10000; // 10 segundos (más largo que backend)

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

interface LogEntry {
  level: LogLevel;
  source: "client";
  message: string;
  metadata?: Record<string, unknown>;
  errorName?: string;
  errorMessage?: string;
  errorStack?: string;
}

// ═══════════════════════════════════════════════════════════
// BATCH QUEUE
// ═══════════════════════════════════════════════════════════
let batchQueue: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushBatch() {
  if (batchQueue.length === 0) return;

  const logsToSend = [...batchQueue];
  batchQueue = [];

  try {
    // Enviar batch via fetch (no podemos usar tRPC hooks fuera de React components)
    const response = await fetch("/api/trpc/systemLogs.createBatch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: logsToSend,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send logs: ${response.status}`);
    }
  } catch (error) {
    // Si falla el envío, logear en consola como fallback
    if (isDev) {
      console.error("[Logger] Failed to send batch:", error);
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

  // Flush inmediato si queue está lleno o es error crítico
  if (batchQueue.length >= MAX_BATCH_SIZE || entry.level === "error" || entry.level === "fatal") {
    void flushBatch();
  } else {
    scheduleBatchFlush();
  }
}

// ═══════════════════════════════════════════════════════════
// AUTO-CAPTURE DE ERRORES NO MANEJADOS
// ═══════════════════════════════════════════════════════════
if (typeof window !== "undefined") {
  // Capturar errores no manejados
  window.addEventListener("error", (event) => {
    logger.error("Unhandled error", event.error, {
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  });

  // Capturar promesas rechazadas sin catch
  window.addEventListener("unhandledrejection", (event) => {
    logger.error("Unhandled promise rejection", event.reason, {
      url: window.location.href,
    });
  });

  // Flush antes de cerrar la página
  window.addEventListener("beforeunload", () => {
    void flushBatch();
  });
}

// ═══════════════════════════════════════════════════════════
// LOGGER API
// ═══════════════════════════════════════════════════════════
class ClientLogger {
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

      logFn(`[${level.toUpperCase()}] ${message}`, errorOrMetadata, metadata);
    }

    // Preparar entry
    const entry: LogEntry = {
      level,
      source: "client",
      message,
    };

    // Agregar metadata del browser
    const browserMetadata: Record<string, unknown> = {
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };

    if (errorOrMetadata instanceof Error) {
      entry.errorName = errorOrMetadata.name;
      entry.errorMessage = errorOrMetadata.message;
      entry.errorStack = errorOrMetadata.stack;
      entry.metadata = { ...browserMetadata, ...metadata };
    } else if (errorOrMetadata) {
      entry.metadata = { ...browserMetadata, ...errorOrMetadata };
    } else {
      entry.metadata = browserMetadata;
    }

    // Añadir a batch
    addToBatch(entry);
  }

  /**
   * DEBUG: Solo en desarrollo con DEBUG=true
   */
  debug(message: string, metadata?: Record<string, unknown>) {
    if (isDev && process.env.NEXT_PUBLIC_DEBUG) {
      this.log("debug", message, metadata);
    }
  }

  /**
   * INFO: Información general
   */
  info(message: string, metadata?: Record<string, unknown>) {
    this.log("info", message, metadata);
  }

  /**
   * WARN: Advertencias
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
   * FATAL: Errores críticos
   */
  fatal(
    message: string,
    errorOrMetadata?: Error | Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) {
    this.log("fatal", message, errorOrMetadata, metadata);
    void flushBatch(); // Flush inmediato
  }

  /**
   * TRACK: Eventos de analytics
   */
  track(event: string, properties?: Record<string, unknown>) {
    this.info(`[Event] ${event}`, properties);
  }

  /**
   * Flush manual
   */
  async flush() {
    await flushBatch();
  }
}

// ═══════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════
export const logger = new ClientLogger();

export default logger;
