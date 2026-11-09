"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  aendereName,
  BenutzerFehler,
  einladungErstellen,
  einladungZurueckziehen,
  loescheBenutzer,
  passwortLinkErstellen,
  setzeAktiv,
} from "@/lib/benutzer";
import { ladeDaten, loescheGruppe, loescheTermin, speichereGruppe, speichereTermin, type Wer } from "@/lib/daten";
import { FARBLISTE } from "@/lib/labels";
import { slug } from "@/lib/slug";
import type { Anmeldung, Art, Farbe, Gruppe, Status, Termin, Umfang } from "@/lib/types";
import { aktuellerAdmin, type Admin } from "@/lib/sitzung";
import { basisUrl } from "@/lib/auth";
import { headers } from "next/headers";

// Alle Änderungen aus der Verwaltung. Jede Aktion prüft selbst die Anmeldung –
// Server Actions sind auch direkt per POST erreichbar.

export type Ergebnis<T = undefined> = { ok: true; daten: T } | { ok: false; fehler: string };

async function admin(): Promise<Admin> {
  const a = await aktuellerAdmin();
  if (!a) throw new BenutzerFehler("Bitte neu anmelden.");
  return a;
}

const wer = (a: Admin): Wer => ({ id: a.id, name: a.name });

async function sicher<T>(f: (a: Admin) => Promise<T>): Promise<Ergebnis<T>> {
  try {
    return { ok: true, daten: await f(await admin()) };
  } catch (e) {
    if (e instanceof BenutzerFehler) return { ok: false, fehler: e.message };
    const msg = e instanceof Error ? e.message : String(e);
    if (/Super-Admin/.test(msg)) return { ok: false, fehler: msg.replace(/^.*?(Der Super-Admin)/, "$1") };
    console.error("verwaltung", e);
    return { ok: false, fehler: "Speichern hat nicht geklappt. Bitte noch einmal versuchen." };
  }
}

// ───────────── Termine ─────────────

export interface TerminEingabe {
  id?: string;
  datum: string;
  treffzeit: string | null;
  treffpunkt: string | null;
  beginn: string | null;
  ort: string | null;
  ende: string | null;
  anschluss_an: string | null;
  titel: string;
  tagesprogramm: string | null;
  veranstalter: string | null;
  art: Art;
  status: Status;
  umfang: Umfang;
  gruppen: string[];
  anmeldung: Anmeldung | null;
  karten_bestellt: number | null;
  hinweis: string | null;
  bemerkung: string | null;
  pruefen: string | null;
}

const leer = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

function uhrzeit(v: unknown, feld: string): string | null {
  const s = leer(v);
  if (s === null) return null;
  const m = /^(\d{1,2})[:.](\d{2})/.exec(s);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) throw new BenutzerFehler(`Ungültige Uhrzeit bei „${feld}“: ${s}`);
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

function wahl<T extends string>(v: unknown, erlaubt: readonly T[], standard: T): T {
  return erlaubt.includes(v as T) ? (v as T) : standard;
}

