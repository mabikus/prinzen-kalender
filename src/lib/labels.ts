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
  jeder_verfuegbare: {
    label: "Jeder Verfügbare",
    beschreibung: "Alle, die können – „Viele Hände …“",
  },
};

export const ANMELDUNG: Record<Anmeldung, { label: string; icon: string }> = {
  eintrittskarte: { label: "Eintrittskarte nötig", icon: "🎟️" },
  voranmeldung: { label: "Voranmeldung nötig", icon: "📝" },
};

/** Tailwind-Klassen je Farbe (als feste Strings, damit Tailwind sie findet). */
export const FARBEN: Record<Farbe, { name: string; badge: string; punkt: string }> = {
  rot: {
    name: "Rot",
    badge: "bg-red-100 text-red-900 ring-red-300 dark:bg-red-950 dark:text-red-100 dark:ring-red-800",
    punkt: "bg-red-500",
  },
  orange: {
    name: "Orange",
    badge: "bg-orange-100 text-orange-900 ring-orange-300 dark:bg-orange-950 dark:text-orange-100 dark:ring-orange-800",
    punkt: "bg-orange-500",
  },
  gelb: {
    name: "Gelb",
    badge: "bg-yellow-100 text-yellow-900 ring-yellow-300 dark:bg-yellow-950 dark:text-yellow-100 dark:ring-yellow-800",
    punkt: "bg-yellow-400",
  },
  gruen: {
    name: "Grün",
    badge: "bg-emerald-100 text-emerald-900 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-800",
    punkt: "bg-emerald-500",
  },
  tuerkis: {
    name: "Türkis",
    badge: "bg-cyan-100 text-cyan-900 ring-cyan-300 dark:bg-cyan-950 dark:text-cyan-100 dark:ring-cyan-800",
    punkt: "bg-cyan-500",
  },
  blau: {
    name: "Blau",
    badge: "bg-blue-100 text-blue-900 ring-blue-300 dark:bg-blue-950 dark:text-blue-100 dark:ring-blue-800",
    punkt: "bg-blue-500",
  },
  lila: {
    name: "Lila",
    badge: "bg-violet-100 text-violet-900 ring-violet-300 dark:bg-violet-950 dark:text-violet-100 dark:ring-violet-800",
    punkt: "bg-violet-500",
  },
  pink: {
    name: "Pink",
    badge: "bg-pink-100 text-pink-900 ring-pink-300 dark:bg-pink-950 dark:text-pink-100 dark:ring-pink-800",
    punkt: "bg-pink-500",
  },
  grau: {
    name: "Grau",
    badge: "bg-zinc-200 text-zinc-800 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700",
    punkt: "bg-zinc-500",
  },
};

export const FARBLISTE = Object.keys(FARBEN) as Farbe[];

export function istFarbe(x: unknown): x is Farbe {
  return typeof x === "string" && Object.hasOwn(FARBEN, x);
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

/** Wie viele Personen kommen mit? (für Eintrittskarten / Anmeldung) */
export function personenBedarf(t: Termin, gruppen: Gruppe[]) {
  const dabei = gruppenDabei(t, gruppen);
  return {
    summe: dabei.reduce((s, g) => s + (g.personen ?? 0), 0),
    ohneAngabe: dabei.filter((g) => g.personen == null),
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
      label: "🎟️ Karten / Anmeldung",
      beschreibung: "Termine mit Eintrittskarte oder Voranmeldung",
      passt: (t: Termin) => t.anmeldung !== null,
    },
    { key: "intern", label: "Intern", beschreibung: "Eigene Veranstaltungen der KG", passt: (t) => t.art === "intern" },
    { key: "extern", label: "Extern", beschreibung: "Besuche bei anderen", passt: (t) => t.art === "extern" },
  ];
}
