CREATE TYPE "public"."log_level" AS ENUM('debug', 'info', 'warn', 'error', 'fatal');--> statement-breakpoint
CREATE TYPE "public"."log_source" AS ENUM('client', 'server', 'worker', 'cron');--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"level" "log_level" NOT NULL,
	"source" "log_source" NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"error_name" varchar(255),
	"error_message" text,
	"error_stack" text,
	"duration_ms" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "system_logs_user_id_idx" ON "system_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "system_logs_level_idx" ON "system_logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX "system_logs_source_idx" ON "system_logs" USING btree ("source");--> statement-breakpoint
CREATE INDEX "system_logs_created_at_idx" ON "system_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "system_logs_user_level_created_idx" ON "system_logs" USING btree ("user_id","level","created_at");