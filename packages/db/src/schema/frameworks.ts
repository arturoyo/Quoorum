import { pgTable, text, timestamp, uuid, varchar, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { quoorumDebates } from "./quoorum-debates";

// ============================================================================
// FRAMEWORKS TABLE
// ============================================================================

/**
 * Decision-making frameworks library
 * Simple table for the 3 P0 frameworks:
 * - Pros and Cons
 * - SWOT Analysis
 * - Eisenhower Matrix
 */
export const frameworks = pgTable("frameworks", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Slug for URL (e.g., "pros-and-cons")
  slug: varchar("slug", { length: 100 }).notNull().unique(),

  // Display name
  name: varchar("name", { length: 255 }).notNull(),

  // Short description for SEO and UI
  description: text("description").notNull(),

  // Is this framework active/visible?
  isActive: boolean("is_active").notNull().default(true),

  // SEO metadata
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: varchar("meta_description", { length: 500 }),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// DEBATE_FRAMEWORKS (Many-to-many relationship)
// ============================================================================

/**
 * Tracks which framework was used for each debate
 */
export const debateFrameworks = pgTable("debate_frameworks", {
  id: uuid("id").primaryKey().defaultRandom(),

  debateId: uuid("debate_id")
    .notNull()
    .references(() => quoorumDebates.id, { onDelete: "cascade" }),

  frameworkId: uuid("framework_id")
    .notNull()
    .references(() => frameworks.id, { onDelete: "cascade" }),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const frameworksRelations = relations(frameworks, ({ many }) => ({
  debateFrameworks: many(debateFrameworks),
}));

export const debateFrameworksRelations = relations(debateFrameworks, ({ one }) => ({
  debate: one(quoorumDebates, {
    fields: [debateFrameworks.debateId],
    references: [quoorumDebates.id],
  }),
  framework: one(frameworks, {
    fields: [debateFrameworks.frameworkId],
    references: [frameworks.id],
  }),
}));

// ============================================================================
// TYPES
// ============================================================================

export type Framework = typeof frameworks.$inferSelect;
export type NewFramework = typeof frameworks.$inferInsert;
export type DebateFramework = typeof debateFrameworks.$inferSelect;
export type NewDebateFramework = typeof debateFrameworks.$inferInsert;
