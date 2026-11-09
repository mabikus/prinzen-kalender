// Erzeugt supabase/seed.sql aus den Startdaten.
// Aufruf: npm run seed:sql
import { writeFileSync } from "node:fs";
import { startTermine } from "../src/data/session-2026-27.ts";

const spalten = [
  "id", "datum", "treffzeit", "beginn", "einlass", "ende", "anschluss_an", "titel",
  "tagesprogramm", "veranstalter", "treffpunkt", "ort", "kategorie", "status", "besetzung",
  "familie", "fahrt", "fahrt_details", "fahrer", "hinweis", "bemerkung", "quelle", "pruefen",
] as const;

function wert(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v)) return `array[${v.map(wert).join(", ")}]::text[]`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

// Termine ohne Anschluss zuerst einfügen (Fremdschlüssel anschluss_an)
const reihenfolge = [
  ...startTermine.filter((t) => !t.anschluss_an),
  ...startTermine.filter((t) => t.anschluss_an),
];

const zeilen = reihenfolge.map(
  (t) => `  (${spalten.map((s) => wert((t as unknown as Record<string, unknown>)[s])).join(", ")})`,
);

const sql = `-- Automatisch erzeugt mit \`npm run seed:sql\` – nicht von Hand bearbeiten.
-- Startdaten Session 2026/27 (${startTermine.length} Termine).
-- Im Supabase SQL Editor nach 0001_init.sql ausführen.

insert into termine (${spalten.join(", ")}) values
${zeilen.join(",\n")}
on conflict (id) do nothing;
`;

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log(`supabase/seed.sql geschrieben (${startTermine.length} Termine)`);
