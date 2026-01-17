/**
 * Subscriptions Schema
 * Handles billing plans, subscriptions, and usage tracking for Forum SaaS
 */
import { pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

// ============================================================================
// ENUMS
// ============================================================================

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "trialing",
  "paused",
  "unpaid",
]);

export const planTierEnum = pgEnum("plan_tier", [
  "free",
  "starter",
  "pro",
  "business",
  "enterprise",
]);

// ============================================================================
// PLANS TABLE
// ============================================================================

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  tier: planTierEnum("tier").notNull().default("free"),
  description: text("description"),

  // Pricing
  monthlyPriceUsd: integer("monthly_price_usd").notNull().default(0), // in cents
  yearlyPriceUsd: integer("yearly_price_usd").notNull().default(0), // in cents

  // Stripe IDs
  stripePriceIdMonthly: varchar("stripe_price_id_monthly", { length: 255 }),
  stripePriceIdYearly: varchar("stripe_price_id_yearly", { length: 255 }),
  stripeProductId: varchar("stripe_product_id", { length: 255 }),

  // Limits
  debatesPerMonth: integer("debates_per_month").notNull().default(5),
  maxExperts: integer("max_experts").notNull().default(4),
  maxRoundsPerDebate: integer("max_rounds_per_debate").notNull().default(3),
  maxTeamMembers: integer("max_team_members").notNull().default(1),

  // Features
  features: jsonb("features").$type<{
    customExperts: boolean;
    pdfExport: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    whiteLabel: boolean;
    analytics: boolean;
    webhooks: boolean;
  }>(),

  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// SUBSCRIPTIONS TABLE
// ============================================================================

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: uuid("plan_id").notNull().references(() => plans.id),

  status: subscriptionStatusEnum("status").notNull().default("active"),

  // Stripe
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),

  // Billing period
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),

  // Trial
  trialStart: timestamp("trial_start", { withTimezone: true }),
  trialEnd: timestamp("trial_end", { withTimezone: true }),

  // Cancellation
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),

  // Credit allocation (resets each billing cycle)
  monthlyCredits: integer("monthly_credits").notNull().default(1000), // Credits allocated per month based on plan

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// USAGE TABLE (tracks monthly usage per user)
// ============================================================================

export const usage = pgTable("usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Period
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),

  // Counts
  debatesUsed: integer("debates_used").notNull().default(0),
  tokensUsed: integer("tokens_used").notNull().default(0),
  apiCallsUsed: integer("api_calls_used").notNull().default(0),

  // Cost tracking
  totalCostUsd: integer("total_cost_usd").notNull().default(0), // in cents
  creditsDeducted: integer("credits_deducted").notNull().default(0), // Credits consumed in period

  // AI orchestration tracking (for audit logs)
  modelUsed: varchar("model_used", { length: 100 }), // Last model used (e.g. 'gpt-4o', 'claude-sonnet-4')
  phase: varchar("phase", { length: 50 }), // Last debate phase ('initial', 'debate', 'synthesis')

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// API KEYS TABLE
// ============================================================================

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 100 }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull(), // SHA256 hash of API key
  keyPrefix: varchar("key_prefix", { length: 10 }).notNull(), // First 8 chars for display

  // Permissions
  permissions: jsonb("permissions").$type<{
    read: boolean;
    write: boolean;
    delete: boolean;
  }>().default({ read: true, write: false, delete: false }),

  // Usage
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  usageCount: integer("usage_count").notNull().default(0),

  // Status
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [subscriptions.planId],
    references: [plans.id],
  }),
}));

export const usageRelations = relations(usage, ({ one }) => ({
  user: one(users, {
    fields: [usage.userId],
    references: [users.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPES
// ============================================================================

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Usage = typeof usage.$inferSelect;
export type NewUsage = typeof usage.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
