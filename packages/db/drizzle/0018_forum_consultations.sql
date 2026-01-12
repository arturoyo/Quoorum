-- Forum Consultations System Migration
-- Stores automatic Forum consultations during response generation

-- Create enums (guarded so re-running is safe)
DO $$ BEGIN
  CREATE TYPE "consultation_trigger" AS ENUM(
    'price_negotiation',
    'competitor_mention',
    'objection_complex',
    'high_value_client',
    'escalation_risk',
    'contract_terms',
    'strategic_decision',
    'churn_signal'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "response_approach" AS ENUM('empathetic', 'assertive', 'consultative', 'direct');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "consultation_urgency" AS ENUM('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create forum_consultations table
CREATE TABLE IF NOT EXISTS "forum_consultations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,

  "user_id" uuid NOT NULL,
  "client_id" uuid,
  "conversation_id" uuid,

  "original_message" text NOT NULL,

  "triggers" jsonb NOT NULL,
  "urgency" "consultation_urgency" DEFAULT 'low' NOT NULL,
  "complexity_confidence" real,

  "strategy" text,
  "response_approach" "response_approach",
  "talking_points" jsonb,
  "avoid_saying" jsonb,
  "risks_to_address" jsonb,
  "opportunities_to_leverage" jsonb,

  "negotiation_guidance" jsonb,

  "recommend_human_escalation" boolean DEFAULT false,
  "escalation_reason" text,

  "advice_confidence" real,
  "was_advice_used" boolean DEFAULT true,
  "processing_time_ms" integer,

  "user_rating" integer,
  "user_feedback" text,

  "client_context" jsonb,

  "created_at" timestamp with time zone DEFAULT now() NOT NULL,

  CONSTRAINT "forum_consultations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade,
  CONSTRAINT "forum_consultations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE set null,
  CONSTRAINT "forum_consultations_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE set null
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_forum_consultations_user" ON "forum_consultations" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_forum_consultations_client" ON "forum_consultations" ("client_id");
CREATE INDEX IF NOT EXISTS "idx_forum_consultations_conversation" ON "forum_consultations" ("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_forum_consultations_created" ON "forum_consultations" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_forum_consultations_urgency" ON "forum_consultations" ("urgency");

COMMENT ON TABLE "forum_consultations" IS 'Stores automatic Forum consultations during Wallie response generation';
