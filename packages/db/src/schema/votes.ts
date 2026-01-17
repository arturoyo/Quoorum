import { pgTable, text, timestamp, uuid, integer, real } from "drizzle-orm/pg-core";
import { experts } from "./experts";
import { opinions } from "./opinions";
import { rounds } from "./rounds";

export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  roundId: uuid("round_id").notNull().references(() => rounds.id, { onDelete: "cascade" }),
  expertId: uuid("expert_id").notNull().references(() => experts.id),
  opinionId: uuid("opinion_id").notNull().references(() => opinions.id),
  weight: real("weight").notNull().default(1),
  score: integer("score").notNull(),
  justification: text("justification"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
