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
    // Enviar batch via fetch usando formato tRPC batch HTTP
    // Formato tRPC batch: { "0": { "json": <input>, "meta": { "values": {...} } } }
    // Para arrays, no necesitamos meta values
    const response = await fetch("/api/trpc/systemLogs.createBatch?batch=1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "0": {
          json: logsToSend,
        },
      }),
    });

    if (!response.ok) {
      // No lanzar error - solo logear en desarrollo
      // El logger no debe fallar si el servidor no está disponible
      if (isDev) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.warn("[Logger] Failed to send batch:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText.substring(0, 200), // Limitar longitud
        });
      }
      return; // Salir silenciosamente
    }
  } catch (error) {
    // Si falla el envío, logear en consola como fallback (solo en desarrollo)
    // NO lanzar error - el logger debe ser resiliente
    if (isDev) {
      console.warn("[Logger] Failed to send batch:", error instanceof Error ? error.message : String(error));
    }
    // En producción, fallar silenciosamente para no interrumpir la app
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
// LOGGER API
// ═══════════════════════════════════════════════════════════
class ClientLogger {
  /**
   * Serializa un error o objeto de forma segura para logging
   */
  private serializeForLogging(value: unknown): string {
    if (value === null || value === undefined) {
      return String(value);
    }

    if (value instanceof Error) {
      try {
        const errorObj: Record<string, unknown> = {
          name: value.name,
          message: value.message,
          stack: value.stack,
        };
        
        // Capturar propiedades adicionales si existen (status, code, etc.)
        const errorRecord = value as Record<string, unknown>;
        for (const key of ['status', 'statusText', 'code', 'cause', 'responseBody']) {
          if (key in errorRecord) {
            errorObj[key] = errorRecord[key];
          }
        }
        
        return JSON.stringify(errorObj, null, 2);
      } catch (e) {
        return `Error: ${value.name} - ${value.message}`;
      }
    }
    
    if (typeof value === 'object') {
      try {
        // Usar un Set para rastrear objetos visitados y evitar referencias circulares
        const visited = new WeakSet();
        
        return JSON.stringify(value, (key, val) => {
          // Evitar referencias circulares
          if (val && typeof val === 'object') {
            if (visited.has(val)) {
              return '[Circular Reference]';
            }
            visited.add(val);
          }
          
          // Serializar Errors anidados
          if (val instanceof Error) {
            return {
              name: val.name,
              message: val.message,
              stack: val.stack?.split('\n').slice(0, 5).join('\n'), // Limitar stack trace
            };
          }
          
          // Limitar strings muy largos
          if (typeof val === 'string' && val.length > 1000) {
            return val.substring(0, 1000) + '... [truncated]';
          }
          
          return val;
        }, 2);
      } catch (e) {
        // Si falla la serialización, intentar toString
        try {
          return String(value);
        } catch {
          return '[Object - cannot serialize]';
        }
      }
    }
    
    return String(value);
  }

  private log(
    level: LogLevel,
    message: string,
    errorOrMetadata?: Error | Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) {
    // Verificar si es un error UNAUTHORIZED o PAYMENT_REQUIRED antes de loggear
    // Estos errores son esperados y no deben loggearse
    if ((level === "error" || level === "fatal") && errorOrMetadata) {
      let shouldSilence = false;
      
      // Verificar si el mensaje contiene indicadores de UNAUTHORIZED o PAYMENT_REQUIRED
      if (typeof message === 'string') {
        if (message.includes('UNAUTHORIZED') || 
            message.includes('401 Unauthorized') ||
            message.includes('must be logged in') ||
            message.includes('No autenticado') ||
            message.includes('PAYMENT_REQUIRED') ||
            message.includes('402 Payment Required') ||
            message.includes('Créditos insuficientes')) {
          shouldSilence = true;
        }
      }
      
      // Verificar si el errorOrMetadata es un Error con mensaje UNAUTHORIZED
      if (!shouldSilence && errorOrMetadata instanceof Error) {
        const errorMsg = errorOrMetadata.message || '';
        if (errorMsg.includes('UNAUTHORIZED') || 
            errorMsg.includes('401 Unauthorized') ||
            errorMsg.includes('must be logged in') ||
            errorMsg.includes('No autenticado') ||
            errorMsg.includes('PAYMENT_REQUIRED') ||
            errorMsg.includes('402 Payment Required') ||
            errorMsg.includes('Créditos insuficientes')) {
          shouldSilence = true;
        }
        
        // Verificar propiedades del error
        const errorObj = errorOrMetadata as Record<string, unknown>;
        if (!shouldSilence && (errorObj.status === 401 || errorObj.status === 402)) {
          shouldSilence = true;
        }
      }
      
      // Verificar si el errorOrMetadata es un objeto con propiedades que indican UNAUTHORIZED
      if (!shouldSilence && errorOrMetadata && typeof errorOrMetadata === 'object' && !(errorOrMetadata instanceof Error)) {
        const errorObj = errorOrMetadata as Record<string, unknown>;
        if (errorObj.status === 401 || errorObj.status === 402 ||
            (errorObj.errorInfo && typeof errorObj.errorInfo === 'object')) {
          const errorInfo = errorObj.errorInfo as Record<string, unknown>;
          if (errorInfo.type === 'unauthorized' || errorInfo.type === 'payment-required') {
            shouldSilence = true;
          }
        }
      }
      
      // Si es un error esperado, no loggearlo
      if (shouldSilence) {
        return;
      }
    }

    // Log en consola en desarrollo
    if (isDev) {
      const logFn =
        level === "error" || level === "fatal"
          ? console.error
          : level === "warn"
            ? console.warn
            : console.log;

      // Serializar errores y objetos complejos para mejor visualización
      try {
        if (errorOrMetadata) {
          const serialized = this.serializeForLogging(errorOrMetadata);
          const metadataSerialized = metadata ? this.serializeForLogging(metadata) : '';
          // Usar console.log con formato claro para evitar problemas de serialización
          logFn(`[${level.toUpperCase()}] ${message}\n${serialized}${metadataSerialized ? '\n' + metadataSerialized : ''}`);
        } else {
          const metadataSerialized = metadata ? this.serializeForLogging(metadata) : '';
          logFn(`[${level.toUpperCase()}] ${message}${metadataSerialized ? '\n' + metadataSerialized : ''}`);
        }
      } catch (serializeError) {
        // Fallback si la serialización falla - intentar mostrar algo útil
        try {
          const errorStr = errorOrMetadata instanceof Error 
            ? `${errorOrMetadata.name}: ${errorOrMetadata.message}`
            : JSON.stringify(errorOrMetadata, null, 2);
          const metaStr = metadata ? JSON.stringify(metadata, null, 2) : '';
          logFn(`[${level.toUpperCase()}] ${message}\n${errorStr}${metaStr ? '\n' + metaStr : ''}`);
        } catch {
          // Último recurso: mostrar solo el mensaje
          logFn(`[${level.toUpperCase()}] ${message}`, String(errorOrMetadata), String(metadata));
        }
      }
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

// ═══════════════════════════════════════════════════════════
// AUTO-CAPTURE DE ERRORES NO MANEJADOS
// ═══════════════════════════════════════════════════════════
// IMPORTANTE: Esto debe ir DESPUÉS de la definición de logger
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
