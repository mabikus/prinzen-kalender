// Datenmodell. Spiegelt die Tabellen in Supabase
// (siehe supabase/migrations/0001_init.sql).

/** bestätigt = fest zugesagt, vorbehalt = im KG-Plan als "vorb." markiert */
export type Status = "bestaetigt" | "vorbehalt";

/** Eigene Veranstaltung der KG (intern) oder Besuch bei anderen (extern) */
export type Art = "intern" | "extern";

/**
 * Wer ist dabei?
 * - auswahl: nur die angekreuzten Gruppen
 * - alle: alle Gruppen (die zu "Alle" zählen) + angekreuzte Extras
 */
export type Umfang = "auswahl" | "alle";

/** Muss vorher etwas bestellt / angemeldet werden? */
export type Anmeldung = "eintrittskarte";

export type Farbe =
  | "rot"
  | "orange"
  | "gelb"
  | "gruen"
  | "tuerkis"
  | "blau"
  | "lila"
  | "pink"
  | "grau";

export interface Gruppe {
  /** Kurzer, fester Schlüssel – steht auch in der Abo-Adresse, z. B. "senat" */
  id: string;
  /** Kürzel wie im KG-Plan, z. B. "S" */
  kuerzel: string;
  name: string;
  beschreibung: string | null;
  /** Anzahl Personen – für die Berechnung der Eintrittskarten */
  personen: number | null;
  farbe: Farbe;
  /** Gehört zu "Alle"? (z. B. Familie: nein) */
  in_alle: boolean;
  sortierung: number;
}

export interface Termin {
  /** Stabile ID – wird auch als UID im Kalender-Abo verwendet. */
  id: string;
  /** YYYY-MM-DD */
  datum: string;
  /** HH:MM – wann wir uns am Treffpunkt treffen / losfahren */
  treffzeit: string | null;
  treffpunkt: string | null;
  /** HH:MM – offizieller Beginn der Veranstaltung */
  beginn: string | null;
  /** Veranstaltungsort, falls abweichend vom Treffpunkt */
  ort: string | null;
  /** Adresse des Veranstaltungsorts (optional, für Navigation und Kalender) */
  strasse: string | null;
  plz: string | null;
  stadt: string | null;
  /** HH:MM – optional, sonst wird eine Dauer geschätzt */
  ende: string | null;
  /** ID eines Termins am selben Tag, an den dieser "im Anschluss" folgt
   *  (für Termine ohne eigene Uhrzeit) */
  anschluss_an: string | null;
  titel: string;
  /** Überschrift für zusammengehörige Programmpunkte, z. B. "Weiberdonnerstag" */
  tagesprogramm: string | null;
  veranstalter: string | null;
  art: Art;
  status: Status;
  umfang: Umfang;
  /** IDs der angekreuzten Gruppen */
  gruppen: string[];
  anmeldung: Anmeldung | null;
  /** Wie viele Karten bereits bestellt sind – nur intern (Verwaltung), nie öffentlich anzeigen */
  karten_bestellt: number | null;
  /** Abweichende Personenzahl je Gruppe nur für diesen Termin (Gruppen-ID → Anzahl), z. B. „vom Elferrat nur 2“.
   *  Ohne Eintrag gilt die Zahl der Gruppe. */
  personen: Record<string, number>;
  /** Nur mit PIN sichtbar (z. B. Vorstandstermine) */
  vertraulich: boolean;
  /** Sonstiger wichtiger Hinweis, z. B. "Abfahrt 12:00 Uhr!" */
  hinweis: string | null;
  bemerkung: string | null;
  /** Herkunft: kg = KG-Terminplan, eigen = eigene Liste */
  quelle: string[];
  /** Unstimmigkeit, die noch geklärt werden muss */
  pruefen: string | null;
}

export interface Daten {
  termine: Termin[];
  gruppen: Gruppe[];
}
