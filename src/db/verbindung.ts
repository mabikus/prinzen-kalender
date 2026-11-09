// Datenbank-Adresse – ohne Abhängigkeiten, damit auch Skripte (db:einrichten) sie nutzen können.
//
// Reihenfolge:
// - DATABASE_URL (eigene Einstellung)
// - POSTGRES_URL (setzt die Supabase-Integration in Vercel automatisch, Transaction Pooler)
// Auch Migrationen laufen über den Pooler (IPv4, funktioniert von Vercel aus immer).

export function datenbankUrl(): string | null {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || null;
}

const lokal = (url: string) => /@(localhost|127\.0\.0\.1)[:/]/.test(url) || /sslmode=disable/.test(url);

/**
 * Optionen für `pg`: Parameter aus der Adresse (sslmode, supa …) entfernen – `pg` würde sonst bei
 * sslmode=require das Zertifikat streng prüfen und an Supabase scheitern – und TLS selbst setzen.
 */
export function pgOptionen(url: string) {
  const u = new URL(url);
  u.search = "";
  return {
    connectionString: u.toString(),
    ssl: lokal(url) ? false : { rejectUnauthorized: false },
  };
}
