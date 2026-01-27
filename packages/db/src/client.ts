import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/quoorum";

// #region agent log
fetch('http://127.0.0.1:7242/ingest/904a4f4c-b744-40dc-870a-654c1b1871a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'packages/db/src/client.ts:5',message:'DB client init - DATABASE_URL check',data:{hasEnvVar:!!process.env.DATABASE_URL,connectionString:connectionString.replace(/:[^:@]+@/,':****@'),fallbackUsed:!process.env.DATABASE_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion

// Configure postgres client with timeouts and connection limits to prevent hanging
// Added lazy connection to prevent hanging on import
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections in the pool (aumentado para evitar bloqueos)
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 5, // Connection timeout in seconds (reducido para fallar rápido)
  prepare: false, // Disable prepared statements for pgbouncer compatibility
  onnotice: () => {}, // Suppress notices
  max_lifetime: 60 * 30, // Maximum lifetime of a connection in seconds (30 minutes)
  onparameter: (key, value) => {
    // #region agent log
    if(key==='database')fetch('http://127.0.0.1:7242/ingest/904a4f4c-b744-40dc-870a-654c1b1871a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'packages/db/src/client.ts:20',message:'DB client connection parameter',data:{key,value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
  },
});

// #region agent log
fetch('http://127.0.0.1:7242/ingest/904a4f4c-b744-40dc-870a-654c1b1871a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'packages/db/src/client.ts:25',message:'DB client created - drizzle init',data:{clientCreated:!!client,dbCreated:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

export const db = drizzle(client, { schema });

// #region agent log
fetch('http://127.0.0.1:7242/ingest/904a4f4c-b744-40dc-870a-654c1b1871a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'packages/db/src/client.ts:27',message:'DB drizzle instance created',data:{dbCreated:!!db},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

export type Database = typeof db;
