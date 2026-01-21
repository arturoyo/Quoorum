-- Drop and recreate companies table with ALL columns
DROP TABLE IF EXISTS companies CASCADE;

CREATE TABLE companies (
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

CREATE INDEX IF NOT EXISTS companies_user_id_idx ON companies(user_id);

-- Verify columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;
