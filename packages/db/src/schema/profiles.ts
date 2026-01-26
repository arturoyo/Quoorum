/**
 * Profiles Schema (stub)
 * User profiles for Quoorum system
 */
import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  email: varchar("email", { length: 255 }),
  name: varchar("name", { length: 255 }),
  fullName: varchar("full_name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  role: varchar("role", { length: 100 }).default("user"),
  settings: jsonb("settings").$type<Record<string, unknown>>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Performance indexes for profiles (critical foundation table)
  userIdIdx: index('idx_profiles_user_id').on(table.userId),
  emailIdx: index('idx_profiles_email').on(table.email),
  isActiveIdx: index('idx_profiles_is_active').on(table.isActive),
}));

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
