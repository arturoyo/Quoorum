import { pgTable, text, timestamp, uuid, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { deliberations } from "./deliberations.js";
import { rounds } from "./rounds.js";

export interface DissentingExpert {
  expertId: string;
  reason: string;
}

export const consensus = pgTable("consensus", {
  id: uuid("id").primaryKey().defaultRandom(),
  deliberationId: uuid("deliberation_id").notNull().references(() => deliberations.id, { onDelete: "cascade" }),
  roundId: uuid("round_id").references(() => rounds.id),
  achieved: boolean("achieved").notNull().default(false),
  score: real("score").notNull(),
  summary: text("summary").notNull(),
  recommendation: text("recommendation"),
  dissenting: jsonb("dissenting").$type<DissentingExpert[]>().default([]),
  qualityAssessment: text("quality_assessment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Consensus = typeof consensus.$inferSelect;
export type NewConsensus = typeof consensus.$inferInsert;
