import { pgTable, text, timestamp, uuid, integer, varchar } from "drizzle-orm/pg-core";
import { deliberations } from "./deliberations";

export type RoundStatus = "pending" | "in_progress" | "completed";

export const rounds = pgTable("rounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  deliberationId: uuid("deliberation_id").notNull().references(() => deliberations.id, { onDelete: "cascade" }),
  roundNumber: integer("round_number").notNull(),
  status: varchar("status", { length: 50 }).$type<RoundStatus>().notNull().default("pending"),
  summary: text("summary"),
  moderatorNotes: text("moderator_notes"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Round = typeof rounds.$inferSelect;
export type NewRound = typeof rounds.$inferInsert;
