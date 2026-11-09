// Datenmodell für einen Termin. Spiegelt die Tabelle `termine` in Supabase
// (siehe supabase/migrations/0001_init.sql).

/** bestätigt = fest zugesagt, vorbehalt = im KG-Plan als "vorb." markiert */
export type Status = "bestaetigt" | "vorbehalt";

/**
 * Wer ist dabei? Die Stufen bauen aufeinander auf:
 * wir ⊂ vorstand ⊂ hofstaat ⊂ alle.
 * "abfrage" = im KG-Plan mit Ankreuz-Kästchen (Teilnahme wird je Gruppe abgefragt),
 * "helfer"  = "Jeder Verfügbare (Viele Hände …)" – Arbeitseinsätze.
 */
export type Besetzung =
  | "wir"
  | "vorstand"
  | "hofstaat"
  | "alle"
  | "abfrage"
  | "helfer";

/** Wie kommen wir hin? */
export type Fahrt = "auto" | "abholung" | "bus" | "zu_fuss" | "offen";

export type Kategorie =
  | "proklamation"
  | "sitzung"
  | "umzug"
  | "empfang"
  | "besuch"
  | "arbeitseinsatz"
  | "feier"
  | "intern"
  | "sonstiges";

/** Woher stammt der Termin? kg = Terminplan der KG, eigen = eigene Liste */
export type Quelle = "kg" | "eigen";

export interface Termin {
  /** Stabile ID – wird auch als UID im Kalender-Abo verwendet. */
  id: string;
  /** YYYY-MM-DD */
  datum: string;
  /** HH:MM – wann wir uns am Treffpunkt treffen / losfahren */
  treffzeit: string | null;
  /** HH:MM – offizieller Beginn der Veranstaltung */
  beginn: string | null;
  /** HH:MM */
  einlass: string | null;
  /** HH:MM – optional, sonst wird eine Dauer geschätzt */
  ende: string | null;
  /** ID eines Termins am selben Tag, an den dieser "im Anschluss" folgt
   *  (für Termine ohne eigene Uhrzeit) */
  anschluss_an: string | null;
  titel: string;
  /** Überschrift für zusammengehörige Programmpunkte, z. B. "Weiberdonnerstag" */
  tagesprogramm: string | null;
  veranstalter: string | null;
  treffpunkt: string | null;
  /** Veranstaltungsort, falls abweichend vom Treffpunkt */
  ort: string | null;
  kategorie: Kategorie;
  status: Status;
  besetzung: Besetzung;
  /** Frau & Kinder dabei */
  familie: boolean;
  fahrt: Fahrt;
  /** z. B. "Abholung durch Funken 10:30 beim Sepp" */
  fahrt_details: string | null;
  fahrer: string | null;
  /** Wichtiger Hinweis, z. B. "nur mit vorbestellter Eintrittskarte" */
  hinweis: string | null;
  bemerkung: string | null;
  quelle: Quelle[];
  /** Unstimmigkeit, die noch geklärt werden muss */
  pruefen: string | null;
}
