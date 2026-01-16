const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

const SUPABASE_URL = 'https://ipcbpkbvrftchbmpemlg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwY2Jwa2J2cmZ0Y2hibXBlbWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4ODI2MTQsImV4cCI6MjA1MDQ1ODYxNH0.GTKJP9xo_Ar-uLy3SQdOaIDv1sV3TXDzK3JF3cIyLBk';
const LOCAL_DB_URL = 'postgresql://postgres:postgres@localhost:5433/quoorum';

async function migrate() {
  console.log('Iniciando migracion...');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const pgClient = new Client({ connectionString: LOCAL_DB_URL });
  await pgClient.connect();

  try {
    const { data: debates, error } = await supabase
      .from('quoorum_debates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo debates:', error);
      return;
    }

    if (!debates || debates.length === 0) {
      console.log('No hay debates en Supabase');
      return;
    }

    console.log(`Encontrados ${debates.length} debates en Supabase`);

    let migrated = 0;
    for (const d of debates) {
      try {
        await pgClient.query(`
          INSERT INTO quoorum_debates (
            id, user_id, question, mode, status, visibility,
            context, metadata, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO NOTHING
        `, [
          d.id,
          d.user_id,
          d.question,
          d.mode,
          d.status,
          d.visibility,
          JSON.stringify(d.context || {}),
          JSON.stringify(d.metadata || {}),
          d.created_at,
          d.updated_at
        ]);
        migrated++;
        const title = (d.metadata && d.metadata.title) || d.question.substring(0, 50);
        console.log(`Migrado: ${title}`);
      } catch (err) {
        console.error(`Error migrando ${d.id}:`, err.message);
      }
    }

    console.log(`\nCompletado: ${migrated} debates migrados`);
  } finally {
    await pgClient.end();
  }
}

migrate().catch(console.error);
