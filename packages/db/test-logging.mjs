import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:neIC2Jm67vOFsqSs@db.ipcbpkbvrftchbmpemlg.supabase.co:5432/postgres?sslmode=require';

console.log('🔐 Connecting to Supabase...');
const sql = postgres(DATABASE_URL);

try {
  console.log('📝 Inserting test log...');

  const [log] = await sql`
    INSERT INTO system_logs (
      level,
      source,
      message,
      metadata
    ) VALUES (
      'info',
      'server',
      'Sistema de logging activado correctamente',
      '{"test": true, "timestamp": "2026-01-13T12:00:00Z"}'::jsonb
    )
    RETURNING *
  `;

  console.log('✅ Test log created successfully!');
  console.log('');
  console.log('📊 Log Details:');
  console.log('  ID:', log.id);
  console.log('  Level:', log.level);
  console.log('  Source:', log.source);
  console.log('  Message:', log.message);
  console.log('  Created:', log.created_at);
  console.log('');
  console.log('🎯 Next steps:');
  console.log('  1. Apply RLS policies (run the SQL in supabase/migrations/20260113_system_logs_rls.sql)');
  console.log('  2. Access dashboard at http://localhost:3002/admin/logs');
  console.log('  3. You should see this test log!');

} catch (error) {
  console.error('❌ Test failed:', error.message);

  if (error.code === '42P01') {
    console.error('');
    console.error('⚠️  Table system_logs does not exist.');
    console.error('Please run: node apply-system-logs-migration.mjs');
  }

  process.exit(1);
} finally {
  await sql.end();
}