/** Prüft und vervollständigt eine Eingabe zu einem Termin. */
async function zuTermin(e: TerminEingabe): Promise<Termin> {
  const daten = await ladeDaten();
  const datum = leer(e.datum);
  const titel = leer(e.titel);
  if (!datum || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) throw new BenutzerFehler("Bitte ein gültiges Datum angeben.");
  if (!titel) throw new BenutzerFehler("Bitte einen Titel angeben.");
  const alt = e.id ? daten.termine.find((t) => t.id === e.id) : undefined;
  let id = alt?.id;
  if (!id) {
    const basis = `${datum}-${slug(titel)}`.slice(0, 80);
    id = basis;
    for (let n = 2; daten.termine.some((t) => t.id === id); n++) id = `${basis}-${n}`;
  }
  const gruppenIds = new Set(daten.gruppen.map((g) => g.id));
  const karten = e.karten_bestellt;
  return {
    id,
    datum,
    treffzeit: uhrzeit(e.treffzeit, "Treffzeit"),
    treffpunkt: leer(e.treffpunkt),
    beginn: uhrzeit(e.beginn, "Beginn"),
    ort: leer(e.ort),
    ende: uhrzeit(e.ende, "Ende"),
    anschluss_an:
      e.anschluss_an && e.anschluss_an !== id && daten.termine.some((t) => t.id === e.anschluss_an) ? e.anschluss_an : null,
    titel,
    tagesprogramm: leer(e.tagesprogramm),
    veranstalter: leer(e.veranstalter),
    art: wahl<Art>(e.art, ["intern", "extern"], "extern"),
    status: wahl<Status>(e.status, ["bestaetigt", "vorbehalt"], "bestaetigt"),
    umfang: wahl<Umfang>(e.umfang, ["auswahl", "alle", "jeder_verfuegbare"], "auswahl"),
    gruppen: [...new Set(e.gruppen)].filter((g) => gruppenIds.has(g)),
    anmeldung: e.anmeldung === "eintrittskarte" || e.anmeldung === "voranmeldung" ? e.anmeldung : null,
    karten_bestellt: typeof karten === "number" && Number.isInteger(karten) && karten >= 0 ? karten : null,
    hinweis: leer(e.hinweis),
    bemerkung: leer(e.bemerkung),
    quelle: alt?.quelle ?? [],
    pruefen: leer(e.pruefen),
  };
}

export async function terminSpeichern(e: TerminEingabe) {
  return sicher(async (a) => speichereTermin(await zuTermin(e), wer(a)));
}

/** Verschieben/Größe ändern im Kalender: nur Datum und Zeiten. */
export async function terminZeitAendern(
  id: string,
  z: { datum: string; treffzeit: string | null; beginn: string | null; ende: string | null },
) {
  return sicher(async (a) => {
    const t = (await ladeDaten()).termine.find((x) => x.id === id);
    if (!t) throw new BenutzerFehler("Termin nicht gefunden.");
    const neu = await zuTermin({ ...t, ...z });
    return speichereTermin({ ...neu, id: t.id }, wer(a), "termin.verschoben");
  });
}

export async function terminStatusSetzen(id: string, status: Status) {
  return sicher(async (a) => {
    const t = (await ladeDaten()).termine.find((x) => x.id === id);
    if (!t) throw new BenutzerFehler("Termin nicht gefunden.");
    return speichereTermin({ ...t, status }, wer(a));
  });
}

export async function terminDuplizieren(id: string, datum?: string) {
  return sicher(async (a) => {
    const t = (await ladeDaten()).termine.find((x) => x.id === id);
    if (!t) throw new BenutzerFehler("Termin nicht gefunden.");
    const kopie = await zuTermin({ ...t, id: undefined, datum: datum ?? t.datum, anschluss_an: null });
    return speichereTermin({ ...kopie, quelle: [] }, wer(a), "termin.dupliziert");
  });
}

export async function terminLoeschen(id: string) {
  return sicher(async (a) => {
    const t = await loescheTermin(id, wer(a));
    if (!t) throw new BenutzerFehler("Termin nicht gefunden.");
    return t;
  });
}

/** Rückgängig nach dem Löschen: Termin unverändert wieder anlegen. */
export async function terminWiederherstellen(t: Termin) {
  return sicher(async (a) => speichereTermin(t, wer(a), "termin.wiederhergestellt"));
}

// ───────────── Gruppen ─────────────

const RESERVIERT = new Set(["alle", "karten", "intern", "extern"]);

