import type { Termin } from "./types";

/** "Hauptstraße 1, 53474 Bad Neuenahr-Ahrweiler" – oder null, wenn keine Adresse eingetragen ist */
export function adresseText(t: Pick<Termin, "strasse" | "plz" | "stadt">): string | null {
  const ort = [t.plz, t.stadt].filter(Boolean).join(" ");
  return [t.strasse, ort].filter(Boolean).join(", ") || null;
}

/** Link zur Kartensuche – öffnet am iPhone/Android die Karten-App. Mit Adresse genau, sonst per Name in der Region. */
export function kartenLink(name: string | null, adresse?: string | null): string {
  const suche = adresse ? [name, adresse].filter(Boolean).join(", ") : `${name}, Kreis Ahrweiler`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(suche)}`;
}
