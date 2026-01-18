-- Add user_id and library_expert_id columns to experts table for library vs custom experts

-- Add user_id column (nullable: null = library, !null = custom)
ALTER TABLE "experts" ADD COLUMN IF NOT EXISTS "user_id" uuid;

-- Add library_expert_id column (reference to original library expert if forked)
ALTER TABLE "experts" ADD COLUMN IF NOT EXISTS "library_expert_id" uuid;

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS "experts_user_id_idx" ON "experts" ("user_id");

-- Create index on library_expert_id for faster queries
CREATE INDEX IF NOT EXISTS "experts_library_expert_id_idx" ON "experts" ("library_expert_id");
