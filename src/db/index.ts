import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { datenbankUrl, pgOptionen } from "./verbindung";

export { schema };

/** Ist eine Datenbank konfiguriert? Ohne zeigt die App nur die Startdaten an. */
export function hatDatenbank(): boolean {
  return !!datenbankUrl();
}

type Db = NodePgDatabase & { $client: pg.Pool };

// Ein Pool je Server-Instanz. Auf Vercel (Serverless) klein halten und den Supabase-Pooler
// (Transaktionsmodus, Port 6543) verwenden – siehe README.
const global = globalThis as unknown as { __pkDb?: Db };

export function db(): Db {
  if (global.__pkDb) return global.__pkDb;
  const url = datenbankUrl();
  if (!url) throw new Error("Keine Datenbank konfiguriert (DATABASE_URL oder POSTGRES_URL).");
  const pool = new pg.Pool({
    ...pgOptionen(url),
    max: Number(process.env.DB_POOL_MAX ?? 5),
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 20_000,
  });
  // Abgebrochene Verbindungen dürfen den Server nicht beenden
  pool.on("error", (e) => console.error("db", e.message));
  global.__pkDb = drizzle({ client: pool });
  return global.__pkDb;
}
