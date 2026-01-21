-- Drop existing companies table
DROP TABLE IF EXISTS companies CASCADE;

-- Create companies table with correct FK to profiles
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL,
  context text NOT NULL,
  industry varchar(100),
  size varchar(50),
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create index
CREATE INDEX IF NOT EXISTS companies_user_id_idx ON companies(user_id);

-- Create profile
INSERT INTO profiles (
  id,
  user_id,
  email,
  name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'f198d53b-9524-45b9-87cf-a810a857a616',
  'b88193ab-1c38-49a0-a86b-cf12a96f66a9',
  'usuario@quoorum.com',
  'Usuario Quoorum',
  'user',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT 'Profile created:' as info;
SELECT id, email, name FROM profiles WHERE id = 'f198d53b-9524-45b9-87cf-a810a857a616';
