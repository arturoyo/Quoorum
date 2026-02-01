CREATE TYPE "public"."process_phase_status" AS ENUM('pending', 'in_progress', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."process_status" AS ENUM('in_progress', 'completed', 'paused', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "process_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"process_type" varchar(100) NOT NULL,
	"process_id" uuid,
	"process_name" text NOT NULL,
	"current_phase" integer DEFAULT 1 NOT NULL,
	"total_phases" integer DEFAULT 5 NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"status" "process_status" DEFAULT 'in_progress' NOT NULL,
	"phases" jsonb NOT NULL,
	"metadata" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "process_timeline" ADD CONSTRAINT "process_timeline_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_process_timeline_user" ON "process_timeline" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_process_timeline_type" ON "process_timeline" USING btree ("process_type");--> statement-breakpoint
CREATE INDEX "idx_process_timeline_status" ON "process_timeline" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_process_timeline_started" ON "process_timeline" USING btree ("started_at");