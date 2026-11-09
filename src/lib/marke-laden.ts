import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, hatDatenbank, schema } from "@/db";
import { APP_KURZ, APP_NAME } from "./marke";

/** Name, Unterzeile und Logo-Stand der App – in der Verwaltung unter „Darstellung“ änderbar. */
export interface Marke {
  name: string;
  untertitel: string;
  /** Version des Logos für die Bild-Adressen (?v=) */
  logoStand: number;
  eigenesLogo: boolean;
}

export const MARKE_STANDARD: Marke = { name: APP_NAME, untertitel: APP_KURZ, logoStand: 0, eigenesLogo: false };
export const MARKE_TAG = "marke";

/** Beschreibung für Suchmaschinen-freie Vorschauen und das Manifest */
export const beschreibung = (m: Marke) => `Termine, Treffpunkte und Gruppen – ${m.untertitel}`;

/** Zwischengespeichert; nach dem Speichern in der Verwaltung per updateTag("marke") sofort neu. */
export async function ladeMarke(): Promise<Marke> {
  "use cache";
  cacheTag(MARKE_TAG);
  cacheLife("hours");
  if (!hatDatenbank()) return MARKE_STANDARD;
  try {
    const [z] = await db()
      .select({
        name: schema.einstellungen.app_name,
        untertitel: schema.einstellungen.untertitel,
        stand: schema.einstellungen.logo_stand,
        hatLogo: sql<boolean>`${schema.einstellungen.logo} is not null`,
      })
      .from(schema.einstellungen)
      .where(eq(schema.einstellungen.id, "app"));
    if (!z) return MARKE_STANDARD;
    return { name: z.name, untertitel: z.untertitel, logoStand: z.stand, eigenesLogo: z.hatLogo };
  } catch {
    return MARKE_STANDARD;
  }
}

/** Logo als PNG – eigenes aus der Datenbank, sonst das mitgelieferte (public/logo.png). */
export async function ladeLogo(klein = false): Promise<Uint8Array> {
  "use cache";
  cacheTag(MARKE_TAG);
  cacheLife("hours");
  if (hatDatenbank()) {
    try {
      const [z] = await db()
        .select({ logo: klein ? schema.einstellungen.logo_klein : schema.einstellungen.logo })
        .from(schema.einstellungen)
        .where(eq(schema.einstellungen.id, "app"));
      if (z?.logo) return new Uint8Array(z.logo);
    } catch {
      // mitgeliefertes Logo
    }
  }
  return new Uint8Array(await readFile(path.join(process.cwd(), "public", klein ? "logo-klein.png" : "logo.png")));
}

/** Adressen der Bilder mit Versionsnummer */
export const logoUrl = (m: Marke, klein = false) => `/marke/logo?${klein ? "klein=1&" : ""}v=${m.logoStand}`;
