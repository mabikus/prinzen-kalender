import type { Anmeldung, Art, Farbe, Gruppe, Status, Termin, Umfang } from "./types";

export const STATUS: Record<Status, string> = {
  bestaetigt: "bestätigt",
  vorbehalt: "unter Vorbehalt",
};

export const ART: Record<Art, string> = {
  intern: "Intern",
  extern: "Extern",
};

export const UMFANG: Record<Umfang, { label: string; beschreibung: string }> = {
  auswahl: { label: "Auswahl", beschreibung: "Nur die angekreuzten Gruppen" },
  alle: { label: "Alle", beschreibung: "Alle Gruppen sind dabei" },
};

export const ANMELDUNG: Record<Anmeldung, { label: string; kurz: string }> = {
  eintrittskarte: { label: "Eintrittskarte nötig", kurz: "Eintrittskarte" },
};

/** Gespeicherte Gruppenfarbe – wird in der Oberfläche derzeit nicht genutzt (Rot-Weiß-Design). */
export const FARBLISTE: Farbe[] = ["rot", "orange", "gelb", "gruen", "tuerkis", "blau", "lila", "pink", "grau"];

export function istFarbe(x: unknown): x is Farbe {
  return typeof x === "string" && (FARBLISTE as string[]).includes(x);
}

/** Ist die Gruppe bei diesem Termin dabei? */
export function gruppeDabei(t: Termin, g: Gruppe): boolean {
  if (t.gruppen.includes(g.id)) return true;
  return t.umfang !== "auswahl" && g.in_alle;
}

/** Alle Gruppen, die beim Termin dabei sind (in Sortierreihenfolge). */
export function gruppenDabei(t: Termin, gruppen: Gruppe[]): Gruppe[] {
  return gruppen.filter((g) => gruppeDabei(t, g));
}

/** Personen einer Gruppe bei diesem Termin: abweichende Zahl am Termin, sonst die Zahl der Gruppe */
export function personenVon(t: Pick<Termin, "personen">, g: Gruppe): number | null {
  const n = t.personen?.[g.id];
  return typeof n === "number" ? n : g.personen;
}

/** Wie viele Personen kommen mit? (für Eintrittskarten) */
export function personenBedarf(t: Termin, gruppen: Gruppe[]) {
  const dabei = gruppenDabei(t, gruppen);
  return {
    summe: dabei.reduce((s, g) => s + (personenVon(t, g) ?? 0), 0),
    ohneAngabe: dabei.filter((g) => personenVon(t, g) == null),
    dabei,
  };
}

/** Kurztext "Wer ist dabei?", z. B. "Alle + Familie" oder "Prinz, Vorstand" */
export function werText(t: Termin, gruppen: Gruppe[]): string {
  if (t.umfang === "auswahl") return gruppenDabei(t, gruppen).map((g) => g.name).join(", ") || "–";
  const extras = gruppen.filter((g) => !g.in_alle && t.gruppen.includes(g.id)).map((g) => g.name);
  return [UMFANG[t.umfang].label, ...extras].join(" + ");
}

export interface Filter {
  key: string;
  label: string;
  beschreibung: string;
  passt: (t: Termin) => boolean;
}

/**
 * Filter – werden sowohl in der Ansicht (?f=…) als auch für die Kalender-Abos
 * (/kalender/<token>/<filter>.ics) verwendet. Jede Gruppe ist ein eigener Filter.
 */
export function filterListe(gruppen: Gruppe[]): Filter[] {
  return [
    { key: "alle", label: "Alle Termine", beschreibung: "Der komplette Plan", passt: () => true },
    ...gruppen.map((g) => ({
      key: g.id,
      label: g.name,
      beschreibung: `Termine, bei denen ${g.name} dabei ist`,
      passt: (t: Termin) => gruppeDabei(t, g),
    })),
    {
      key: "karten",
      label: "Karten",
      beschreibung: "Termine mit Eintrittskarte",
      passt: (t: Termin) => t.anmeldung !== null,
    },
    { key: "intern", label: "Intern", beschreibung: "Eigene Veranstaltungen der KG", passt: (t) => t.art === "intern" },
    { key: "extern", label: "Extern", beschreibung: "Besuche bei anderen", passt: (t) => t.art === "extern" },
  ];
}
