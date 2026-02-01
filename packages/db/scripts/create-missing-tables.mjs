import postgres from 'postgres'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '../../../.env.local') })

const sql = postgres(process.env.DATABASE_URL)

async function createTables() {
  try {
    console.log('[INFO] Creating missing tables...\n')

    // Create enums if not exist
    console.log('[1/8] Creating enums...')
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE profile_type AS ENUM ('expert', 'professional', 'role', 'icp', 'buyer_persona');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE tone_style AS ENUM ('analytical', 'skeptical', 'optimistic', 'pragmatic', 'visionary', 'direct', 'empathetic', 'assertive');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE maturity_level AS ENUM ('startup', 'growth', 'enterprise', 'legacy');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE context_relevance AS ENUM ('core', 'supplementary', 'case_study', 'industry_data', 'compliance');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE relationship_type AS ENUM ('compatible', 'complementary', 'prerequisite', 'alternative', 'context_for');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)
    console.log('[OK] Enums created\n')

    // Create strategic_profiles table
    console.log('[2/8] Creating strategic_profiles table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS strategic_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        -- Universal Identity
        type profile_type NOT NULL,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(500),
        description TEXT,
        category VARCHAR(100),
        specialization VARCHAR(255),

        -- Behavioral Attributes
        tone_style tone_style DEFAULT 'pragmatic',
        expertise_level INTEGER DEFAULT 7,
        collaboration_style VARCHAR(50),

        -- Context & Relevance
        tags TEXT[],
        industries TEXT[],
        use_cases TEXT[],
        maturity_level maturity_level,

        -- Configuration (JSONB)
        ai_config JSONB,
        firmographics JSONB,
        psychographics JSONB,
        custom_fields JSONB,

        -- Status & Visibility
        is_active BOOLEAN DEFAULT true,
        is_system_profile BOOLEAN DEFAULT false,
        is_premium BOOLEAN DEFAULT false,

        -- Ownership (nullable for system profiles)
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        company_id UUID,

        -- Timestamps
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_strategic_profiles_type ON strategic_profiles(type);
      CREATE INDEX IF NOT EXISTS idx_strategic_profiles_slug ON strategic_profiles(slug);
      CREATE INDEX IF NOT EXISTS idx_strategic_profiles_user_id ON strategic_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_strategic_profiles_company_id ON strategic_profiles(company_id);
      CREATE INDEX IF NOT EXISTS idx_strategic_profiles_category ON strategic_profiles(category);
    `)
    console.log('[OK] strategic_profiles table created\n')

    // Create market_simulations table
    console.log('[3/8] Creating market_simulations table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS market_simulations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        -- Input Data
        variants TEXT[] NOT NULL,
        buyer_persona_ids UUID[] NOT NULL,
        context TEXT,

        -- Results
        winning_variant_index INTEGER NOT NULL,
        winning_variant_text TEXT NOT NULL,
        consensus_score DECIMAL(5,2) NOT NULL,
        avg_friction DECIMAL(4,2) NOT NULL,
        friction_map JSONB NOT NULL,
        synthesis TEXT NOT NULL,

        -- Cost Tracking
        evaluation_cost_usd DECIMAL(10,6) NOT NULL,
        synthesis_cost_usd DECIMAL(10,6) NOT NULL,
        total_cost_usd DECIMAL(10,6) NOT NULL,
        tokens_used INTEGER NOT NULL,
        execution_time_ms INTEGER NOT NULL,

        -- Ownership
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        company_id UUID,

        -- Timestamps
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_market_simulations_user_id ON market_simulations(user_id);
      CREATE INDEX IF NOT EXISTS idx_market_simulations_company_id ON market_simulations(company_id);
      CREATE INDEX IF NOT EXISTS idx_market_simulations_created_at ON market_simulations(created_at DESC);
    `)
    console.log('[OK] market_simulations table created\n')

    // Verify tables
    console.log('[4/8] Verifying tables...')
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('strategic_profiles', 'market_simulations')
      ORDER BY table_name
    `
    console.log('[OK] Tables found:', tables.map(t => t.table_name).join(', '))

    if (tables.length === 2) {
      console.log('\n[SUCCESS] All tables created successfully!')
      return true
    } else {
      console.log('\n[ERROR] Some tables missing')
      return false
    }

  } catch (error) {
    console.error('\n[ERROR]', error.message)
    return false
  } finally {
    await sql.end()
  }
}

createTables()
  .then(success => process.exit(success ? 0 : 1))
