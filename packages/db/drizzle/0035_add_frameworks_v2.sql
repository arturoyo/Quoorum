-- Migration: Add frameworks tables for decision-making frameworks library
-- Created: 2026-01-27 (Re-applied as 0035 because 0029 slot was taken)
-- Purpose: Support Pros/Cons, SWOT Analysis, Eisenhower Matrix frameworks

-- ============================================================================
-- FRAMEWORKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "frameworks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"meta_title" varchar(255),
	"meta_description" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS "frameworks_slug_idx" ON "frameworks" ("slug");

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS "frameworks_is_active_idx" ON "frameworks" ("is_active");

-- ============================================================================
-- DEBATE_FRAMEWORKS TABLE (Many-to-many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "debate_frameworks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_id" uuid NOT NULL,
	"framework_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "debate_frameworks" ADD CONSTRAINT "debate_frameworks_debate_id_debates_id_fk"
   FOREIGN KEY ("debate_id") REFERENCES "public"."debates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "debate_frameworks" ADD CONSTRAINT "debate_frameworks_framework_id_frameworks_id_fk"
   FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for faster joins
CREATE INDEX IF NOT EXISTS "debate_frameworks_debate_id_idx" ON "debate_frameworks" ("debate_id");
CREATE INDEX IF NOT EXISTS "debate_frameworks_framework_id_idx" ON "debate_frameworks" ("framework_id");

-- ============================================================================
-- SEED DATA (3 P0 Frameworks)
-- ============================================================================

-- Insert Pros and Cons framework
INSERT INTO "frameworks" (
  "id",
  "slug",
  "name",
  "description",
  "is_active",
  "meta_title",
  "meta_description"
) VALUES (
  gen_random_uuid(),
  'pros-and-cons',
  'Pros and Cons',
  'Analiza las ventajas y desventajas de tu decision con debates multi-agente IA. Simple, claro, efectivo.',
  true,
  'Free Pros and Cons Template - AI Powered | Quoorum',
  'Analiza decisiones con IA experta. Obten un analisis balanceado de ventajas y desventajas en minutos. Template gratis con 4 IAs debatiendo tu decision.'
) ON CONFLICT (slug) DO NOTHING;

-- Insert SWOT Analysis framework
INSERT INTO "frameworks" (
  "id",
  "slug",
  "name",
  "description",
  "is_active",
  "meta_title",
  "meta_description"
) VALUES (
  gen_random_uuid(),
  'swot-analysis',
  'SWOT Analysis',
  'Analisis SWOT (Fortalezas, Debilidades, Oportunidades, Amenazas) con 4 agentes expertos. Ideal para estrategia de negocio.',
  true,
  'Free SWOT Analysis Template - AI Powered | Quoorum',
  'Genera analisis SWOT profesional con IA en minutos. 4 expertos analizan Fortalezas, Debilidades, Oportunidades y Amenazas de tu negocio.'
) ON CONFLICT (slug) DO NOTHING;

-- Insert Eisenhower Matrix framework
INSERT INTO "frameworks" (
  "id",
  "slug",
  "name",
  "description",
  "is_active",
  "meta_title",
  "meta_description"
) VALUES (
  gen_random_uuid(),
  'eisenhower-matrix',
  'Eisenhower Matrix',
  'Prioriza tareas segun urgencia e importancia. Matriz 2x2 para decisiones de productividad y time management.',
  true,
  'Free Eisenhower Matrix Template - AI Powered | Quoorum',
  'Prioriza tareas con la Matriz de Eisenhower y IA. Clasifica segun urgencia e importancia. Template gratis para productividad.'
) ON CONFLICT (slug) DO NOTHING;
