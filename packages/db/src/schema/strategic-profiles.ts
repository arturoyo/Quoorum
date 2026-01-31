/**
 * Strategic Intelligence Profiles Schema
 *
 * Unified architecture for all profile types:
 * - Experts (AI debate participants)
 * - Professionals (specialized agents)
 * - Roles (strategic archetypes)
 * - ICP (Ideal Customer Profiles)
 * - Buyer Personas (individual decision-makers)
 */

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { profiles } from './auth'
import { companies } from './companies'
import { vectorDocuments } from './vector-documents'

// ============================================================================
// ENUMS
// ============================================================================

export const profileTypeEnum = pgEnum('profile_type', [
  'expert',
  'professional',
  'role',
  'icp',
  'buyer_persona',
])

export const toneStyleEnum = pgEnum('tone_style', [
  'analytical',
  'skeptical',
  'optimistic',
  'pragmatic',
  'visionary',
  'direct',
  'empathetic',
  'assertive',
])

export const maturityLevelEnum = pgEnum('maturity_level', [
  'startup',
  'growth',
  'enterprise',
  'legacy',
])

export const contextRelevanceEnum = pgEnum('context_relevance', [
  'core',
  'supplementary',
  'case_study',
  'industry_data',
  'compliance',
])

export const relationshipTypeEnum = pgEnum('relationship_type', [
  'compatible',
  'complementary',
  'prerequisite',
  'alternative',
  'context_for',
])

// Type inference for enums
export type ProfileType = (typeof profileTypeEnum.enumValues)[number]
export type ToneStyle = (typeof toneStyleEnum.enumValues)[number]
export type MaturityLevel = (typeof maturityLevelEnum.enumValues)[number]
export type ContextRelevance = (typeof contextRelevanceEnum.enumValues)[number]
export type RelationshipType = (typeof relationshipTypeEnum.enumValues)[number]

// ============================================================================
// TYPE-SPECIFIC CONFIGS (TypeScript interfaces for JSONB)
// ============================================================================

export interface AIConfig {
  systemPrompt?: string
  model?: string
  temperature?: number
  maxTokens?: number
  responseFormat?: 'text' | 'json' | 'structured'
  tools?: string[]
  fallbackModel?: string
}

export interface Firmographics {
  employeeCount?: string // "500+", "1000-5000"
  revenue?: string // "50M+", "100M-500M"
  techStack?: string[]
  triggerEvents?: string[]
  governance?: {
    gdpr?: boolean
    iso42001?: boolean
    soc2?: boolean
    auditTrail?: string
  }
  geographies?: string[]
  fundingStage?: string
}

export interface Psychographics {
  jobsToBeDone?: string
  motivations?: string[]
  barriers?: string[]
  channels?: string[]
  professionalProfile?: {
    role?: string
    yearsExperience?: number
    responsibilities?: string[]
    reportingStructure?: string
  }
  decisionProcess?: {
    timeframe?: string
    stakeholders?: string[]
    budget?: string
  }
}

// ============================================================================
// STRATEGIC PROFILES (Main Table)
// ============================================================================

