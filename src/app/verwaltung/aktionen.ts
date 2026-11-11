"use server";

import { absageMitteilung, mitteilen as pushSenden, terminMitteilung } from "@/lib/push";
import { ladeMarke } from "@/lib/marke-laden";
import { PIN_TAG } from "@/lib/vertraulich";
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
import { ladeDaten, ladeProtokoll, loescheGruppe, loescheTermin, speichereGruppe, speichereTermin, type Wer } from "@/lib/daten";
import { FARBLISTE } from "@/lib/labels";
import { slug } from "@/lib/slug";
import type { Anmeldung, Art, Farbe, Gruppe, Status, Termin, Umfang } from "@/lib/types";
import { aktuellerAdmin, type Admin } from "@/lib/sitzung";
import { basisUrl } from "@/lib/auth";
import { headers } from "next/headers";
import { updateTag } from "next/cache";
import { sql } from "drizzle-orm";
import { db, hatDatenbank, schema } from "@/db";
import { protokolliereAktion } from "@/lib/daten";
import { MARKE_TAG } from "@/lib/marke-laden";

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
  strasse: string | null;
  plz: string | null;
  stadt: string | null;
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
  personen: Record<string, number>;
  vertraulich: boolean;
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

function postleitzahl(v: unknown): string | null {
  const s = leer(v);
  if (s !== null && !/^\d{4,5}$/.test(s)) throw new BenutzerFehler(`Ungültige Postleitzahl: ${s}`);
  return s;
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
  const umfang = wahl<Umfang>(e.umfang, ["auswahl", "alle"], "auswahl");
  const gruppen = [...new Set(e.gruppen)].filter((g) => gruppenIds.has(g));
  // Abweichende Personenzahl nur für Gruppen, die dabei sind, und nur, wenn sie von der Gruppenzahl abweicht –
  // sonst gilt eine spätere Änderung der Gruppe auch für diesen Termin.
  const personen: Record<string, number> = {};
  for (const g of daten.gruppen) {
    const n = e.personen?.[g.id];
    const dabei = gruppen.includes(g.id) || (umfang === "alle" && g.in_alle);
    if (dabei && typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 999 && n !== g.personen) personen[g.id] = n;
  }
  return {
    id,
    datum,
    treffzeit: uhrzeit(e.treffzeit, "Treffzeit"),
    treffpunkt: leer(e.treffpunkt),
    beginn: uhrzeit(e.beginn, "Beginn"),
    ort: leer(e.ort),
    strasse: leer(e.strasse),
    plz: postleitzahl(e.plz),
    stadt: leer(e.stadt),
    ende: uhrzeit(e.ende, "Ende"),
    anschluss_an:
      e.anschluss_an && e.anschluss_an !== id && daten.termine.some((t) => t.id === e.anschluss_an) ? e.anschluss_an : null,
    titel,
    tagesprogramm: leer(e.tagesprogramm),
    veranstalter: leer(e.veranstalter),
    art: wahl<Art>(e.art, ["intern", "extern"], "extern"),
    status: wahl<Status>(e.status, ["bestaetigt", "vorbehalt"], "bestaetigt"),
    umfang,
    gruppen,
    anmeldung: e.anmeldung === "eintrittskarte" ? e.anmeldung : null,
    karten_bestellt: typeof karten === "number" && Number.isInteger(karten) && karten >= 0 ? karten : null,
    personen,
    vertraulich: e.vertraulich === true,
    hinweis: leer(e.hinweis),
    bemerkung: leer(e.bemerkung),
    quelle: alt?.quelle ?? [],
    pruefen: leer(e.pruefen),
  };
}

