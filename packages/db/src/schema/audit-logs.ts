import { pgTable, text, timestamp, uuid, varchar, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";
import { deliberations } from "./deliberations";

export type AuditAction =
  | "deliberation.created"
  | "deliberation.started"
  | "deliberation.paused"
  | "deliberation.completed"
  | "deliberation.cancelled"
  | "round.started"
  | "round.completed"
  | "opinion.submitted"
  | "vote.cast"
  | "consensus.reached"
  | "expert.added"
  | "expert.removed"
  | "settings.changed";

export interface AuditDetails {
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
}

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: varchar("action", { length: 100 }).$type<AuditAction>().notNull(),
  userId: uuid("user_id").references(() => users.id),
  deliberationId: uuid("deliberation_id").references(() => deliberations.id, { onDelete: "cascade" }),
  entityType: varchar("entity_type", { length: 100 }),
  entityId: uuid("entity_id"),
  details: jsonb("details").$type<AuditDetails>(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
