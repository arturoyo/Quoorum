import { pgTable, uuid, varchar, text, timestamp, jsonb, index, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";

// ═══════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════
export const logLevelEnum = pgEnum("log_level", [
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
]);

export const logSourceEnum = pgEnum("log_source", [
  "client",  // Frontend
  "server",  // Backend API
  "worker",  // Background workers
  "cron",    // Scheduled jobs
]);

// ═══════════════════════════════════════════════════════════
// TABLE
// ═══════════════════════════════════════════════════════════
export const systemLogs = pgTable(
  "system_logs",
  {
    // Primary key
    id: uuid("id").defaultRandom().primaryKey(),

    // Foreign keys (optional - logs pueden ser sin usuario)
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

    // Log metadata
    level: logLevelEnum("level").notNull(),
    source: logSourceEnum("source").notNull(),
    message: text("message").notNull(),

    // Context data (JSON)
    metadata: jsonb("metadata").$type<{
      sessionId?: string;
      url?: string;
      userAgent?: string;
      ip?: string;
      [key: string]: unknown;
    }>(),

    // Error details (para level = error/fatal)
    errorName: varchar("error_name", { length: 255 }),
    errorMessage: text("error_message"),
    errorStack: text("error_stack"),

    // Performance metrics
    durationMs: jsonb("duration_ms").$type<number>(), // Para medir tiempo de operaciones

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Índices para búsqueda rápida
    userIdIdx: index("system_logs_user_id_idx").on(table.userId),
    levelIdx: index("system_logs_level_idx").on(table.level),
    sourceIdx: index("system_logs_source_idx").on(table.source),
    createdAtIdx: index("system_logs_created_at_idx").on(table.createdAt),
    // Índice compuesto para queries comunes
    userLevelCreatedIdx: index("system_logs_user_level_created_idx").on(
      table.userId,
      table.level,
      table.createdAt
    ),
  })
);

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
export type SystemLog = typeof systemLogs.$inferSelect;
export type NewSystemLog = typeof systemLogs.$inferInsert;
