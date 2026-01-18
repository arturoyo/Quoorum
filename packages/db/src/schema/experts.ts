import { pgTable, text, timestamp, uuid, varchar, jsonb, boolean } from "drizzle-orm/pg-core";

export type AIProvider = "openai" | "anthropic" | "google" | "groq";

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

export const experts = pgTable("experts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"), // null = biblioteca compartida, !null = experto personalizado
  name: varchar("name", { length: 255 }).notNull(),
  expertise: varchar("expertise", { length: 500 }).notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  aiConfig: jsonb("ai_config").$type<AIConfig>().notNull(),
  category: varchar("category", { length: 100 }), // e.g., "empresa", "vida-personal", "historicos", etc.
  isActive: boolean("is_active").notNull().default(true),
  libraryExpertId: uuid("library_expert_id"), // Si es fork de biblioteca, referencia al original
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Expert = typeof experts.$inferSelect;
export type NewExpert = typeof experts.$inferInsert;
