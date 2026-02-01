/**
 * RAG Templates Schema
 *
 * Pre-built document templates by industry/use-case
 */

import { pgTable, uuid, varchar, text, integer, real, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { profiles } from './auth'

// ============================================================================
// RAG TEMPLATES
// ============================================================================

export const ragTemplates = pgTable(
  'rag_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Template info
    slug: varchar('slug', { length: 100 }).unique().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),

    // Categorization
    category: varchar('category', { length: 50 }).notNull(), // 'legal', 'tech', 'finance', etc.
    industry: varchar('industry', { length: 50 }), // 'saas', 'ecommerce', etc.

    // Template content
    templateFiles: jsonb('template_files')
      .$type<
        Array<{
          filename: string
          content: string
          type: 'pdf' | 'txt' | 'md' | 'docx'
        }>
      >()
      .notNull(),

    // Metadata
    useCases: text('use_cases').array(),
    tags: text('tags').array(),
    author: varchar('author', { length: 255 }).default('Quoorum'),

    // Stats
    usageCount: integer('usage_count').default(0),
    avgRating: real('avg_rating'),

    // Status
    isActive: boolean('is_active').default(true),
    isFeatured: boolean('is_featured').default(false),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    categoryIdx: index('idx_rag_templates_category').on(table.category),
    industryIdx: index('idx_rag_templates_industry').on(table.industry),
    featuredIdx: index('idx_rag_templates_featured').on(table.isFeatured),
    usageIdx: index('idx_rag_templates_usage').on(table.usageCount),
  })
)

export type RAGTemplate = typeof ragTemplates.$inferSelect
export type NewRAGTemplate = typeof ragTemplates.$inferInsert

// ============================================================================
// TEMPLATE USAGE TRACKING
// ============================================================================

export const ragTemplateUsage = pgTable(
  'rag_template_usage',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    templateId: uuid('template_id')
      .notNull()
      .references(() => ragTemplates.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    // Tracking
    documentsCreated: integer('documents_created').default(0),
    usedAt: timestamp('used_at').defaultNow(),

    // Feedback
    rating: integer('rating'), // 1-5
    feedback: text('feedback'),
  },
  (table) => ({
    templateIdx: index('idx_rag_template_usage_template').on(table.templateId),
    userIdx: index('idx_rag_template_usage_user').on(table.userId),
  })
)

export type RAGTemplateUsage = typeof ragTemplateUsage.$inferSelect
export type NewRAGTemplateUsage = typeof ragTemplateUsage.$inferInsert
