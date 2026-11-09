import type { Kategorie, Termin } from "./types";

export const ZEITZONE = "Europe/Berlin";

/** Geschätzte Dauer ab Beginn (bzw. Treffzeit), wenn kein Ende eingetragen ist. */
const DAUER_MIN: Record<Kategorie, number> = {
  proklamation: 240,
  sitzung: 240,
  umzug: 180,
  empfang: 90,
  besuch: 45,
  arbeitseinsatz: 180,
  feier: 120,
  intern: 120,
  sonstiges: 120,
};

export function minuten(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function hhmm(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Datum + Minuten seit Mitternacht (darf > 1440 sein) -> {datum, zeit} */
export function verschiebe(datum: string, min: number): { datum: string; zeit: string } {
  const tage = Math.floor(min / 1440);
  const d = new Date(`${datum}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + tage);
  return { datum: d.toISOString().slice(0, 10), zeit: hhmm(min) };
}

export function naechsterTag(datum: string): string {
  return verschiebe(datum, 1440).datum;
}

export interface Zeitfenster {
  /** Kein Zeitpunkt bekannt -> ganztägig */
  ganztags: boolean;
  /** Minuten seit Mitternacht des Termin-Datums */
  start: number | null;
  ende: number | null;
}

/** Erste bekannte Uhrzeit eines Termins (Treffen vor Beginn vor Einlass). */
export function startzeit(t: Termin): string | null {
  return t.treffzeit ?? t.beginn ?? t.einlass;
}

/**
 * Berechnet für jeden Termin Start und Ende:
 * - Start = Treffzeit, sonst Beginn, sonst Einlass
 * - "im Anschluss an X" startet mit dem Ende von X
 * - Ende = eingetragenes Ende, sonst Beginn + geschätzte Dauer,
 *   gekürzt bis zum nächsten Programmpunkt desselben Tagesprogramms.
 */
export function zeitplan(termine: Termin[]): Map<string, Zeitfenster> {
  const nachId = new Map(termine.map((t) => [t.id, t]));
  const ergebnis = new Map<string, Zeitfenster>();

  const berechne = (t: Termin, tiefe = 0): Zeitfenster => {
    const fertig = ergebnis.get(t.id);
    if (fertig) return fertig;

    let start: number | null = null;
    const s = startzeit(t);
    if (s) start = minuten(s);
    else if (t.anschluss_an && tiefe < 10) {
      const vorher = nachId.get(t.anschluss_an);
      if (vorher) start = berechne(vorher, tiefe + 1).ende;
    }

    if (start === null) {
      const z = { ganztags: true, start: null, ende: null };
      ergebnis.set(t.id, z);
      return z;
    }

    let ende: number;
    if (t.ende) {
      ende = minuten(t.ende);
      if (ende <= start) ende += 1440; // über Mitternacht
    } else {
      const basis = t.beginn && !t.anschluss_an ? Math.max(minuten(t.beginn), start) : start;
      ende = basis + DAUER_MIN[t.kategorie];
      if (t.tagesprogramm) {
        const naechste = termine
          .filter(
            (x) =>
              x.id !== t.id &&
              x.datum === t.datum &&
              x.tagesprogramm === t.tagesprogramm &&
              startzeit(x) !== null,
          )
          .map((x) => minuten(startzeit(x)!))
          .filter((m) => m > start!)
          .sort((a, b) => a - b)[0];
        if (naechste !== undefined) ende = Math.min(ende, naechste);
      }
    }

    const z = { ganztags: false, start, ende };
    ergebnis.set(t.id, z);
    return z;
  };

  for (const t of termine) berechne(t);
  return ergebnis;
}

/** Sortiert nach Datum und Startzeit; ganztägige Termine zuerst. */
export function sortiere(termine: Termin[]): Termin[] {
  const plan = zeitplan(termine);
  const key = (t: Termin) => {
    const z = plan.get(t.id)!;
    // Anschluss-Termine knapp hinter ihren Vorgänger
    return z.start === null ? -1 : z.start + (t.anschluss_an ? 0.5 : 0);
  };
  return [...termine].sort(
    (a, b) => a.datum.localeCompare(b.datum) || key(a) - key(b) || a.titel.localeCompare(b.titel),
  );
}

/** Aktuelles Datum und Uhrzeit in Deutschland. */
export function jetztInBerlin(): { datum: string; minuten: number } {
  const teile = new Intl.DateTimeFormat("sv-SE", {
    timeZone: ZEITZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date()); // "2026-11-09 16:30"
  const [datum, zeit] = teile.split(" ");
  return { datum, minuten: minuten(zeit) };
}

const WOCHENTAG = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."];
const WOCHENTAG_LANG = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];
export const MONATE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

function wochentagIndex(datum: string): number {
  return new Date(`${datum}T12:00:00Z`).getUTCDay();
}

/** "Sa. 07.11." */
export function datumKurz(datum: string): string {
  const [, m, d] = datum.split("-");
  return `${WOCHENTAG[wochentagIndex(datum)]} ${d}.${m}.`;
}

/** "Samstag, 7. November 2026" */
export function datumLang(datum: string): string {
  const [y, m, d] = datum.split("-").map(Number);
  return `${WOCHENTAG_LANG[wochentagIndex(datum)]}, ${d}. ${MONATE[m - 1]} ${y}`;
}

export function zeitText(min: number): string {
  return hhmm(min);
}
