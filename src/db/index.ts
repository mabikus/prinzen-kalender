import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

export { schema };

/** Ist eine Datenbank konfiguriert? Ohne DATABASE_URL zeigt die App nur die Startdaten an. */
export function hatDatenbank(): boolean {
  return !!process.env.DATABASE_URL;
}

type Db = NodePgDatabase & { $client: pg.Pool };

// Ein Pool je Server-Instanz. Auf Vercel (Serverless) klein halten und den Supabase-Pooler
// (Transaktionsmodus, Port 6543) verwenden – siehe README.
const global = globalThis as unknown as { __pkDb?: Db };

export function db(): Db {
  if (global.__pkDb) return global.__pkDb;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ist nicht gesetzt.");
  const pool = new pg.Pool({
    connectionString: url,
    max: Number(process.env.DB_POOL_MAX ?? 5),
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 20_000,
    // Supabase verlangt TLS; lokal (localhost) nicht
    ssl: /localhost|127\.0\.0\.1|sslmode=disable/.test(url) ? false : { rejectUnauthorized: false },
  });
  // Abgebrochene Verbindungen dürfen den Server nicht beenden
  pool.on("error", (e) => console.error("db", e.message));
  global.__pkDb = drizzle({ client: pool });
  return global.__pkDb;
}
