import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

const connectionString = process.env.DATABASE_URL ?? "postgresql://localhost:5432/forum";

// Configure postgres client with timeouts and connection limits to prevent hanging
// Added lazy connection to prevent hanging on import
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections in the pool (aumentado para evitar bloqueos)
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  prepare: false, // Disable prepared statements for pgbouncer compatibility
  onnotice: () => {}, // Suppress notices
  max_lifetime: 60 * 30, // Maximum lifetime of a connection in seconds (30 minutes)
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
