import type { Besetzung, Fahrt, Kategorie, Status, Termin } from "./types";

export const BESETZUNG: Record<
  Besetzung,
  { label: string; kurz: string; beschreibung: string; farbe: string }
> = {
  wir: {
    label: "Wir drei",
    kurz: "Wir drei",
    beschreibung: "Kleinste Besetzung: Prinz(en) + Adjutant",
    farbe: "bg-sky-100 text-sky-900 ring-sky-300 dark:bg-sky-950 dark:text-sky-100 dark:ring-sky-800",
  },
  vorstand: {
    label: "Prinz + Vorstand",
    kurz: "+ Vorstand",
    beschreibung: "Halboffiziell: wir drei und der Vorstand",
    farbe: "bg-violet-100 text-violet-900 ring-violet-300 dark:bg-violet-950 dark:text-violet-100 dark:ring-violet-800",
  },
  hofstaat: {
    label: "Mit Hofstaat",
    kurz: "+ Hofstaat",
    beschreibung: "Offiziell: Vorstand und Hofstaat sind dabei",
    farbe: "bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-800",
  },
  alle: {
    label: "Alle",
    kurz: "Alle",
    beschreibung: "Die ganze KG ist dabei",
    farbe: "bg-red-100 text-red-900 ring-red-300 dark:bg-red-950 dark:text-red-100 dark:ring-red-800",
  },
  abfrage: {
    label: "Nach Abfrage",
    kurz: "Abfrage",
    beschreibung: "Teilnahme wird je Gruppe abgefragt (Kästchen im KG-Plan)",
    farbe: "bg-emerald-100 text-emerald-900 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-800",
  },
  helfer: {
    label: "Viele Hände",
    kurz: "Helfer",
    beschreibung: "Jeder Verfügbare – Arbeitseinsatz",
    farbe: "bg-zinc-200 text-zinc-800 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700",
  },
};

export const FAHRT: Record<Fahrt, { label: string; icon: string }> = {
  auto: { label: "Eigenes Auto", icon: "🚗" },
  abholung: { label: "Wir werden abgeholt", icon: "🙋" },
  bus: { label: "Bus", icon: "🚌" },
  zu_fuss: { label: "Zu Fuß / im Ort", icon: "🚶" },
  offen: { label: "Noch offen", icon: "❔" },
};

export const KATEGORIE: Record<Kategorie, { label: string; icon: string }> = {
  proklamation: { label: "Proklamation", icon: "👑" },
  sitzung: { label: "Sitzung", icon: "🎭" },
  umzug: { label: "Umzug", icon: "🎉" },
  empfang: { label: "Empfang", icon: "🥂" },
  besuch: { label: "Besuch", icon: "🤝" },
  arbeitseinsatz: { label: "Arbeitseinsatz", icon: "🔨" },
  feier: { label: "Feier", icon: "🎊" },
  intern: { label: "Intern", icon: "📋" },
  sonstiges: { label: "Sonstiges", icon: "📌" },
};

export const STATUS: Record<Status, string> = {
  bestaetigt: "bestätigt",
  vorbehalt: "unter Vorbehalt",
};

/**
 * Filter – werden sowohl in der Ansicht (?f=…) als auch für die
 * Kalender-Abos (/kalender/<token>/<filter>.ics) verwendet.
 */
const STUFE: Partial<Record<Besetzung, number>> = {
  wir: 1,
  vorstand: 2,
  hofstaat: 3,
  alle: 4,
};

/** Ist eine Gruppe der Stufe `mind` (2 = Vorstand, 3 = Hofstaat) bei dem Termin gefragt? */
function gefragt(t: Termin, mind: number): boolean {
  if (t.besetzung === "abfrage" || t.besetzung === "helfer") return true;
  return (STUFE[t.besetzung] ?? 0) >= mind;
}

export const FILTER = {
  alle: {
    label: "Alle Termine",
    beschreibung: "Der komplette Plan – für Prinz(en) und Adjutant",
    passt: () => true,
  },
  vorstand: {
    label: "Vorstand",
    beschreibung: "Alles, wo der Vorstand dabei ist oder gefragt wird",
    passt: (t: Termin) => gefragt(t, 2),
  },
  hofstaat: {
    label: "Hofstaat",
    beschreibung: "Alles, wo der Hofstaat dabei ist oder gefragt wird",
    passt: (t: Termin) => gefragt(t, 3),
  },
  familie: {
    label: "Familie",
    beschreibung: "Termine, bei denen Frau & Kinder dabei sind",
    passt: (t: Termin) => t.familie,
  },
  auto: {
    label: "Auto",
    beschreibung: "Termine, für die wir das eigene Auto brauchen",
    passt: (t: Termin) => t.fahrt === "auto",
  },
  helfer: {
    label: "Arbeitseinsätze",
    beschreibung: "Auf- und Abbau – „Viele Hände …“",
    passt: (t: Termin) => t.besetzung === "helfer",
  },
} as const satisfies Record<
  string,
  { label: string; beschreibung: string; passt: (t: Termin) => boolean }
>;

export type FilterName = keyof typeof FILTER;

export function istFilter(x: unknown): x is FilterName {
  return typeof x === "string" && Object.hasOwn(FILTER, x);
}
