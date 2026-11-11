import "server-only";
import { eq, inArray, lt, sql } from "drizzle-orm";
import webpush from "web-push";
import { db, hatDatenbank, schema } from "@/db";
import { basisUrl } from "./auth";
import { APP_DOMAIN } from "./marke";
import { ladeMarke } from "./marke-laden";
import { ladeDaten } from "./daten";
import type { Termin } from "./types";
import { ladePin, pinSchluessel } from "./vertraulich";
import { berlinZeitpunkt, datumKurz, startzeit } from "./zeit";

// Push-Mitteilungen (Web Push): iPhone/iPad nur als installierte App (ab iOS 16.4), Android/PC auch im Browser.
// Die Schlüssel (VAPID) erzeugt die App beim ersten Gebrauch selbst und legt sie in `einstellungen` ab – oder sie
// kommen aus VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY. Bei neuen Schlüsseln müssen alle Geräte neu einschalten.

interface Schluessel {
  oeffentlich: string;
  privat: string;
}
let zwischen: Schluessel | null = null;

async function schluessel(): Promise<Schluessel | null> {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
    return { oeffentlich: process.env.VAPID_PUBLIC_KEY, privat: process.env.VAPID_PRIVATE_KEY };
  if (zwischen) return zwischen;
  if (!hatDatenbank()) return null;
  const t = schema.einstellungen;
  const [z] = await db().select({ o: t.vapid_oeffentlich, p: t.vapid_privat }).from(t).where(eq(t.id, "app"));
  if (z?.o && z.p) return (zwischen = { oeffentlich: z.o, privat: z.p });
  const neu = webpush.generateVAPIDKeys();
  const marke = await ladeMarke();
  // Nur setzen, wenn noch keine da sind (zwei gleichzeitige erste Aufrufe dürfen sich nicht überschreiben)
  await db()
    .insert(t)
    .values({ id: "app", app_name: marke.name, untertitel: marke.untertitel, vapid_oeffentlich: neu.publicKey, vapid_privat: neu.privateKey })
    .onConflictDoUpdate({
      target: t.id,
      set: {
        vapid_oeffentlich: sql`coalesce(${t.vapid_oeffentlich}, ${neu.publicKey})`,
        vapid_privat: sql`coalesce(${t.vapid_privat}, ${neu.privateKey})`,
      },
    });
  const [d] = await db().select({ o: t.vapid_oeffentlich, p: t.vapid_privat }).from(t).where(eq(t.id, "app"));
  return d?.o && d.p ? (zwischen = { oeffentlich: d.o, privat: d.p }) : null;
}

export async function oeffentlicherSchluessel(): Promise<string | null> {
  return (await schluessel())?.oeffentlich ?? null;
}

