-- Migration: Add pricing configuration tables
-- Created: 2026-01-28
-- Purpose: Sistema completo de gestión de pricing desde admin panel

-- ============================================================================
-- PRICING GLOBAL CONFIG
-- ============================================================================

CREATE TABLE IF NOT EXISTS "pricing_global_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credit_multiplier" numeric(10, 2) DEFAULT '1.75' NOT NULL,
	"usd_per_credit" numeric(10, 4) DEFAULT '0.01' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_until" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"change_reason" varchar(500),
	CONSTRAINT "pricing_global_config_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action
);

-- ============================================================================
-- TIER PRICING CONFIG
-- ============================================================================

CREATE TABLE IF NOT EXISTS "tier_pricing_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier" varchar(50) NOT NULL,
	"tier_name" varchar(100) NOT NULL,
	"tier_description" varchar(500),
	"monthly_price_usd" integer DEFAULT 0 NOT NULL,
	"yearly_price_usd" integer DEFAULT 0 NOT NULL,
	"monthly_credits" integer DEFAULT 1000 NOT NULL,
	"yearly_credits" integer DEFAULT 12000 NOT NULL,
	"debates_per_month" integer DEFAULT 5 NOT NULL,
	"max_experts" integer DEFAULT 4 NOT NULL,
	"max_rounds_per_debate" integer DEFAULT 3 NOT NULL,
	"max_team_members" integer DEFAULT 1 NOT NULL,
	"features" jsonb,
	"stripe_price_id_monthly" varchar(255),
	"stripe_price_id_yearly" varchar(255),
	"stripe_product_id" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_publicly_visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_until" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"change_reason" varchar(500),
	CONSTRAINT "tier_pricing_config_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action
);

-- ============================================================================
-- PRICING CHANGE HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS "pricing_change_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"change_type" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"impact_analysis" jsonb,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"change_reason" varchar(500),
	"can_rollback" boolean DEFAULT true NOT NULL,
	"rolled_back_at" timestamp with time zone,
	"rolled_back_by" uuid,
	CONSTRAINT "pricing_change_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "pricing_change_history_rolled_back_by_users_id_fk" FOREIGN KEY ("rolled_back_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS "idx_pricing_global_config_active" ON "pricing_global_config"("is_active", "effective_from");
CREATE INDEX IF NOT EXISTS "idx_tier_pricing_config_tier" ON "tier_pricing_config"("tier");
CREATE INDEX IF NOT EXISTS "idx_tier_pricing_config_active" ON "tier_pricing_config"("is_active", "effective_from");
CREATE INDEX IF NOT EXISTS "idx_pricing_change_history_entity" ON "pricing_change_history"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_pricing_change_history_changed_at" ON "pricing_change_history"("changed_at");

-- ============================================================================
-- SEED DATA: Configuración inicial con valores actuales del sistema
-- ============================================================================

-- Global config inicial (valores actuales hardcoded)
INSERT INTO "pricing_global_config" (
	"credit_multiplier",
	"usd_per_credit",
	"is_active",
	"change_reason"
) VALUES (
	1.75,
	0.01,
	true,
	'Initial configuration from hardcoded values'
);

-- Tier: Free
INSERT INTO "tier_pricing_config" (
	"tier",
	"tier_name",
	"tier_description",
	"monthly_price_usd",
	"yearly_price_usd",
	"monthly_credits",
	"yearly_credits",
	"debates_per_month",
	"max_experts",
	"max_rounds_per_debate",
	"max_team_members",
	"features",
	"is_active",
	"is_publicly_visible",
	"sort_order",
	"change_reason"
) VALUES (
	'free',
	'Free',
	'Para probar Quoorum y validar decisiones simples',
	0,
	0,
	1000,
	12000,
	5,
	4,
	3,
	1,
	'{"customExperts": false, "pdfExport": false, "apiAccess": false, "prioritySupport": false, "whiteLabel": false, "analytics": false, "webhooks": false, "scenariosAccess": true, "departmentsAccess": false}'::jsonb,
	true,
	true,
	1,
	'Initial configuration'
);

