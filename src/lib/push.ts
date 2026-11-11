import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import webpush from "web-push";
import { db, hatDatenbank, schema } from "@/db";
import { basisUrl } from "./auth";
import { APP_DOMAIN } from "./marke";
import { ladeMarke } from "./marke-laden";
import type { Termin } from "./types";
import { ladePin, pinSchluessel } from "./vertraulich";
import { datumKurz, startzeit } from "./zeit";

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
  const k = await schluessel();
  if (!k) return 0;
  let abos = await db().select().from(schema.pushAbos);
  if (opts.nurEndpoint) abos = abos.filter((a) => a.endpoint === opts.nurEndpoint);
  if (opts.vertraulich) {
    const pin = await ladePin();
    const soll = pin ? pinSchluessel(pin) : null;
    abos = soll ? abos.filter((a) => a.pin_schluessel === soll) : [];
  }
  if (!abos.length) return 0;

  const nutzlast = JSON.stringify({ ...m, url: new URL(m.url, basisUrl()).toString() });
  const optionen = {
    // Absender muss https: oder mailto: sein (lokal läuft die App über http)
    vapidDetails: { subject: basisUrl().startsWith("https://") ? basisUrl() : `mailto:push@${APP_DOMAIN}`, publicKey: k.oeffentlich, privateKey: k.privat },
    TTL: 24 * 60 * 60,
    urgency: "high" as const,
    topic: m.kennung?.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) || undefined,
  };

  const weg: string[] = [];
  const ok: string[] = [];
  // In kleinen Paketen, damit viele Geräte den Server nicht überfahren
  for (let i = 0; i < abos.length; i += 25) {
    await Promise.all(
      abos.slice(i, i + 25).map(async (a) => {
        try {
          await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, nutzlast, optionen);
          ok.push(a.endpoint);
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) weg.push(a.endpoint);
          // Nur Dienst und Code ins Protokoll – keine Geräteadresse
          else console.warn(`Push nicht zugestellt (${new URL(a.endpoint).host}): ${code ?? (e as Error).message}`);
        }
      }),
    );
  }
  if (weg.length) await db().delete(schema.pushAbos).where(inArray(schema.pushAbos.endpoint, weg));
  if (ok.length)
    await db().update(schema.pushAbos).set({ zuletzt_zugestellt: new Date() }).where(inArray(schema.pushAbos.endpoint, ok));
  return ok.length;
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