export interface Abo {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export function istAbo(x: unknown): x is Abo {
  const a = x as Abo;
  return (
    !!a &&
    typeof a.endpoint === "string" &&
    /^https:\/\//.test(a.endpoint) &&
    a.endpoint.length < 1000 &&
    typeof a.keys?.p256dh === "string" &&
    typeof a.keys?.auth === "string" &&
    a.keys.p256dh.length < 200 &&
    a.keys.auth.length < 100
  );
}

export async function abonnieren(a: Abo, pinWert: string | null) {
  const t = schema.pushAbos;
  await db()
    .insert(t)
    .values({ endpoint: a.endpoint, p256dh: a.keys.p256dh, auth: a.keys.auth, pin_schluessel: pinWert })
    .onConflictDoUpdate({ target: t.endpoint, set: { p256dh: a.keys.p256dh, auth: a.keys.auth, pin_schluessel: pinWert } });
}

export async function abbestellen(endpoint: string) {
  await db().delete(schema.pushAbos).where(eq(schema.pushAbos.endpoint, endpoint));
}

export async function anzahlGeraete(): Promise<number> {
  if (!hatDatenbank()) return 0;
  const [z] = await db().select({ n: sql<number>`count(*)::int` }).from(schema.pushAbos);
  return z?.n ?? 0;
}

export interface Mitteilung {
  titel: string;
  text: string;
  /** Seite, die beim Antippen öffnet */
  url: string;
  /** Gleiche Kennung ersetzt eine ältere Mitteilung (z. B. derselbe Termin) */
  kennung?: string;
}

/**
 * An alle Geräte schicken; bei vertraulichen Terminen nur an Geräte, die beim Einschalten mit der aktuellen PIN
 * freigeschaltet waren. Abgelaufene Geräte (404/410) werden entfernt. Gibt die Zahl der erreichten Geräte zurück.
 */
export async function mitteilen(m: Mitteilung, opts: { vertraulich?: boolean; nurEndpoint?: string } = {}): Promise<number> {
  return (await mitteilenMitBericht(m, opts)).erreicht;
}

/** Wie `mitteilen`, mit den Gründen fehlgeschlagener Zustellungen (Dienst + Antwort, keine Geräteadresse) */
export async function mitteilenMitBericht(
  m: Mitteilung,
  opts: { vertraulich?: boolean; nurEndpoint?: string } = {},
): Promise<{ erreicht: number; geraete: number; fehler: string[] }> {
  let abos = await db().select().from(schema.pushAbos);
  // Probe geht immer an das eine Gerät; sonst nur an Geräte, die Änderungs-Mitteilungen wollen
  abos = opts.nurEndpoint ? abos.filter((a) => a.endpoint === opts.nurEndpoint) : abos.filter((a) => a.aenderungen);
  if (opts.vertraulich) abos = await nurFreigeschaltete(abos);
  return senden(abos, () => m);
}

type AboZeile = typeof schema.pushAbos.$inferSelect;

async function nurFreigeschaltete(abos: AboZeile[]): Promise<AboZeile[]> {
  const pin = await ladePin();
  const soll = pin ? pinSchluessel(pin) : null;
  return soll ? abos.filter((a) => a.pin_schluessel === soll) : [];
}

/** Verschickt je Gerät die Mitteilung aus `fuer(abo)`; entfernt abgelaufene Geräte (404/410) */
async function senden(abos: AboZeile[], fuer: (a: AboZeile) => Mitteilung): Promise<{ erreicht: number; geraete: number; fehler: string[]; ok: string[] }> {
  const k = await schluessel();
  if (!k) return { erreicht: 0, geraete: abos.length, fehler: ["Keine Push-Schlüssel (Datenbank?)"], ok: [] };
  if (!abos.length) return { erreicht: 0, geraete: 0, fehler: [], ok: [] };
  const optionen = {
    // Absender muss https: oder mailto: sein (lokal läuft die App über http)
    vapidDetails: { subject: basisUrl().startsWith("https://") ? basisUrl() : `mailto:push@${APP_DOMAIN}`, publicKey: k.oeffentlich, privateKey: k.privat },
    TTL: 24 * 60 * 60,
    urgency: "high" as const,
    // Kein „Topic“-Kopf: Apple lehnte Mitteilungen damit mit 400 ab. Ältere Mitteilungen zum selben Termin
    // ersetzt das Handy trotzdem – über `tag` im Service Worker.
  };

  const weg: string[] = [];
  const ok: string[] = [];
  const fehler: string[] = [];
  // In kleinen Paketen, damit viele Geräte den Server nicht überfahren
  for (let i = 0; i < abos.length; i += 25) {
    await Promise.all(
      abos.slice(i, i + 25).map(async (a) => {
        const m = fuer(a);
        const nutzlast = JSON.stringify({ ...m, url: new URL(m.url, basisUrl()).toString() });
        try {
          await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, nutzlast, optionen);
          ok.push(a.endpoint);
        } catch (e) {
          const f = e as { statusCode?: number; body?: string; message?: string };
          const grund = `${new URL(a.endpoint).host}: ${f.statusCode ?? ""} ${(f.body || f.message || "").toString().slice(0, 160)}`.trim();
          fehler.push(grund);
          if (f.statusCode === 404 || f.statusCode === 410) weg.push(a.endpoint);
          // Nur Dienst und Antwort ins Protokoll – keine Geräteadresse
          console.warn(`Push nicht zugestellt – ${grund}`);
        }
      }),
    );
  }
  if (weg.length) await db().delete(schema.pushAbos).where(inArray(schema.pushAbos.endpoint, weg));
  if (ok.length)
    await db().update(schema.pushAbos).set({ zuletzt_zugestellt: new Date() }).where(inArray(schema.pushAbos.endpoint, ok));
  return { erreicht: ok.length, geraete: abos.length, fehler, ok };
}

