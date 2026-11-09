/** Lesbare Texte für Protokoll-Einträge */
export const AKTION: Record<string, string> = {
  "termin.angelegt": "hat den Termin angelegt",
  "termin.geaendert": "hat den Termin geändert",
  "termin.verschoben": "hat den Termin verschoben",
  "termin.dupliziert": "hat den Termin dupliziert",
  "termin.geloescht": "hat den Termin gelöscht",
  "termin.wiederhergestellt": "hat den Termin wiederhergestellt",
  "gruppe.angelegt": "hat die Gruppe angelegt",
  "gruppe.geaendert": "hat die Gruppe geändert",
  "gruppe.geloescht": "hat die Gruppe gelöscht",
  "benutzer.einrichtung": "hat den Kalender eingerichtet",
  "benutzer.eingeladen": "hat eingeladen",
  "benutzer.beigetreten": "ist beigetreten",
  "benutzer.einladung_zurueckgezogen": "hat die Einladung zurückgezogen",
  "benutzer.passwort_link": "hat einen Passwort-Link erstellt für",
  "benutzer.passwort_neu": "hat ein neues Passwort gesetzt",
  "benutzer.deaktiviert": "hat deaktiviert",
  "benutzer.aktiviert": "hat aktiviert",
  "benutzer.geloescht": "hat gelöscht",
};

export const FELD: Record<string, string> = {
  datum: "Datum",
  treffzeit: "Treffzeit",
  treffpunkt: "Treffpunkt",
  beginn: "Beginn",
  ort: "Ort",
  ende: "Ende",
  anschluss_an: "Im Anschluss an",
  titel: "Titel",
  tagesprogramm: "Tagesprogramm",
  veranstalter: "Veranstalter",
  art: "Intern/Extern",
  status: "Status",
  umfang: "Wer",
  gruppen: "Gruppen",
  anmeldung: "Karten/Anmeldung",
  karten_bestellt: "Bestellt",
  hinweis: "Hinweis",
  bemerkung: "Bemerkung",
  pruefen: "Prüfen",
  id: "ID",
  quelle: "Quelle",
};

export function wert(v: unknown): string {
  if (v === null || v === undefined || v === "") return "–";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "–";
  if (typeof v === "boolean") return v ? "ja" : "nein";
  return String(v);
}

/** Geänderte Felder als kurze Zeilen „Feld: alt → neu“. */
export function aenderungen(details: unknown): string[] {
  if (!details || typeof details !== "object" || Array.isArray(details)) return [];
  return Object.entries(details as Record<string, { vorher?: unknown; nachher?: unknown }>)
    .filter(([, d]) => d && typeof d === "object" && "nachher" in d)
    .map(([k, d]) => `${FELD[k] ?? k}: ${wert(d.vorher)} → ${wert(d.nachher)}`);
}

const fmt = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function zeitpunkt(iso: string) {
  return fmt.format(new Date(iso));
}
