// Erzeugt supabase/seed.sql aus den Startdaten.
// Aufruf: npm run seed:sql
import { writeFileSync } from "node:fs";
import { startGruppen, startTermine } from "../src/data/session-2026-27.ts";

function wert(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.length ? `array[${v.map(wert).join(", ")}]::text[]` : "'{}'::text[]";
  return `'${String(v).replace(/'/g, "''")}'`;
}

function insert(tabelle: string, spalten: readonly string[], zeilen: Record<string, unknown>[], konflikt: string) {
  const werte = zeilen.map((z) => `  (${spalten.map((s) => wert(z[s])).join(", ")})`);
  return `insert into ${tabelle} (${spalten.join(", ")}) values\n${werte.join(",\n")}\non conflict${konflikt} do nothing;\n`;
}

const gruppenSpalten = ["id", "kuerzel", "name", "beschreibung", "personen", "farbe", "in_alle", "sortierung"] as const;
const terminSpalten = [
  "id", "datum", "treffzeit", "treffpunkt", "beginn", "ort", "ende", "anschluss_an", "titel",
  "tagesprogramm", "veranstalter", "art", "status", "umfang", "anmeldung", "karten_bestellt",
  "hinweis", "bemerkung", "quelle", "pruefen",
] as const;

// Termine ohne Anschluss zuerst einfügen (Fremdschlüssel anschluss_an)
const termine = [
  ...startTermine.filter((t) => !t.anschluss_an),
  ...startTermine.filter((t) => t.anschluss_an),
] as unknown as Record<string, unknown>[];

const zuordnungen = startTermine.flatMap((t) => t.gruppen.map((g) => ({ termin_id: t.id, gruppe_id: g })));

const sql = `-- Automatisch erzeugt mit \`npm run seed:sql\` – nicht von Hand bearbeiten.
-- Startdaten Session 2026/27: ${startGruppen.length} Gruppen, ${startTermine.length} Termine.
-- Im Supabase SQL Editor nach 0001_init.sql ausführen.

${insert("gruppen", gruppenSpalten, startGruppen as unknown as Record<string, unknown>[], " (id)")}
${insert("termine", terminSpalten, termine, " (id)")}
${insert("termin_gruppen", ["termin_id", "gruppe_id"], zuordnungen, "")}`;

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log(`supabase/seed.sql geschrieben (${startGruppen.length} Gruppen, ${startTermine.length} Termine)`);
