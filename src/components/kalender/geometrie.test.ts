import { describe, expect, it } from "vitest";
import type { Termin } from "@/lib/types";
import { blaettern, hhmm, kalenderwoche, tageDerAnsicht, verschobeneZeiten, verteile, wochenStart, type Eintrag } from "./geometrie";

const t = (felder: Partial<Termin>): Termin => ({
  id: "x",
  datum: "2027-02-04",
  treffzeit: null,
  treffpunkt: null,
  beginn: null,
  ort: null,
  strasse: null,
  plz: null,
  stadt: null,
  ende: null,
  anschluss_an: null,
  titel: "T",
  tagesprogramm: null,
  veranstalter: null,
  art: "extern",
  status: "bestaetigt",
  umfang: "auswahl",
  gruppen: [],
  anmeldung: null,
  karten_bestellt: null,
  personen: {},
  vertraulich: false,
  hinweis: null,
  bemerkung: null,
  quelle: [],
  pruefen: null,
  ...felder,
});

const e = (id: string, start: number, ende: number): Eintrag => ({ t: t({ id }), tag: "2027-02-04", ganztags: false, start, ende });

describe("Wochen und Ansichten", () => {
  it("Montag als Wochenanfang", () => {
    expect(wochenStart("2027-02-04")).toBe("2027-02-01"); // Do -> Mo
    expect(wochenStart("2027-02-07")).toBe("2027-02-01"); // So -> Mo
    expect(wochenStart("2027-02-01")).toBe("2027-02-01");
  });
  it("Woche hat 7 Tage, Monat volle Wochen", () => {
    expect(tageDerAnsicht("woche", "2027-02-04")).toHaveLength(7);
    const monat = tageDerAnsicht("monat", "2027-02-10");
    expect(monat.length % 7).toBe(0);
    expect(monat[0]).toBe("2027-02-01");
    expect(monat).toContain("2027-02-28");
    expect(monat).toHaveLength(28); // Feb 2027 beginnt Montag und endet Sonntag
    expect(tageDerAnsicht("monat", "2026-11-09")).toHaveLength(42); // 1.11. ist Sonntag, 30.11. Montag
  });
  it("Blättern über Monatsgrenzen", () => {
    expect(blaettern("monat", "2027-01-31", 1)).toBe("2027-02-01");
    expect(blaettern("woche", "2026-12-28", 1)).toBe("2027-01-04");
    expect(blaettern("tag", "2027-03-01", -1)).toBe("2027-02-28");
  });
});

describe("Überlappungen", () => {
  it("nicht überlappend: volle Breite", () => {
    const p = verteile([e("a", 600, 660), e("b", 660, 720)]);
    expect(p.map((x) => x.spalten)).toEqual([1, 1]);
  });
  it("überlappend: nebeneinander", () => {
    const p = verteile([e("a", 600, 720), e("b", 630, 690), e("c", 700, 760)]);
    const nach = Object.fromEntries(p.map((x) => [x.eintrag.t.id, x]));
    expect(nach.a.spalten).toBe(2);
    expect(nach.a.spalte).toBe(0);
    expect(nach.b.spalte).toBe(1);
    expect(nach.c.spalte).toBe(1); // b ist vorbei
  });
});

describe("Verschieben", () => {
  it("verschiebt Treffzeit, Beginn und Ende gemeinsam", () => {
    const z = verschobeneZeiten(t({ treffzeit: "18:30", beginn: "19:11", ende: "23:00" }), 1110, 60, 1);
    expect(z).toEqual({ datum: "2027-02-05", treffzeit: "19:30", beginn: "20:11", ende: "23:59" });
  });
  it("Termin ohne eigene Zeit bekommt einen Beginn", () => {
    const z = verschobeneZeiten(t({ anschluss_an: "y" }), 13 * 60, 30, 0);
    expect(z.beginn).toBe("13:30");
  });
  it("hhmm begrenzt auf den Tag", () => {
    expect(hhmm(-5)).toBe("00:00");
    expect(hhmm(1500)).toBe("23:59");
  });
});

describe("kalenderwoche", () => {
  it("rechnet nach ISO 8601", () => {
    expect(kalenderwoche("2026-11-09")).toBe(46);
    expect(kalenderwoche("2026-11-01")).toBe(44);
    expect(kalenderwoche("2027-01-01")).toBe(53); // Freitag gehört noch zur KW 53/2026
    expect(kalenderwoche("2027-01-04")).toBe(1);
    expect(kalenderwoche("2027-02-08")).toBe(6);
  });
});