export const strategicProfiles = pgTable(
  'strategic_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Universal Identity
    type: profileTypeEnum('type').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).unique().notNull(),
    title: varchar('title', { length: 500 }),
    description: text('description'),
    category: varchar('category', { length: 100 }),
    specialization: varchar('specialization', { length: 255 }),

    // Behavioral Attributes
    objective: text('objective'),
    toneStyles: toneStyleEnum('tone_styles').array(),
    autonomyLevel: integer('autonomy_level').default(5),
    behaviorRules: text('behavior_rules'),

    // Knowledge & Expertise
    expertiseAreas: text('expertise_areas').array(),
    industries: text('industries').array(),
    maturityLevel: maturityLevelEnum('maturity_level'),
    biasesToMitigate: text('biases_to_mitigate').array(),
    decisionStyle: varchar('decision_style', { length: 50 }),
    successMetrics: text('success_metrics').array(),

    // Type-Specific Attributes (JSONB)
    aiConfig: jsonb('ai_config').$type<AIConfig>().default({}),
    firmographics: jsonb('firmographics').$type<Firmographics>().default({}),
    psychographics: jsonb('psychographics').$type<Psychographics>().default({}),

    // Relationships
    parentProfileId: uuid('parent_profile_id'),
    relatedProfileIds: uuid('related_profile_ids').array(),

    // Multi-tenant & Ownership
    userId: uuid('user_id').references(() => profiles.id, {
      onDelete: 'cascade',
    }),
    companyId: uuid('company_id').references(() => companies.id, {
      onDelete: 'cascade',
    }),

    isGlobal: boolean('is_global').default(false),
    isActive: boolean('is_active').default(true),
    isFeatured: boolean('is_featured').default(false),

    // Usage & Analytics
    usageCount: integer('usage_count').default(0),
    avgRating: real('avg_rating'),
    lastUsedAt: timestamp('last_used_at'),

    // Metadata
    tags: text('tags').array(),
    version: integer('version').default(1),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: uuid('created_by').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    updatedBy: uuid('updated_by').references(() => profiles.id, {
      onDelete: 'set null',
    }),
  },
  (table) => ({
    typeIdx: index('idx_strategic_profiles_type').on(table.type),
    slugIdx: uniqueIndex('idx_strategic_profiles_slug').on(table.slug),
    categoryIdx: index('idx_strategic_profiles_category').on(table.category),
    userIdx: index('idx_strategic_profiles_user').on(table.userId),
    companyIdx: index('idx_strategic_profiles_company').on(table.companyId),
    globalIdx: index('idx_strategic_profiles_global').on(table.isGlobal),
    parentIdx: index('idx_strategic_profiles_parent').on(
      table.parentProfileId
    ),
  })
)

export type StrategicProfile = typeof strategicProfiles.$inferSelect
export type NewStrategicProfile = typeof strategicProfiles.$inferInsert

// ============================================================================
// PROFILE <-> RAG DOCUMENTS
// ============================================================================

export const profileRagDocuments = pgTable(
  'profile_rag_documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    profileId: uuid('profile_id')
      .notNull()
      .references(() => strategicProfiles.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id')
      .notNull()
      .references(() => vectorDocuments.id, { onDelete: 'cascade' }),

    // Context metadata
    relevance: contextRelevanceEnum('relevance')
      .notNull()
      .default('supplementary'),
    importanceScore: real('importance_score').default(0.5),

    // Usage tracking
    timesRetrieved: integer('times_retrieved').default(0),
    lastRetrievedAt: timestamp('last_retrieved_at'),
    avgSimilarity: real('avg_similarity'),

    // Metadata
    notes: text('notes'),
    addedBy: uuid('added_by').references(() => profiles.id),
    addedAt: timestamp('added_at').defaultNow(),
  },
  (table) => ({
    profileIdx: index('idx_profile_rag_profile').on(table.profileId),
    documentIdx: index('idx_profile_rag_document').on(table.documentId),
    relevanceIdx: index('idx_profile_rag_relevance').on(table.relevance),
    uniqueProfileDoc: uniqueIndex('idx_profile_rag_unique').on(
      table.profileId,
      table.documentId
    ),
  })
)

export type ProfileRagDocument = typeof profileRagDocuments.$inferSelect
export type NewProfileRagDocument = typeof profileRagDocuments.$inferInsert

// ============================================================================
// PROFILE VERSIONS
// ============================================================================

export const strategicProfileVersions = pgTable(
  'strategic_profile_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => strategicProfiles.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),

    // Snapshot
    profileData: jsonb('profile_data').notNull(),

    // Change tracking
    changedBy: uuid('changed_by').references(() => profiles.id),
    changeReason: text('change_reason'),
    changedAt: timestamp('changed_at').defaultNow(),
  },
  (table) => ({
    profileIdx: index('idx_profile_versions_profile').on(table.profileId),
    changedAtIdx: index('idx_profile_versions_changed_at').on(table.changedAt),
    uniqueProfileVersion: uniqueIndex('idx_profile_versions_unique').on(
      table.profileId,
      table.version
    ),
  })
)

