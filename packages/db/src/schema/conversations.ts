/**
 * Conversations Schema (stub)
 * Conversation records for Forum system
 */
import { pgTable, uuid, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { clients } from "./clients.js";

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id),
  channel: varchar("channel", { length: 50 }).notNull().default("web"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  title: varchar("title", { length: 255 }),
  summary: text("summary"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
