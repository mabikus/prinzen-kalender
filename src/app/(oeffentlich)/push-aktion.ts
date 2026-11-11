"use server";

import { cookies, headers } from "next/headers";
import { hatDatenbank } from "@/db";
import { versuchErlaubt } from "@/lib/limit";
import { abbestellen, abonnieren, istAbo, mitteilenMitBericht, oeffentlicherSchluessel } from "@/lib/push";
import { istFreigeschaltet, PIN_COOKIE } from "@/lib/vertraulich";

/** Öffentlicher Push-Schlüssel (null = Push nicht möglich, z. B. ohne Datenbank) */
export async function pushSchluessel(): Promise<string | null> {
  return hatDatenbank() ? oeffentlicherSchluessel() : null;
}

/** Gerät anmelden bzw. auffrischen (auch nach PIN-Eingabe: dann kommen vertrauliche Mitteilungen mit) */
export async function pushAnmelden(abo: unknown): Promise<boolean> {
  if (!hatDatenbank() || !istAbo(abo)) return false;
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unbekannt";
  if (!(await versuchErlaubt(`push:${ip}`, 30, 60 * 60_000))) return false;
  const pinWert = (await istFreigeschaltet()) ? ((await cookies()).get(PIN_COOKIE)?.value ?? null) : null;
  await abonnieren(abo, pinWert);
  return true;
}

export async function pushAbmelden(endpoint: string): Promise<void> {
  if (hatDatenbank() && typeof endpoint === "string") await abbestellen(endpoint);
}

/** Probe-Mitteilung nur an dieses Gerät – mit Grund, falls sie nicht durchkommt */
export async function pushProbe(endpoint: string): Promise<{ ok: boolean; grund?: string }> {
  if (!hatDatenbank() || typeof endpoint !== "string") return { ok: false, grund: "Keine Datenbank verbunden." };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unbekannt";
  // Großzügig: die Probe geht nur an das eigene Gerät. Neuer Schlüssel-Name setzt die alten Zähler zurück.
  if (!(await versuchErlaubt(`push-probe2:${ip}`, 40, 10 * 60_000)))
    return { ok: false, grund: "Zu viele Proben – bitte in zehn Minuten noch einmal." };
  const b = await mitteilenMitBericht(
    { titel: "Mitteilungen sind an", text: "So sieht es aus, wenn sich ein Termin ändert.", url: "/einstellungen", kennung: "probe" },
    { nurEndpoint: endpoint },
  );
  if (b.erreicht > 0) return { ok: true };
  if (b.geraete === 0) return { ok: false, grund: "Dieses Gerät ist beim Server nicht angemeldet – bitte aus- und wieder einschalten." };
  return { ok: false, grund: b.fehler[0] ?? "Unbekannter Fehler" };
}