export async function gruppeSpeichern(g: Omit<Gruppe, "id"> & { id?: string }) {
  return sicher(async (a) => {
    const daten = await ladeDaten();
    const name = g.name.trim();
    if (!name) throw new BenutzerFehler("Bitte einen Namen angeben.");
    let id = g.id && daten.gruppen.some((x) => x.id === g.id) ? g.id : null;
    if (!id) {
      const basis = slug(name) || "gruppe";
      id = RESERVIERT.has(basis) ? `${basis}-gruppe` : basis;
      for (let n = 2; daten.gruppen.some((x) => x.id === id); n++) id = `${basis}-${n}`;
    }
    const personen = g.personen;
    const gruppe: Gruppe = {
      id,
      kuerzel: g.kuerzel.trim() || name.slice(0, 3),
      name,
      beschreibung: g.beschreibung?.trim() || null,
      personen: typeof personen === "number" && Number.isInteger(personen) && personen >= 0 ? personen : null,
      farbe: (FARBLISTE as string[]).includes(g.farbe) ? (g.farbe as Farbe) : "grau",
      in_alle: !!g.in_alle,
      sortierung: Number.isInteger(g.sortierung) ? g.sortierung : Math.max(0, ...daten.gruppen.map((x) => x.sortierung)) + 10,
    };
    await speichereGruppe(gruppe, wer(a));
    return gruppe;
  });
}

export async function gruppeLoeschen(id: string) {
  return sicher(async (a) => loescheGruppe(id, wer(a)));
}

// ───────────── Benutzer ─────────────

async function linkFuer(token: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${host ? `${proto}://${host}` : basisUrl()}/einladung/${token}`;
}

export async function benutzerEinladen(email: string, name: string) {
  return sicher(async (a) => linkFuer(await einladungErstellen({ email, name }, wer(a))));
}

export async function passwortLink(benutzerId: string) {
  return sicher(async (a) => linkFuer(await passwortLinkErstellen(benutzerId, { ...wer(a), role: a.role })));
}

export async function einladungLoeschen(token: string) {
  return sicher(async (a) => einladungZurueckziehen(token, wer(a)));
}

export async function benutzerAktivSetzen(id: string, aktiv: boolean) {
  return sicher(async (a) => setzeAktiv(id, aktiv, wer(a)));
}

export async function benutzerLoeschen(id: string) {
  return sicher(async (a) => loescheBenutzer(id, wer(a)));
}

export async function eigenenNamenAendern(name: string) {
  return sicher(async (a) => aendereName(a.id, name));
}

export async function abmelden() {
  try {
    await auth().api.signOut({ headers: await headers() });
  } catch {
    // schon abgemeldet
  }
  redirect("/anmelden");
}

/** Für die Befehlspalette: kompakte Terminliste. */
export async function paletteTermine() {
  return sicher(async () =>
    (await ladeDaten()).termine.map((t) => ({
      id: t.id,
      titel: t.tagesprogramm ? `${t.tagesprogramm}: ${t.titel}` : t.titel,
      datum: t.datum,
      ort: t.treffpunkt ?? t.ort,
    })),
  );
}

// ───────────── Eigenes Konto ─────────────

export async function sitzungBeenden(sitzungId: string) {
  return sicher(async (a) => {
    const { db, schema } = await import("@/db");
    const { and, eq } = await import("drizzle-orm");
    await db().delete(schema.session).where(and(eq(schema.session.id, sitzungId), eq(schema.session.userId, a.id)));
  });
}

export async function andereSitzungenBeenden() {
  return sicher(async (a) => {
    const { db, schema } = await import("@/db");
    const { and, eq, ne } = await import("drizzle-orm");
    await db().delete(schema.session).where(and(eq(schema.session.userId, a.id), ne(schema.session.id, a.sessionId)));
  });
}

export async function passkeyLoeschen(id: string) {
  return sicher(async (a) => {
    const { db, schema } = await import("@/db");
    const { and, eq } = await import("drizzle-orm");
    await db().delete(schema.passkey).where(and(eq(schema.passkey.id, id), eq(schema.passkey.userId, a.id)));
  });
}
