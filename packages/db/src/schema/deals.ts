/**
 * Deals Schema (stub)
 * Deal records for Quoorum system
 */
import { pgTable, uuid, varchar, text, timestamp, jsonb, real, pgEnum } from "drizzle-orm/pg-core";
import { clients } from "./clients.js";
import { profiles } from "./profiles.js";

export const dealStageEnum = pgEnum("deal_stage", [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "commitment",
  "closed_won",
  "closed_lost",
]);

export const deals = pgTable("deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  clientId: uuid("client_id").references(() => clients.id),
  ownerId: uuid("owner_id").references(() => profiles.id),
  stage: dealStageEnum("stage").notNull().default("lead"),
  value: real("value"),
  currency: varchar("currency", { length: 10 }).default("USD"),
  probability: real("probability"),
  expectedCloseDate: timestamp("expected_close_date", { withTimezone: true }),
  description: text("description"),
  notes: text("notes"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
