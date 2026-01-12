import { pgTable, text, timestamp, uuid, integer, real, jsonb } from "drizzle-orm/pg-core";
import { experts } from "./experts.js";
import { rounds } from "./rounds.js";

export interface OpinionMetadata {
  tokensUsed?: number;
  latencyMs?: number;
  modelVersion?: string;
}

export const opinions = pgTable("opinions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roundId: uuid("round_id").notNull().references(() => rounds.id, { onDelete: "cascade" }),
  expertId: uuid("expert_id").notNull().references(() => experts.id),
  content: text("content").notNull(),
  reasoning: text("reasoning").notNull(),
  confidence: real("confidence").notNull(),
  qualityScore: real("quality_score"),
  position: integer("position"),
  metadata: jsonb("metadata").$type<OpinionMetadata>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Opinion = typeof opinions.$inferSelect;
export type NewOpinion = typeof opinions.$inferInsert;
