// Reine Rechenlogik des Kalenders (ohne React) – getestet in geometrie.test.ts.

import type { Termin } from "@/lib/types";
import { verschiebe, zeitplan } from "@/lib/zeit";

export type Ansicht = "tag" | "woche" | "monat";

/** Sichtbarer Bereich des Zeitrasters (Minuten seit Mitternacht) */
export const RASTER_VON = 6 * 60;
export const RASTER_BIS = 24 * 60;
/** Raster beim Ziehen: 15 Minuten */
export const SCHRITT = 15;
/** Höhe einer Stunde in Pixeln */
export const STUNDE_PX = 52;
export const PX_PRO_MIN = STUNDE_PX / 60;

export interface Eintrag {
  t: Termin;
  tag: string;
  ganztags: boolean;
  start: number;
  ende: number;
}

/** Termine → Kalendereinträge mit Start/Ende in Minuten (Ende auf den Tag begrenzt). */
export function eintraege(termine: Termin[]): Eintrag[] {
  const plan = zeitplan(termine);
  return termine.map((t) => {
    const z = plan.get(t.id);
    if (!z || z.ganztags || z.start == null) return { t, tag: t.datum, ganztags: true, start: 0, ende: 0 };
    const ende = Math.min(Math.max(z.ende ?? z.start + 60, z.start + SCHRITT), RASTER_BIS);
    return { t, tag: t.datum, ganztags: false, start: z.start, ende };
  });
}

export const runde = (min: number, schritt = SCHRITT) => Math.round(min / schritt) * schritt;
export const begrenze = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function hhmm(min: number): string {
  const m = begrenze(Math.round(min), 0, 23 * 60 + 59);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function minutenAus(hhmmText: string | null): number | null {
  if (!hhmmText) return null;
  const [h, m] = hhmmText.split(":").map(Number);
  return h * 60 + m;
}

export function plusTage(datum: string, n: number): string {
  return verschiebe(datum, n * 1440).datum;
}

/** ISO-Kalenderwoche (Woche mit dem ersten Donnerstag = KW 1) */
export function kalenderwoche(datum: string): number {
  const d = new Date(`${datum}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3); // Donnerstag dieser Woche
  const jahresanfang = Date.UTC(d.getUTCFullYear(), 0, 1);
  return 1 + Math.floor((d.getTime() - jahresanfang) / (7 * 86_400_000));
}

/** Montag der Woche */
export function wochenStart(datum: string): string {
  const wt = (new Date(`${datum}T12:00:00Z`).getUTCDay() + 6) % 7;
  return plusTage(datum, -wt);
}

export function tageDerAnsicht(ansicht: Ansicht, datum: string): string[] {
  if (ansicht === "tag") return [datum];
  if (ansicht === "woche") {
    const mo = wochenStart(datum);
    return Array.from({ length: 7 }, (_, i) => plusTage(mo, i));
  }
  // Monat: volle Wochen von Montag bis Sonntag, die den Monat abdecken
  const erster = `${datum.slice(0, 7)}-01`;
  const letzter = plusTage(blaettern("monat", erster, 1), -1);
  const tage: string[] = [];
  for (let d = wochenStart(erster); ; d = plusTage(d, 1)) {
    tage.push(d);
    if (tage.length % 7 === 0 && d >= letzter) break;
  }
  return tage;
}

export function blaettern(ansicht: Ansicht, datum: string, richtung: 1 | -1): string {
  if (ansicht === "tag") return plusTage(datum, richtung);
  if (ansicht === "woche") return plusTage(datum, 7 * richtung);
  const [y, m] = datum.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + richtung, 1));
  return d.toISOString().slice(0, 10);
}

export interface Platz {
  eintrag: Eintrag;
  spalte: number;
  spalten: number;
}

/**
 * Überlappende Termine eines Tages nebeneinander verteilen:
 * Gruppen sich überschneidender Termine teilen sich die Breite, jeder bekommt die erste freie Spalte.
 */
export function verteile(liste: Eintrag[]): Platz[] {
  const sortiert = [...liste].sort((a, b) => a.start - b.start || b.ende - a.ende);
  const ergebnis: Platz[] = [];
  let gruppe: Platz[] = [];
  let gruppenEnde = -1;
  let spaltenEnden: number[] = [];

  const abschliessen = () => {
    const n = Math.max(1, spaltenEnden.length);
    for (const p of gruppe) p.spalten = n;
    ergebnis.push(...gruppe);
    gruppe = [];
    spaltenEnden = [];
  };

  for (const e of sortiert) {
    if (gruppe.length && e.start >= gruppenEnde) abschliessen();
    let spalte = spaltenEnden.findIndex((ende) => ende <= e.start);
    if (spalte === -1) {
      spalte = spaltenEnden.length;
      spaltenEnden.push(e.ende);
    } else spaltenEnden[spalte] = e.ende;
    gruppe.push({ eintrag: e, spalte, spalten: 1 });
    gruppenEnde = Math.max(gruppenEnde, e.ende);
  }
  if (gruppe.length) abschliessen();
  return ergebnis;
}

/** Neue Zeiten eines Termins nach dem Verschieben um `minuten` und `tage`. */
export function verschobeneZeiten(t: Termin, startAlt: number, minuten: number, tage: number) {
  const shift = (v: string | null) => (v == null ? null : hhmm(begrenze((minutenAus(v) ?? 0) + minuten, 0, 1439)));
  const hatEigeneZeit = !!(t.treffzeit || t.beginn);
  return {
    datum: plusTage(t.datum, tage),
    treffzeit: shift(t.treffzeit),
    // Termine "im Anschluss" ohne eigene Uhrzeit bekommen beim Verschieben einen Beginn
    beginn: hatEigeneZeit ? shift(t.beginn) : hhmm(startAlt + minuten),
    ende: shift(t.ende),
  };
}

/** y-Position (px, relativ zum Raster) → Minuten, gerundet */
export function yZuMinuten(y: number): number {
  return begrenze(runde(RASTER_VON + y / PX_PRO_MIN), RASTER_VON, RASTER_BIS);
}

export function minutenZuY(min: number): number {
  return (min - RASTER_VON) * PX_PRO_MIN;
}
