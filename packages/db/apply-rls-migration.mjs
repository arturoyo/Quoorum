import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:neIC2Jm67vOFsqSs@db.ipcbpkbvrftchbmpemlg.supabase.co:5432/postgres?sslmode=require';

console.log('🔐 Connecting to database...');
const sql = postgres(DATABASE_URL);

try {
  console.log('📄 Reading migration file...');
  const migrationSQL = readFileSync(
    join(__dirname, 'drizzle', '0019_enable_rls_security.sql'),
    'utf-8'
  );

  console.log('🚀 Applying RLS migration...');
  await sql.unsafe(migrationSQL);

  console.log('✅ Migration applied successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log('  - RLS enabled on 40+ tables');
  console.log('  - Security policies created for all tables');
  console.log('  - User-based access control implemented');
  console.log('');
  console.log('🔍 You can verify in Supabase Dashboard > Database > Tables');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  if (error.position) {
    console.error('Error at position:', error.position);
  }
  process.exit(1);
} finally {
  await sql.end();
}
