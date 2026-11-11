import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import { db, hatDatenbank, schema } from "@/db";
import { anmeldeGeheimnis } from "./auth";
import { ladeDatenZwischengespeichert } from "./daten";
import type { Daten } from "./types";

// Vertrauliche Termine (z. B. Vorstandstermine): sichtbar nur, wer einmal die PIN eingegeben hat – ohne Benutzerkonto.
// Der Browser bekommt dafür kein PIN, sondern einen daraus abgeleiteten Schlüssel als Cookie. Ändert die Verwaltung
// die PIN, passt der Schlüssel nicht mehr: alle sind wieder draußen, auch die vertraulichen Abos.

export const PIN_COOKIE = "pk_pin";
export const PIN_TAG = "pin";

/** PIN aus der Verwaltung (null = keine gesetzt). Zwischengespeichert, nach dem Speichern updateTag("pin"). */
export async function ladePin(): Promise<string | null> {
  "use cache";
  cacheTag(PIN_TAG);
  cacheLife("hours");
  if (!hatDatenbank()) return null;
  try {
    const [z] = await db()
      .select({ pin: schema.einstellungen.pin })
      .from(schema.einstellungen)
      .where(eq(schema.einstellungen.id, "app"));
    return z?.pin ?? null;
  } catch {
    return null;
  }
}

function ableiten(zweck: string, pin: string): string {
  const geheim = anmeldeGeheimnis() ?? "sessionskalender";
  return createHmac("sha256", geheim).update(`${zweck}:${pin}`).digest("base64url");
}

/** Wert des Cookies nach richtiger PIN */
export function pinSchluessel(pin: string): string {
  return ableiten("ansicht", pin);
}

/** Geheimer Teil der Abo-Adressen mit vertraulichen Terminen */
export function vertraulichesAboToken(pin: string): string {
  return `v${ableiten("abo", pin).slice(0, 31)}`;
}

function gleich(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function pinRichtig(eingabe: string, pin: string): boolean {
  return gleich(eingabe.trim(), pin);
}

/** Ohne Zwischenspeicher – für Routen und Aktionen */
export async function istFreigeschaltet(): Promise<boolean> {
  const pin = await ladePin();
  if (!pin) return false;
  const wert = (await cookies()).get(PIN_COOKIE)?.value;
  return !!wert && gleich(wert, pinSchluessel(pin));
}

/**
 * Für die Seiten der Ansicht: je Browser zwischengespeichert („use cache: private“), damit Tabs weiter vorgeladen
 * werden. Nach dem Freischalten/Sperren erneuert die Aktion die Seite (Cookie gesetzt → Router-Cache neu).
 */
export async function freigeschaltet(): Promise<boolean> {
  "use cache: private";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  return istFreigeschaltet();
}

/** Daten für die Ansicht: vertrauliche Termine nur nach Freischaltung */
export async function ladeAnsicht(): Promise<Daten & { frei: boolean }> {
  const [daten, frei] = await Promise.all([ladeDatenZwischengespeichert(), freigeschaltet()]);
  return frei ? { ...daten, frei } : { ...daten, termine: daten.termine.filter((t) => !t.vertraulich), frei };
}

/** Abo-Token für Freigeschaltete (sonst null) */
export async function aboTokenFuerAnsicht(): Promise<string | null> {
  if (!(await freigeschaltet())) return null;
  const pin = await ladePin();
  return pin ? vertraulichesAboToken(pin) : null;
}
