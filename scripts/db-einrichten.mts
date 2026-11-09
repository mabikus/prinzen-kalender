// Bringt die Datenbank auf den neuesten Stand (Migrationen aus drizzle/) und spielt beim
// allerersten Mal die Startdaten der Session ein (nur wenn noch keine Gruppen und Termine da sind).
//
// Aufruf: npm run db:einrichten   (braucht DATABASE_URL oder die Variablen der Supabase-Integration)
// Läuft auf Vercel automatisch vor jedem Produktions-Build (siehe package.json "build").

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { startGruppen, startTermine } from "../src/data/session-2026-27.ts";
import { datenbankUrl, pgOptionen } from "../src/db/verbindung.ts";

try {
  process.loadEnvFile(".env.local");
} catch {
  // ohne .env.local: Umgebungsvariablen
}

const url = datenbankUrl();
if (!url) {
  console.log("db:einrichten – keine Datenbank konfiguriert, übersprungen.");
  process.exit(0);
}
if (process.env.VERCEL && process.env.VERCEL_ENV !== "production") {
  console.log("db:einrichten – Vorschau-Deployment, Datenbank bleibt unverändert.");
  process.exit(0);
}

const pool = new pg.Pool({ ...pgOptionen(url), max: 1, connectionTimeoutMillis: 20_000 });
const db = drizzle({ client: pool });

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("db:einrichten – Migrationen angewendet.");

const client = await pool.connect();
try {
  const { rows } = await client.query<{ n: string }>(
    "select (select count(*) from gruppen) + (select count(*) from termine) as n",
  );
  if (Number(rows[0].n) > 0) {
    console.log("db:einrichten – Daten vorhanden, Startdaten nicht nötig.");
  } else {
    await client.query("begin");
    for (const g of startGruppen) {
      await client.query(
        `insert into gruppen (id, kuerzel, name, beschreibung, personen, farbe, in_alle, sortierung)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [g.id, g.kuerzel, g.name, g.beschreibung, g.personen, g.farbe, g.in_alle, g.sortierung],
      );
    }
    // Termine ohne "im Anschluss an" zuerst (Fremdschlüssel)
    const sortiert = [...startTermine.filter((t) => !t.anschluss_an), ...startTermine.filter((t) => t.anschluss_an)];
    for (const t of sortiert) {
      await client.query(
        `insert into termine (id, datum, treffzeit, treffpunkt, beginn, ort, ende, anschluss_an, titel, tagesprogramm,
           veranstalter, art, status, umfang, anmeldung, karten_bestellt, hinweis, bemerkung, quelle, pruefen)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [
          t.id, t.datum, t.treffzeit, t.treffpunkt, t.beginn, t.ort, t.ende, t.anschluss_an, t.titel, t.tagesprogramm,
          t.veranstalter, t.art, t.status, t.umfang, t.anmeldung, t.karten_bestellt, t.hinweis, t.bemerkung, t.quelle,
          t.pruefen,
        ],
      );
      for (const g of t.gruppen) {
        await client.query("insert into termin_gruppen (termin_id, gruppe_id) values ($1,$2)", [t.id, g]);
      }
    }
    await client.query("commit");
    console.log(`db:einrichten – Startdaten eingespielt (${startGruppen.length} Gruppen, ${startTermine.length} Termine).`);
  }
} catch (e) {
  await client.query("rollback").catch(() => {});
  throw e;
} finally {
  client.release();
  await pool.end();
}
