CREATE TYPE "public"."referral_reward_type" AS ENUM('free_month', 'unlock_agent', 'credits', 'feature_unlock', 'discount');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('pending', 'converted', 'rewarded', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"max_uses" integer DEFAULT 100,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_codes_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" uuid NOT NULL,
	"referral_code_id" uuid,
	"referred_email" varchar(255),
	"referred_user_id" uuid,
	"status" "referral_status" DEFAULT 'pending' NOT NULL,
	"converted_at" timestamp with time zone,
	"rewarded_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"reward_type" "referral_reward_type",
	"reward_value" integer,
	"reward_claimed" boolean DEFAULT false NOT NULL,
	"invitation_method" varchar(50),
	"invitation_sent_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_profiles_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referral_code_id_referral_codes_id_fk" FOREIGN KEY ("referral_code_id") REFERENCES "public"."referral_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_profiles_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_companies_user" ON "companies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_companies_is_active" ON "companies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_departments_company" ON "departments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_departments_parent" ON "departments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_departments_type" ON "departments" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_departments_is_active" ON "departments" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_profiles_user_id" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_profiles_email" ON "profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_profiles_is_active" ON "profiles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_quoorum_custom_experts_user" ON "quoorum_custom_experts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_custom_experts_active" ON "quoorum_custom_experts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_quoorum_custom_experts_user_active" ON "quoorum_custom_experts" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_comments_debate" ON "quoorum_debate_comments" USING btree ("debate_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_comments_user" ON "quoorum_debate_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_comments_parent" ON "quoorum_debate_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_likes_debate" ON "quoorum_debate_likes" USING btree ("debate_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_likes_user" ON "quoorum_debate_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_likes_user_debate" ON "quoorum_debate_likes" USING btree ("user_id","debate_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_templates_created_by" ON "quoorum_debate_templates" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_templates_industry" ON "quoorum_debate_templates" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_templates_category" ON "quoorum_debate_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debate_templates_public" ON "quoorum_debate_templates" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_user" ON "quoorum_debates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_status" ON "quoorum_debates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_visibility" ON "quoorum_debates" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_company" ON "quoorum_debates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_department" ON "quoorum_debates" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_created" ON "quoorum_debates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_user_status" ON "quoorum_debates" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_user_created" ON "quoorum_debates" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_quoorum_debates_user_deleted" ON "quoorum_debates" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_quoorum_expert_performance_expert" ON "quoorum_expert_performance" USING btree ("expert_id");