// ───────────── Einstellungen je Gerät ─────────────

export const ERINNERUNG_MINUTEN = [30, 60, 120] as const;

export interface GeraetEinstellungen {
  aenderungen: boolean;
  erinnerung: number | null;
}

export async function einstellungenLesen(endpoint: string): Promise<GeraetEinstellungen | null> {
  const [z] = await db()
    .select({ aenderungen: schema.pushAbos.aenderungen, erinnerung: schema.pushAbos.erinnerung_minuten })
    .from(schema.pushAbos)
    .where(eq(schema.pushAbos.endpoint, endpoint));
  return z ?? null;
}

export async function einstellungenSetzen(endpoint: string, e: GeraetEinstellungen): Promise<boolean> {
  const erinnerung = (ERINNERUNG_MINUTEN as readonly number[]).includes(e.erinnerung ?? -1) ? e.erinnerung : null;
  const r = await db()
    .update(schema.pushAbos)
    .set({ aenderungen: e.aenderungen === true, erinnerung_minuten: erinnerung })
    .where(eq(schema.pushAbos.endpoint, endpoint))
    .returning({ endpoint: schema.pushAbos.endpoint });
  return r.length > 0;
}

// ───────────── Erinnerungen vor Terminen ─────────────

const vorlaufText = (min: number) => (min >= 60 ? `In ${min / 60} ${min === 60 ? "Stunde" : "Stunden"}` : `In ${min} Minuten`);

/**
 * Läuft alle 5 Minuten (Vercel-Cron): Für jedes Gerät mit Erinnerung und jeden Termin, dessen Start (Treffzeit,
 * sonst Beginn) in den nächsten `vorlauf` Minuten liegt, genau einmal eine Mitteilung. Verpasste Erinnerungen
 * (Ausfall länger als der Vorlauf) werden nicht nachgeholt. Vertrauliche nur an Freigeschaltete.
 */
export async function erinnerungenVerschicken(jetzt = new Date()): Promise<{ geprueft: number; gesendet: number }> {
  if (!hatDatenbank()) return { geprueft: 0, gesendet: 0 };
  const alleAbos = (await db().select().from(schema.pushAbos)).filter((a) => a.erinnerung_minuten);
  if (!alleAbos.length) return { geprueft: 0, gesendet: 0 };
  const freigeschaltet = new Set((await nurFreigeschaltete(alleAbos)).map((a) => a.endpoint));

  const { termine } = await ladeDaten();
  const kommend = termine
    .map((t) => {
      const z = startzeit(t);
      return z ? { t, start: berlinZeitpunkt(t.datum, z) } : null;
    })
    .filter((x): x is { t: Termin; start: Date } => !!x && x.start > jetzt && x.start.getTime() - jetzt.getTime() <= 121 * 60_000);
  if (!kommend.length) return { geprueft: 0, gesendet: 0 };

  const schon = await db()
    .select()
    .from(schema.pushErinnerungen)
    .where(inArray(schema.pushErinnerungen.termin_id, kommend.map((k) => k.t.id)));
  const gesendetSchon = new Set(schon.map((s) => `${s.endpoint}|${s.termin_id}|${s.start.toISOString()}`));

  // Je Gerät höchstens eine Erinnerung pro Lauf und Termin
  const faellig: { abo: AboZeile; t: Termin; start: Date }[] = [];
  for (const { t, start } of kommend) {
    for (const abo of alleAbos) {
      if (t.vertraulich && !freigeschaltet.has(abo.endpoint)) continue;
      if (start.getTime() - jetzt.getTime() > abo.erinnerung_minuten! * 60_000) continue;
      if (gesendetSchon.has(`${abo.endpoint}|${t.id}|${start.toISOString()}`)) continue;
      faellig.push({ abo, t, start });
    }
  }
  let gesendet = 0;
  for (const f of faellig) {
    // Erst merken, dann senden: zwei gleichzeitige Läufe schicken nichts doppelt
    const neu = await db()
      .insert(schema.pushErinnerungen)
      .values({ endpoint: f.abo.endpoint, termin_id: f.t.id, start: f.start })
      .onConflictDoNothing()
      .returning({ e: schema.pushErinnerungen.endpoint });
    if (!neu.length) continue;
    const minutenBis = Math.max(1, Math.round((f.start.getTime() - jetzt.getTime()) / 60_000));
    const r = await senden([f.abo], () => ({
      titel: `${vorlaufText(minutenBis >= 55 ? Math.round(minutenBis / 30) * 30 : Math.max(5, Math.round(minutenBis / 5) * 5))}: ${f.t.titel}`,
      text: eckdaten(f.t),
      url: `/termin/${encodeURIComponent(f.t.id)}`,
      kennung: `erinnerung-${f.t.id}`,
    }));
    gesendet += r.erreicht;
  }
  // Aufräumen: Erinnerungen älter als eine Woche braucht niemand mehr
  await db().delete(schema.pushErinnerungen).where(lt(schema.pushErinnerungen.start, new Date(jetzt.getTime() - 7 * 86_400_000)));
  return { geprueft: kommend.length, gesendet };
}

