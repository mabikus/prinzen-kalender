"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hatDatenbank } from "@/db";
import { auth } from "@/lib/auth";
import { anzahlBenutzer, BenutzerFehler, einladungEinloesen, erstelleBenutzer, normalisiereEmail } from "@/lib/benutzer";
import { protokolliereAktion } from "@/lib/daten";
import { aktuellerAdmin } from "@/lib/sitzung";
import { versuchErlaubt } from "@/lib/limit";
import { setzeZugangCookie } from "@/lib/zugang-cookie";

export interface Zustand {
  fehler?: string;
}

function text(fd: FormData, name: string) {
  const v = fd.get(name);
  return typeof v === "string" ? v.trim() : "";
}

/** Nur interne Ziele nach der Anmeldung (keine fremden Adressen). */
function sicheresZiel(weiter: string) {
  return weiter.startsWith("/") && !weiter.startsWith("//") ? weiter : "/verwaltung";
}

function meldung(e: unknown): string {
  if (e instanceof BenutzerFehler) return e.message;
  // Fehler von Better Auth (APIError – Klasse kann aus mehreren Paketen kommen, daher am Namen erkennen)
  if (e instanceof Error && e.name === "APIError") {
    const code = (e as Error & { statusCode?: number }).statusCode;
    if (code === 401) return "E-Mail oder Passwort ist falsch.";
    if (code === 403) return e.message || "Dieses Konto ist deaktiviert.";
    if (code === 429) return "Zu viele Versuche. Bitte eine Minute warten.";
    return e.message;
  }
  console.error("anmeldung", e);
  return "Das hat nicht geklappt. Bitte noch einmal versuchen.";
}

async function anmeldenMitPasswort(email: string, password: string) {
  await auth().api.signInEmail({ body: { email, password, rememberMe: true }, headers: await headers() });
  await setzeZugangCookie();
}

async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unbekannt").split(",")[0].trim();
}

export async function anmelden(_: Zustand, fd: FormData): Promise<Zustand> {
  if (!hatDatenbank()) return { fehler: "Die Anmeldung ist erst möglich, wenn die Datenbank verbunden ist." };
  const email = normalisiereEmail(text(fd, "email"));
  try {
    // Schutz gegen Durchprobieren: 10 Versuche je Minute und IP-Adresse, 10 je Viertelstunde und Konto
    const grenze = Number(process.env.ANMELDE_LIMIT ?? 10);
    const [ip, konto] = await Promise.all([
      versuchErlaubt(`anmelden|ip|${await clientIp()}`, grenze, 60_000),
      versuchErlaubt(`anmelden|email|${email}`, grenze, 15 * 60_000),
    ]);
    if (!ip || !konto) return { fehler: "Zu viele Versuche. Bitte etwas warten und dann erneut versuchen." };
    await anmeldenMitPasswort(email, String(fd.get("passwort") ?? ""));
  } catch (e) {
    return { fehler: meldung(e) };
  }
  redirect(sicheresZiel(text(fd, "weiter")));
}

/** Nach der Anmeldung mit Passkey (im Browser): Zugangs-Cookie setzen. */
export async function nachPasskeyAnmeldung(): Promise<boolean> {
  if (!(await aktuellerAdmin())) return false;
  await setzeZugangCookie();
  return true;
}

export async function einrichten(_: Zustand, fd: FormData): Promise<Zustand> {
  if (!hatDatenbank()) return { fehler: "Keine Datenbank verbunden." };
  const name = text(fd, "name");
  const email = normalisiereEmail(text(fd, "email"));
  const passwort = String(fd.get("passwort") ?? "");
  const vorgabe = process.env.SUPERADMIN_EMAIL ? normalisiereEmail(process.env.SUPERADMIN_EMAIL) : null;
  try {
    if ((await anzahlBenutzer()) > 0) return { fehler: "Die Einrichtung ist bereits abgeschlossen." };
    if (vorgabe && email !== vorgabe) return { fehler: "Bitte die hinterlegte E-Mail-Adresse verwenden." };
    if (!name) return { fehler: "Bitte einen Namen angeben." };
    if (passwort !== String(fd.get("passwort2") ?? "")) return { fehler: "Die Passwörter stimmen nicht überein." };
    const u = await erstelleBenutzer({ name, email, passwort, role: "superadmin" });
    await protokolliereAktion({ id: u.id, name: u.name }, "benutzer.einrichtung", { id: u.id, titel: u.name });
    await anmeldenMitPasswort(email, passwort);
  } catch (e) {
    return { fehler: meldung(e) };
  }
  redirect("/verwaltung/konto?willkommen=1");
}

export async function einladungAnnehmen(_: Zustand, fd: FormData): Promise<Zustand> {
  const token = text(fd, "token");
  const passwort = String(fd.get("passwort") ?? "");
  try {
    if (passwort !== String(fd.get("passwort2") ?? "")) return { fehler: "Die Passwörter stimmen nicht überein." };
    const email = await einladungEinloesen(token, { name: text(fd, "name"), passwort });
    await anmeldenMitPasswort(email, passwort);
  } catch (e) {
    return { fehler: meldung(e) };
  }
  redirect("/verwaltung");
}
