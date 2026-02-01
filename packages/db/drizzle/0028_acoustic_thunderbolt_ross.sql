CREATE TYPE "public"."worker_role" AS ENUM('ceo', 'cto', 'cfo', 'cmo', 'coo', 'vp_sales', 'vp_product', 'vp_engineering', 'director', 'manager', 'senior', 'mid', 'junior', 'intern', 'consultant', 'advisor', 'custom');--> statement-breakpoint
CREATE TYPE "public"."worker_type" AS ENUM('internal', 'external_expert');--> statement-breakpoint
CREATE TABLE "workers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"department_id" uuid,
	"name" varchar(255) NOT NULL,
	"role" "worker_role" DEFAULT 'custom' NOT NULL,
	"type" "worker_type" DEFAULT 'internal' NOT NULL,
	"expertise" text NOT NULL,
	"description" text,
	"responsibilities" text,
	"system_prompt" text NOT NULL,
	"ai_config" jsonb NOT NULL,
	"avatar" varchar(500),
	"email" varchar(255),
	"phone" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_predefined" boolean DEFAULT false NOT NULL,
	"library_worker_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;