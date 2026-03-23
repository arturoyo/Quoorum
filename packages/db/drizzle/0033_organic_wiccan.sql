CREATE TYPE "public"."credit_transaction_source" AS ENUM('debate_creation', 'debate_execution', 'debate_failed', 'debate_cancelled', 'monthly_allocation', 'purchase', 'admin_adjustment', 'refund', 'daily_reset');--> statement-breakpoint
CREATE TYPE "public"."credit_transaction_type" AS ENUM('deduction', 'addition', 'refund');--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"debate_id" uuid,
	"type" "credit_transaction_type" NOT NULL,
	"source" "credit_transaction_source" NOT NULL,
	"amount" integer NOT NULL,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_departments" (
	"worker_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "worker_departments_worker_id_department_id_pk" PRIMARY KEY("worker_id","department_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_daily_credit_refresh" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_debate_id_quoorum_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."quoorum_debates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_departments" ADD CONSTRAINT "worker_departments_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_departments" ADD CONSTRAINT "worker_departments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_transactions_user_id_idx" ON "credit_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_debate_id_idx" ON "credit_transactions" USING btree ("debate_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_type_idx" ON "credit_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "credit_transactions_source_idx" ON "credit_transactions" USING btree ("source");--> statement-breakpoint
CREATE INDEX "credit_transactions_created_at_idx" ON "credit_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "credit_transactions_user_created_idx" ON "credit_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_worker_departments_worker" ON "worker_departments" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "idx_worker_departments_department" ON "worker_departments" USING btree ("department_id");