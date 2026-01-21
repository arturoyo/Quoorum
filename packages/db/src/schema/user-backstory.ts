import { pgTable, text, timestamp, uuid, varchar, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { relations } from "drizzle-orm";

// ============================================================================
// ENUMS
// ============================================================================

export const roleEnum = pgEnum("user_role_type", [
  "founder",
  "ceo",
  "cto",
  "product_manager",
  "investor",
  "consultant",
  "team_lead",
  "individual_contributor",
  "other",
]);

export const industryEnum = pgEnum("industry_type", [
  "saas",
  "ecommerce",
  "fintech",
  "healthtech",
  "edtech",
  "marketplace",
  "consumer",
  "enterprise",
  "hardware",
  "services",
  "other",
]);

export const companySizeEnum = pgEnum("company_size", [
  "solo",
  "small_2_10",
  "medium_11_50",
  "large_50_plus",
]);

export const companyStageEnum = pgEnum("company_stage", [
  "idea",
  "mvp",
  "early_revenue",
  "growth",
  "scale",
  "mature",
]);

export const decisionStyleEnum = pgEnum("decision_style", [
  "fast_intuitive",
  "balanced",
  "thorough_analytical",
]);

// ============================================================================
// TABLE
// ============================================================================

export const userBackstory = pgTable("user_backstory", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),

  // Company/Project Context
  companyName: varchar("company_name", { length: 255 }),
  role: roleEnum("role"),
  industry: industryEnum("industry"),
  companySize: companySizeEnum("company_size"),
  companyStage: companyStageEnum("company_stage"),

  // Decision Making Style
  decisionStyle: decisionStyleEnum("decision_style"),

  // Free-form context (optional)
  additionalContext: text("additional_context"),

  // Preferences for debates
  preferences: jsonb("preferences").$type<{
    preferredExperts?: string[]; // IDs de expertos favoritos
    defaultMode?: "quick" | "deep" | "flash";
    focusAreas?: string[]; // ["pricing", "growth", "product"]
  }>(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const userBackstoryRelations = relations(userBackstory, ({ one }) => ({
  user: one(users, {
    fields: [userBackstory.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPES
// ============================================================================

export type UserBackstory = typeof userBackstory.$inferSelect;
export type NewUserBackstory = typeof userBackstory.$inferInsert;

// Helper type for frontend forms
export type BackstoryFormData = {
  companyName?: string;
  role?: string;
  industry?: string;
  companySize?: string;
  companyStage?: string;
  decisionStyle?: string;
  additionalContext?: string;
};
