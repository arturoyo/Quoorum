import { pgTable, text, timestamp, uuid, varchar, integer, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export type DeliberationStatus = "draft" | "active" | "paused" | "completed" | "cancelled";

export const deliberations = pgTable("deliberations", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  topic: text("topic").notNull(),
  status: varchar("status", { length: 50 }).$type<DeliberationStatus>().notNull().default("draft"),
  createdById: uuid("created_by_id").notNull().references(() => users.id),
  objectives: jsonb("objectives").$type<string[]>().default([]),
  constraints: jsonb("constraints").$type<string[]>().default([]),
  maxRounds: integer("max_rounds").notNull().default(5),
  currentRound: integer("current_round").notNull().default(0),
  consensusThreshold: integer("consensus_threshold").notNull().default(70),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type Deliberation = typeof deliberations.$inferSelect;
export type NewDeliberation = typeof deliberations.$inferInsert;
