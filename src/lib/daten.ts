import "server-only";
import { connection } from "next/server";
import { desc, eq } from "drizzle-orm";
import { startGruppen, startTermine } from "@/data/session-2026-27";
import { db, hatDatenbank, schema } from "@/db";
import type { Daten, Gruppe, Termin } from "./types";
import { sortiere } from "./zeit";

// Datenzugriff – nur über diese Datei.
// - mit DATABASE_URL: Postgres (Supabase) über Drizzle, lesen und schreiben
// - ohne: Startdaten aus dem Repo, nur lesen

export type Datenquelle = "datenbank" | "startdaten";

export function datenquelle(): Datenquelle {
  return hatDatenbank() ? "datenbank" : "startdaten";
}

/** Kann gespeichert werden? Sonst Grund als Text. */
export function speichernMoeglich(): true | string {
  return hatDatenbank() ? true : "Bearbeiten ist erst möglich, wenn die Datenbank verbunden ist (DATABASE_URL, siehe README).";
}

/** Wer ändert? Für das Protokoll. */
export interface Wer {
  id: string;
  name: string;
}

function ordne(d: Daten): Daten {
  return {
    gruppen: [...d.gruppen].sort((a, b) => a.sortierung - b.sortierung || a.name.localeCompare(b.name)),
    termine: sortiere(d.termine),
  };
}

/** "18:30:00" -> "18:30" */
const hhmm = (v: string | null) => (v ? v.slice(0, 5) : null);

type TerminZeile = typeof schema.termine.$inferSelect;

function ausDb(r: TerminZeile, gruppen: string[]): Termin {
  return {
    id: r.id,
    datum: r.datum,
    treffzeit: hhmm(r.treffzeit),
    treffpunkt: r.treffpunkt,
    beginn: hhmm(r.beginn),
    ort: r.ort,
    ende: hhmm(r.ende),
    anschluss_an: r.anschluss_an,
    titel: r.titel,
    tagesprogramm: r.tagesprogramm,
    veranstalter: r.veranstalter,
    art: r.art,
    status: r.status,
    umfang: r.umfang,
    gruppen,
    anmeldung: r.anmeldung,
    karten_bestellt: r.karten_bestellt,
    hinweis: r.hinweis,
    bemerkung: r.bemerkung,
    quelle: r.quelle,
    pruefen: r.pruefen,
  };
}

function inDb(t: Termin): typeof schema.termine.$inferInsert {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { gruppen, ...zeile } = t;
  return zeile;
}

/** Alle Termine und Gruppen – bei jeder Anfrage frisch (kein Cache). */
export async function ladeDaten(): Promise<Daten> {
  await connection();
  if (!hatDatenbank()) return ordne({ termine: structuredClone(startTermine), gruppen: structuredClone(startGruppen) });

  const d = db();
  const [gruppen, termine, zuordnung] = await Promise.all([
    d.select().from(schema.gruppen),
    d.select().from(schema.termine),
    d.select().from(schema.terminGruppen),
  ]);
  const proTermin = new Map<string, string[]>();
  for (const z of zuordnung) proTermin.set(z.termin_id, [...(proTermin.get(z.termin_id) ?? []), z.gruppe_id]);
  return ordne({
    gruppen: gruppen as Gruppe[],
    termine: termine.map((t) => ausDb(t, proTermin.get(t.id) ?? [])),
  });
}

type Tx = Parameters<Parameters<ReturnType<typeof db>["transaction"]>[0]>[0];

async function protokolliere(
  tx: Tx,
  wer: Wer,
  aktion: string,
  objekt: { id: string; titel: string },
  details?: unknown,
) {
  await tx.insert(schema.protokoll).values({
    benutzer_id: wer.id,
    benutzer_name: wer.name,
    aktion,
    objekt_id: objekt.id,
    titel: objekt.titel,
    details: details ?? null,
  });
}

/** Unterschiede zweier Termine für das Protokoll (nur geänderte Felder). */
function unterschied(vorher: Termin | undefined, nachher: Termin) {
  if (!vorher) return null;
  const felder: Record<string, { vorher: unknown; nachher: unknown }> = {};
  for (const k of Object.keys(nachher) as (keyof Termin)[]) {
    if (JSON.stringify(vorher[k]) !== JSON.stringify(nachher[k])) felder[k] = { vorher: vorher[k], nachher: nachher[k] };
  }
  return felder;
}

