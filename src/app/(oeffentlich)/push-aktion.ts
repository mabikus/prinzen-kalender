"use server";

import { cookies, headers } from "next/headers";
import { hatDatenbank } from "@/db";
import { versuchErlaubt } from "@/lib/limit";
import { abbestellen, abonnieren, istAbo, mitteilen, oeffentlicherSchluessel } from "@/lib/push";
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

/** Probe-Mitteilung nur an dieses Gerät */
export async function pushProbe(endpoint: string): Promise<boolean> {
  if (!hatDatenbank() || typeof endpoint !== "string") return false;
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unbekannt";
  if (!(await versuchErlaubt(`push-probe:${ip}`, 5, 15 * 60_000))) return false;
  const n = await mitteilen(
    { titel: "Mitteilungen sind an", text: "So sieht es aus, wenn sich ein Termin ändert.", url: "/einstellungen", kennung: "probe" },
    { nurEndpoint: endpoint },
  );
  return n > 0;
}
