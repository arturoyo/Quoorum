-- Create team member role enum
CREATE TYPE "public"."team_member_role" AS ENUM('owner', 'admin', 'member', 'viewer');

-- Create team member status enum
CREATE TYPE "public"."team_member_status" AS ENUM('pending', 'active', 'inactive', 'removed');

-- Create team_members table
CREATE TABLE "public"."team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_owner_id" uuid NOT NULL,
	"member_profile_id" uuid,
	"invitation_email" varchar(255),
	"invitation_token" varchar(255),
	"invitation_expires_at" timestamp with time zone,
	"role" "team_member_role" DEFAULT 'member' NOT NULL,
	"status" "team_member_status" DEFAULT 'pending' NOT NULL,
	"permissions" varchar(500),
	"invited_by" uuid,
	"joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "public"."team_members" ADD CONSTRAINT "team_members_team_owner_id_profiles_id_fk" FOREIGN KEY ("team_owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."team_members" ADD CONSTRAINT "team_members_member_profile_id_profiles_id_fk" FOREIGN KEY ("member_profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."team_members" ADD CONSTRAINT "team_members_invited_by_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