async function ladeTermin(tx: Tx, id: string): Promise<Termin | undefined> {
  const [r] = await tx.select().from(schema.termine).where(eq(schema.termine.id, id));
  if (!r) return undefined;
  const g = await tx.select().from(schema.terminGruppen).where(eq(schema.terminGruppen.termin_id, id));
  return ausDb(r, g.map((x) => x.gruppe_id));
}

/** Termin anlegen oder ändern (mit Gruppen) – eine Transaktion, mit Protokoll. */
export async function speichereTermin(t: Termin, wer: Wer, aktion?: string): Promise<Termin> {
  return db().transaction(async (tx) => {
    const vorher = await ladeTermin(tx, t.id);
    const zeile = inDb(t);
    await tx.insert(schema.termine).values(zeile).onConflictDoUpdate({ target: schema.termine.id, set: zeile });
    await tx.delete(schema.terminGruppen).where(eq(schema.terminGruppen.termin_id, t.id));
    if (t.gruppen.length) {
      await tx.insert(schema.terminGruppen).values(t.gruppen.map((gruppe_id) => ({ termin_id: t.id, gruppe_id })));
    }
    const diff = unterschied(vorher, t);
    if (!vorher || (diff && Object.keys(diff).length)) {
      await protokolliere(tx, wer, aktion ?? (vorher ? "termin.geaendert" : "termin.angelegt"), t, diff);
    }
    return t;
  });
}

/** Termin löschen; gibt den gelöschten Termin zurück (für „Rückgängig“). */
export async function loescheTermin(id: string, wer: Wer): Promise<Termin | undefined> {
  return db().transaction(async (tx) => {
    const vorher = await ladeTermin(tx, id);
    if (!vorher) return undefined;
    await tx.delete(schema.termine).where(eq(schema.termine.id, id));
    await protokolliere(tx, wer, "termin.geloescht", vorher, { termin: vorher });
    return vorher;
  });
}

export async function speichereGruppe(g: Gruppe, wer: Wer) {
  await db().transaction(async (tx) => {
    const [vorher] = await tx.select().from(schema.gruppen).where(eq(schema.gruppen.id, g.id));
    await tx.insert(schema.gruppen).values(g).onConflictDoUpdate({ target: schema.gruppen.id, set: g });
    await protokolliere(tx, wer, vorher ? "gruppe.geaendert" : "gruppe.angelegt", { id: g.id, titel: g.name });
  });
}

export async function loescheGruppe(id: string, wer: Wer) {
  await db().transaction(async (tx) => {
    const [vorher] = await tx.select().from(schema.gruppen).where(eq(schema.gruppen.id, id));
    if (!vorher) return;
    await tx.delete(schema.gruppen).where(eq(schema.gruppen.id, id));
    await protokolliere(tx, wer, "gruppe.geloescht", { id, titel: vorher.name });
  });
}

export interface ProtokollEintrag {
  id: number;
  zeitpunkt: string;
  benutzer_name: string | null;
  aktion: string;
  objekt_id: string | null;
  titel: string | null;
  details: unknown;
}

export async function ladeProtokoll(opts: { objektId?: string; limit?: number } = {}): Promise<ProtokollEintrag[]> {
  await connection();
  if (!hatDatenbank()) return [];
  const q = db()
    .select()
    .from(schema.protokoll)
    .where(opts.objektId ? eq(schema.protokoll.objekt_id, opts.objektId) : undefined)
    .orderBy(desc(schema.protokoll.zeitpunkt), desc(schema.protokoll.id))
    .limit(opts.limit ?? 200);
  return (await q).map((p) => ({ ...p, zeitpunkt: p.zeitpunkt.toISOString() }));
}

/** Protokolleintrag außerhalb einer Termin-/Gruppen-Änderung (z. B. Benutzer). */
export async function protokolliereAktion(wer: Wer, aktion: string, objekt: { id: string; titel: string }, details?: unknown) {
  await db().transaction((tx) => protokolliere(tx, wer, aktion, objekt, details));
}
