import { pgTable, text, timestamp, uuid, varchar, boolean, integer, pgEnum } from "drizzle-orm/pg-core";

// User tier enum for credit system and AI orchestration
export const userTierEnum = pgEnum("user_tier", ["free", "starter", "pro", "business"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  role: varchar("role", { length: 50 }).notNull().default("member"),
  isActive: boolean("is_active").notNull().default(true),

  // Credit system (1 credit = $0.005 USD)
  credits: integer("credits").notNull().default(1000),
  tier: userTierEnum("tier").notNull().default("free"),
  
  // Daily credit refresh tracking
  // Solo se actualiza cuando el usuario visita la página (no acumula si no entra)
  lastDailyCreditRefresh: timestamp("last_daily_credit_refresh", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
