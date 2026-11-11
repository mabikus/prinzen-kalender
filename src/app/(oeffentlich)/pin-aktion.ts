"use server";

import { cookies, headers } from "next/headers";
import { hatDatenbank } from "@/db";
import { versuchErlaubt } from "@/lib/limit";
import { ladePin, PIN_COOKIE, pinRichtig, pinSchluessel } from "@/lib/vertraulich";

type Antwort = { ok: true } | { ok: false; fehler: string };

/** PIN eingeben → vertrauliche Termine auf diesem Gerät sichtbar (Cookie, ein gutes Jahr) */
export async function pinFreischalten(eingabe: string): Promise<Antwort> {
  const pin = await ladePin();
  if (!pin) return { ok: false, fehler: "Zurzeit gibt es keine PIN." };
  // Gegen Durchprobieren: 8 Versuche je Viertelstunde und Adresse
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unbekannt";
  if (hatDatenbank() && !(await versuchErlaubt(`pin:${ip}`, 8, 15 * 60_000))) {
    return { ok: false, fehler: "Zu viele Versuche. Bitte in einer Viertelstunde noch einmal." };
  }
  if (!pinRichtig(String(eingabe ?? ""), pin)) return { ok: false, fehler: "Die PIN stimmt nicht." };
  (await cookies()).set(PIN_COOKIE, pinSchluessel(pin), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return { ok: true };
}

/** Vertrauliche Termine auf diesem Gerät wieder ausblenden */
export async function pinSperren(): Promise<void> {
  (await cookies()).delete(PIN_COOKIE);
}