/** Speichern; mit `mitteilen` geht eine Push-Mitteilung an alle Geräte (vertrauliche nur an Freigeschaltete). */
export async function terminSpeichern(e: TerminEingabe, mitteilen = false): Promise<Ergebnis<Termin & { mitgeteilt?: number }>> {
  return sicher(async (a) => {
    const t = await zuTermin(e);
    const vorher = e.id ? (await ladeDaten()).termine.find((x) => x.id === t.id) : undefined;
    const gespeichert = await speichereTermin(t, wer(a));
    if (!mitteilen) return gespeichert;
    const mitgeteilt = await pushSenden(terminMitteilung(vorher, gespeichert), { vertraulich: gespeichert.vertraulich });
    return { ...gespeichert, mitgeteilt };
  });
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

/** Löschen; mit `absageMitteilen` geht „Abgesagt: …“ an alle Geräte (vertrauliche nur an Freigeschaltete). */
export async function terminLoeschen(id: string, absageMitteilen = false) {
  return sicher(async (a) => {
    const t = await loescheTermin(id, wer(a));
    if (!t) throw new BenutzerFehler("Termin nicht gefunden.");
    if (absageMitteilen) await pushSenden(absageMitteilung(t), { vertraulich: t.vertraulich });
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

// ───────────── Darstellung (Name, Unterzeile, Logo) ─────────────

const PNG_KENNUNG = [0x89, 0x50, 0x4e, 0x47];

/** Logo-Datei aus dem Formular: PNG (vom Browser vorbereitet), höchstens 2 MB */
async function pngAus(form: FormData, feld: string): Promise<Buffer | null> {
  const datei = form.get(feld);
  if (!(datei instanceof File) || datei.size === 0) return null;
  if (datei.size > 2 * 1024 * 1024) throw new BenutzerFehler("Das Logo ist zu groß (höchstens 2 MB).");
  const bytes = Buffer.from(await datei.arrayBuffer());
  if (!PNG_KENNUNG.every((b, i) => bytes[i] === b)) throw new BenutzerFehler("Das Logo konnte nicht gelesen werden.");
  return bytes;
}

/**
 * App-Name, Unterzeile und Logo speichern. Das Logo bereitet der Browser vor (512 px und 144 px, PNG auf Weiß).
 * Danach sind Kopfzeilen, Symbole, Startbilder und Seitentitel sofort neu (updateTag).
 */
export async function darstellungSpeichern(form: FormData) {
  return sicher(async (a) => {
    if (!hatDatenbank()) throw new BenutzerFehler("Ändern ist erst möglich, wenn die Datenbank verbunden ist.");
    const name = leer(form.get("name"));
    const untertitel = leer(form.get("untertitel")) ?? "";
    if (!name) throw new BenutzerFehler("Bitte einen App-Namen angeben.");
    if (name.length > 40) throw new BenutzerFehler("Der App-Name darf höchstens 40 Zeichen lang sein.");
    if (untertitel.length > 60) throw new BenutzerFehler("Die Unterzeile darf höchstens 60 Zeichen lang sein.");

    const zuruecksetzen = form.get("logoZuruecksetzen") === "1";
    const logo = zuruecksetzen ? null : await pngAus(form, "logo");
    const logoKlein = zuruecksetzen ? null : await pngAus(form, "logoKlein");
    if (!!logo !== !!logoKlein) throw new BenutzerFehler("Das Logo ist unvollständig angekommen. Bitte noch einmal wählen.");
    const logoNeu = zuruecksetzen || !!logo;

    const t = schema.einstellungen;
    await db()
      .insert(t)
      .values({ id: "app", app_name: name, untertitel, logo, logo_klein: logoKlein, logo_stand: logoNeu ? 1 : 0 })
      .onConflictDoUpdate({
        target: t.id,
        set: {
          app_name: name,
          untertitel,
          ...(logoNeu ? { logo, logo_klein: logoKlein, logo_stand: sql`${t.logo_stand} + 1` } : {}),
        },
      });
    await protokolliereAktion(wer(a), "darstellung.geaendert", { id: "app", titel: name }, {
      name,
      untertitel,
      logo: zuruecksetzen ? "zurückgesetzt" : logo ? "neu" : "unverändert",
    });
    updateTag(MARKE_TAG);
  });
}

// ───────────── Vertrauliche Termine (PIN) ─────────────

/** PIN für vertrauliche Termine setzen, ändern (alle Freischaltungen und vertraulichen Abos enden) oder entfernen (null) */
export async function pinSpeichern(eingabe: string | null) {
  return sicher(async (a) => {
    if (!hatDatenbank()) throw new BenutzerFehler("Ändern ist erst möglich, wenn die Datenbank verbunden ist.");
    const pin = eingabe === null ? null : eingabe.trim();
    if (pin !== null && !/^\d{4,8}$/.test(pin)) throw new BenutzerFehler("Die PIN muss aus 4 bis 8 Ziffern bestehen.");
    const marke = await ladeMarke();
    const t = schema.einstellungen;
    await db()
      .insert(t)
      .values({ id: "app", app_name: marke.name, untertitel: marke.untertitel, pin })
      .onConflictDoUpdate({ target: t.id, set: { pin } });
    // Die PIN selbst nicht ins Protokoll
    await protokolliereAktion(wer(a), pin ? "pin.geaendert" : "pin.entfernt", { id: "app", titel: "Vertrauliche Termine" });
    updateTag(PIN_TAG);
  });
}

/** Verlauf eines Termins für den Drawer (die letzten Änderungen) */
export async function terminVerlauf(id: string) {
  return sicher(async () => ladeProtokoll({ objektId: id, limit: 20 }));
}
