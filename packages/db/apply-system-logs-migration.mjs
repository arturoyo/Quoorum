import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:neIC2Jm67vOFsqSs@db.ipcbpkbvrftchbmpemlg.supabase.co:5432/postgres?sslmode=require';

console.log('🔐 Connecting to Supabase...');
const sql = postgres(DATABASE_URL);

try {
  console.log('📄 Reading migration file...');
  const migrationSQL = readFileSync(
    join(__dirname, 'drizzle', '0001_strange_iron_monger.sql'),
    'utf-8'
  );

  console.log('🚀 Applying system_logs migration...');

  // Split by statement-breakpoint
  const statements = migrationSQL.split('-->statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    if (statement.startsWith('--')) continue;
    await sql.unsafe(statement);
  }

  console.log('✅ Migration applied successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log('  - Created enums: log_level, log_source');
  console.log('  - Created table: system_logs (11 columns)');
  console.log('  - Created 5 indexes for performance');
  console.log('  - Foreign key to users table');
  console.log('');
  console.log('🔍 Verify in Supabase Dashboard > Database > Tables');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Apply RLS policies (see LOGGING_SETUP.md)');
  console.log('  2. Access dashboard at /admin/logs');
  console.log('  3. Start logging!');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  if (error.code === 'ENOTFOUND') {
    console.error('');
    console.error('⚠️  Cannot reach Supabase. Please check:');
    console.error('  - Internet connection');
    console.error('  - Supabase project is running');
    console.error('  - DATABASE_URL is correct');
  }
  if (error.code === '42P07') {
    console.error('');
    console.error('ℹ️  Table already exists. Migration was probably already applied.');
  }
  process.exit(1);
} finally {
  await sql.end();
}
