import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5434/quoorum";

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 5,
  prepare: false,
  onnotice: () => {},
  max_lifetime: 60 * 30,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