export type StrategicProfileVersion =
  typeof strategicProfileVersions.$inferSelect
export type NewStrategicProfileVersion =
  typeof strategicProfileVersions.$inferInsert

// ============================================================================
// PROFILE RELATIONSHIPS
// ============================================================================

export const profileRelationships = pgTable(
  'profile_relationships',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    fromProfileId: uuid('from_profile_id')
      .notNull()
      .references(() => strategicProfiles.id, { onDelete: 'cascade' }),
    toProfileId: uuid('to_profile_id')
      .notNull()
      .references(() => strategicProfiles.id, { onDelete: 'cascade' }),

    relationshipType: relationshipTypeEnum('relationship_type').notNull(),
    strength: real('strength').default(0.5),

    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow(),
    createdBy: uuid('created_by').references(() => profiles.id),
  },
  (table) => ({
    fromIdx: index('idx_profile_rel_from').on(table.fromProfileId),
    toIdx: index('idx_profile_rel_to').on(table.toProfileId),
    typeIdx: index('idx_profile_rel_type').on(table.relationshipType),
    uniqueRel: uniqueIndex('idx_profile_rel_unique').on(
      table.fromProfileId,
      table.toProfileId,
      table.relationshipType
    ),
  })
)

export type ProfileRelationship = typeof profileRelationships.$inferSelect
export type NewProfileRelationship = typeof profileRelationships.$inferInsert

// ============================================================================
// RELATIONS (Drizzle ORM)
// ============================================================================

export const strategicProfilesRelations = relations(
  strategicProfiles,
  ({ one, many }) => ({
    user: one(profiles, {
      fields: [strategicProfiles.userId],
      references: [profiles.id],
    }),
    company: one(companies, {
      fields: [strategicProfiles.companyId],
      references: [companies.id],
    }),
    parentProfile: one(strategicProfiles, {
      fields: [strategicProfiles.parentProfileId],
      references: [strategicProfiles.id],
      relationName: 'parentChild',
    }),
    childProfiles: many(strategicProfiles, {
      relationName: 'parentChild',
    }),
    ragDocuments: many(profileRagDocuments),
    versions: many(strategicProfileVersions),
    relationshipsFrom: many(profileRelationships, {
      relationName: 'fromProfile',
    }),
    relationshipsTo: many(profileRelationships, {
      relationName: 'toProfile',
    }),
    createdByUser: one(profiles, {
      fields: [strategicProfiles.createdBy],
      references: [profiles.id],
    }),
    updatedByUser: one(profiles, {
      fields: [strategicProfiles.updatedBy],
      references: [profiles.id],
    }),
  })
)

export const profileRagDocumentsRelations = relations(
  profileRagDocuments,
  ({ one }) => ({
    profile: one(strategicProfiles, {
      fields: [profileRagDocuments.profileId],
      references: [strategicProfiles.id],
    }),
    document: one(vectorDocuments, {
      fields: [profileRagDocuments.documentId],
      references: [vectorDocuments.id],
    }),
    addedByUser: one(profiles, {
      fields: [profileRagDocuments.addedBy],
      references: [profiles.id],
    }),
  })
)

export const strategicProfileVersionsRelations = relations(
  strategicProfileVersions,
  ({ one }) => ({
    profile: one(strategicProfiles, {
      fields: [strategicProfileVersions.profileId],
      references: [strategicProfiles.id],
    }),
    changedByUser: one(profiles, {
      fields: [strategicProfileVersions.changedBy],
      references: [profiles.id],
    }),
  })
)

export const profileRelationshipsRelations = relations(
  profileRelationships,
  ({ one }) => ({
    fromProfile: one(strategicProfiles, {
      fields: [profileRelationships.fromProfileId],
      references: [strategicProfiles.id],
      relationName: 'fromProfile',
    }),
    toProfile: one(strategicProfiles, {
      fields: [profileRelationships.toProfileId],
      references: [strategicProfiles.id],
      relationName: 'toProfile',
    }),
    createdByUser: one(profiles, {
      fields: [profileRelationships.createdBy],
      references: [profiles.id],
    }),
  })
)