-- Tier: Starter
INSERT INTO "tier_pricing_config" (
	"tier",
	"tier_name",
	"tier_description",
	"monthly_price_usd",
	"yearly_price_usd",
	"monthly_credits",
	"yearly_credits",
	"debates_per_month",
	"max_experts",
	"max_rounds_per_debate",
	"max_team_members",
	"features",
	"is_active",
	"is_publicly_visible",
	"sort_order",
	"change_reason"
) VALUES (
	'starter',
	'Starter',
	'Para founders y equipos pequeños',
	2900,  -- $29.00
	31320, -- $313.20 (10% descuento anual)
	3500,
	42000,
	20,
	6,
	5,
	3,
	'{"customExperts": true, "pdfExport": true, "apiAccess": false, "prioritySupport": false, "whiteLabel": false, "analytics": true, "webhooks": false, "scenariosAccess": true, "departmentsAccess": false}'::jsonb,
	true,
	true,
	2,
	'Initial configuration'
);

-- Tier: Pro
INSERT INTO "tier_pricing_config" (
	"tier",
	"tier_name",
	"tier_description",
	"monthly_price_usd",
	"yearly_price_usd",
	"monthly_credits",
	"yearly_credits",
	"debates_per_month",
	"max_experts",
	"max_rounds_per_debate",
	"max_team_members",
	"features",
	"is_active",
	"is_publicly_visible",
	"sort_order",
	"change_reason"
) VALUES (
	'pro',
	'Pro',
	'Para equipos en crecimiento',
	4900,  -- $49.00
	52920, -- $529.20 (10% descuento anual)
	7000,
	84000,
	50,
	8,
	10,
	10,
	'{"customExperts": true, "pdfExport": true, "apiAccess": true, "prioritySupport": true, "whiteLabel": false, "analytics": true, "webhooks": true, "scenariosAccess": true, "departmentsAccess": true}'::jsonb,
	true,
	true,
	3,
	'Initial configuration'
);

-- Tier: Business (⚠️ DESACTIVADO - pierde dinero con 30k créditos)
-- Nuevo pricing: $130/mes con 20,000 créditos (rentable)
INSERT INTO "tier_pricing_config" (
	"tier",
	"tier_name",
	"tier_description",
	"monthly_price_usd",
	"yearly_price_usd",
	"monthly_credits",
	"yearly_credits",
	"debates_per_month",
	"max_experts",
	"max_rounds_per_debate",
	"max_team_members",
	"features",
	"is_active",
	"is_publicly_visible",
	"sort_order",
	"change_reason"
) VALUES (
	'business',
	'Business',
	'Para empresas establecidas (ACTUALIZADO: pricing rentable)',
	13000, -- $130.00 (antes $99.00)
	140400, -- $1,404.00 (10% descuento anual)
	20000, -- (antes 30,000 - causaba pérdidas)
	240000,
	200,
	12,
	20,
	50,
	'{"customExperts": true, "pdfExport": true, "apiAccess": true, "prioritySupport": true, "whiteLabel": true, "analytics": true, "webhooks": true, "scenariosAccess": true, "departmentsAccess": true}'::jsonb,
	true,
	true,
	4,
	'Fixed pricing to prevent losses - reduced credits from 30k to 20k, increased price from $99 to $130'
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "pricing_global_config" IS 'Configuración global del sistema de pricing (CREDIT_MULTIPLIER, USD_PER_CREDIT)';
COMMENT ON TABLE "tier_pricing_config" IS 'Configuración de cada tier (precios, créditos, features)';
COMMENT ON TABLE "pricing_change_history" IS 'Historial de cambios en la configuración de pricing';

COMMENT ON COLUMN "pricing_global_config"."credit_multiplier" IS 'Markup sobre costo API (1.75 = 75% markup)';
COMMENT ON COLUMN "pricing_global_config"."usd_per_credit" IS 'Valor de 1 crédito en USD (0.01 = 100 créditos = $1)';
COMMENT ON COLUMN "tier_pricing_config"."monthly_price_usd" IS 'Precio mensual en centavos (2900 = $29.00)';
COMMENT ON COLUMN "tier_pricing_config"."monthly_credits" IS 'Créditos incluidos en plan mensual';