// ───────────── Texte ─────────────

const zeit = (t: Termin) => startzeit(t);
const wo = (t: Termin) => (t.treffzeit ? (t.treffpunkt ?? t.ort) : (t.ort ?? t.treffpunkt));

function eckdaten(t: Termin): string {
  return [datumKurz(t.datum), zeit(t) ? `${zeit(t)} Uhr` : null, wo(t)].filter(Boolean).join(" · ");
}

function statt(neu: string | null, alt: string | null, leer = "–") {
  return `${neu ?? leer} (statt ${alt ?? leer})`;
}

/** Mitteilung zu einem neuen oder geänderten Termin – nennt, was sich für die Leute ändert */
export function terminMitteilung(vorher: Termin | undefined, t: Termin): Mitteilung {
  const url = `/termin/${encodeURIComponent(t.id)}`;
  if (!vorher) return { titel: `Neuer Termin: ${t.titel}`, text: eckdaten(t), url, kennung: t.id };
  const z: string[] = [];
  if (vorher.datum !== t.datum) z.push(`Datum: ${statt(datumKurz(t.datum), datumKurz(vorher.datum))}`);
  if (vorher.treffzeit !== t.treffzeit) z.push(`Treffen: ${statt(t.treffzeit, vorher.treffzeit)}`);
  if (vorher.treffpunkt !== t.treffpunkt) z.push(`Treffpunkt: ${statt(t.treffpunkt, vorher.treffpunkt)}`);
  if (vorher.beginn !== t.beginn) z.push(`Beginn: ${statt(t.beginn, vorher.beginn)}`);
  if (vorher.ort !== t.ort) z.push(`Ort: ${statt(t.ort, vorher.ort)}`);
  if (vorher.ende !== t.ende && t.ende) z.push(`Ende: ${t.ende}`);
  if (vorher.status !== t.status) z.push(t.status === "vorbehalt" ? "Jetzt unter Vorbehalt" : "Jetzt fest zugesagt");
  if (vorher.hinweis !== t.hinweis && t.hinweis) z.push(`Hinweis: ${t.hinweis}`);
  if (vorher.titel !== t.titel) z.push(`vorher „${vorher.titel}“`);
  return {
    titel: `Geändert: ${t.titel}`,
    text: z.length ? z.join("\n") : `${eckdaten(t)} – Details in der App`,
    url,
    kennung: t.id,
  };
}

export function absageMitteilung(t: Termin): Mitteilung {
  return { titel: `Abgesagt: ${t.titel}`, text: `${eckdaten(t)} – der Termin fällt aus.`, url: "/", kennung: t.id };
}
