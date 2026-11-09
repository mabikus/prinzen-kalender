// Startdaten Session 2026/27.
// Zusammengeführt aus dem Terminplan der KG Heimersheim (Fotos) und der eigenen
// Liste "05_Termine_Session_26-27.xlsx".
//
// Regeln beim Übertragen:
// - KG-Plan "Uhrzeit" + "Treffpunkt"  -> treffzeit / treffpunkt
//   (ohne Treffpunkt ist die Uhrzeit die Zeit vor Ort -> beginn)
// - "Beginn 19:11" aus dem Veranstaltungstext -> beginn
// - Teilnahme-Spalte: "Alle" -> umfang alle, "Jeder Verfügbare" -> jeder_verfuegbare,
//   "Nur Prinz + Vorstand" -> Prinz + Vorstand,
//   Kästchen (Teilnahme wird abgefragt) -> erstmal nur Prinz, Gruppen ergänzen
// - "nur mit vorbestellter Eintrittskarte" / "nur mit Voranmeldung" -> anmeldung
// - Unstimmigkeiten zwischen den Listen stehen im Feld `pruefen`.
//
// Diese Datei ist nur der Startbestand. Mit `npm run seed:sql` wird daraus
// supabase/seed.sql erzeugt; danach wird in der App (Verwaltung) gepflegt.

import type { Gruppe, Termin } from "../lib/types";
import { slug } from "../lib/slug.ts";

// ───────────── Gruppen ─────────────
// Kürzel aus den Teilnahme-Spalten im KG-Plan. Unbekannte bitte in der
// Verwaltung umbenennen, Personenzahl eintragen (für die Kartenberechnung).

function g(
  sortierung: number,
  id: string,
  kuerzel: string,
  name: string,
  farbe: Gruppe["farbe"],
  extra: Partial<Gruppe> = {},
): Gruppe {
  return { id, kuerzel, name, beschreibung: null, personen: null, farbe, in_alle: true, sortierung, ...extra };
}

export const startGruppen: Gruppe[] = [
  g(10, "prinz", "P", "Prinz", "rot", {
    beschreibung: "Prinz(en) + Adjutant – „wir drei“",
    personen: 3,
  }),
  g(20, "senat", "S", "Senat", "blau"),
  g(30, "elferrat", "E", "Elferrat", "gelb"),
  g(40, "funken", "F", "Funken", "orange"),
  g(50, "c", "C", "C (bitte benennen)", "tuerkis"),
  g(60, "vorstand", "V", "Vorstand", "lila"),
  g(70, "kt", "KT", "KT (bitte benennen)", "pink"),
  g(80, "kf", "KF", "KF (bitte benennen)", "gruen"),
  g(90, "ktp", "KTP", "KTP (bitte benennen)", "pink"),
  g(100, "mtp", "MTP", "MTP (bitte benennen)", "gruen"),
  g(200, "familie", "Fam", "Familie", "grau", {
    beschreibung: "Frau & Kinder",
    in_alle: false,
  }),
];

// ───────────── Termine ─────────────

type Eingabe = Partial<Omit<Termin, "id" | "datum" | "titel">> & {
  titel: string;
  id?: string;
};

const LF = "Landskroner Festhalle";
const P = ["prinz"];
const PV = ["prinz", "vorstand"];

function t(datum: string, e: Eingabe): Omit<Termin, "id"> & { id?: string } {
  return {
    datum,
    treffzeit: null,
    treffpunkt: null,
    beginn: null,
    ort: null,
    ende: null,
    anschluss_an: null,
    tagesprogramm: null,
    veranstalter: null,
    art: "extern",
    status: "bestaetigt",
    umfang: "auswahl",
    gruppen: P,
    anmeldung: null,
    karten_bestellt: null,
    hinweis: null,
    bemerkung: null,
    quelle: ["kg"],
    pruefen: null,
    ...e,
  };
}

/** Arbeitseinsatz "Jeder Verfügbare (Viele Hände …)" */
function helfer(datum: string, zeit: string, titel: string, treffpunkt = LF, e: Partial<Eingabe> = {}) {
  return t(datum, {
    titel,
    treffzeit: zeit,
    treffpunkt,
    art: "intern",
    umfang: "jeder_verfuegbare",
    gruppen: [],
    ...e,
  });
}

const roh = [
  // ───────────── November 2026 ─────────────
  helfer("2026-11-04", "18:00", "Vorbereitung Proklamation"),
  helfer("2026-11-05", "18:00", "Vorbereitung Proklamation"),
  helfer("2026-11-06", "18:00", "Vorbereitung Proklamation"),
  t("2026-11-07", {
    titel: "Prinzenproklamation",
    treffzeit: "18:33",
    beginn: "19:11",
    treffpunkt: LF,
    veranstalter: "KG Heimersheim",
    art: "intern",
    gruppen: ["prinz", "familie"],
    bemerkung: "Einlass 17:33",
    quelle: ["kg", "eigen"],
  }),
  helfer("2026-11-08", "08:00", "Aufbau FAK Karnevalseröffnung"),
  t("2026-11-08", {
    id: "2026-11-08-sessionseroeffnung",
    titel: "Sessionseröffnung FAK",
    treffzeit: "10:30",
    beginn: "11:11",
    treffpunkt: "Roter Platz",
    ort: "Marktplatz Heimersheim",
    veranstalter: "FAK",
    bemerkung: "Abholung durch Funken 10:30 beim Sepp",
    quelle: ["kg", "eigen"],
    pruefen:
      "KG-Plan: Treffpunkt 10:30 Roter Platz – eigene Liste: Abholung durch Funken 10:30 beim Sepp",
  }),
  t("2026-11-08", {
    titel: "FAK Eröffnungsparty",
    anschluss_an: "2026-11-08-sessionseroeffnung",
    treffpunkt: LF,
    veranstalter: "FAK",
  }),
  helfer("2026-11-09", "18:00", "Abbau"),
  t("2026-11-11", {
    titel: "Terminabsprache",
    beginn: "18:00",
    veranstalter: "Reni",
    ort: "bei Reni",
    art: "intern",
    quelle: ["eigen"],
  }),
  t("2026-11-12", {
    titel: "Corpstreffen",
    beginn: "21:30",
    veranstalter: "Corps à la Suite",
    ort: "Poststuben Heppingen",
    quelle: ["eigen"],
  }),
  t("2026-11-13", {
    titel: "Prinzenproklamation Bad Neuenahr",
    treffzeit: "18:30",
    beginn: "19:00",
    treffpunkt: "Häusje",
    ort: "Augustinum Bad Neuenahr",
    veranstalter: "K.G. Schinnebröder",
    quelle: ["kg", "eigen"],
  }),
  t("2026-11-14", {
    titel: "Proklamation Ringen",
    beginn: "19:00",
    veranstalter: "Windböggele",
    ort: "Halle Ringen",
    quelle: ["eigen"],
  }),
  t("2026-11-15", {
    titel: "Volkstrauertag",
    treffzeit: "10:00",
    treffpunkt: "Heimersheim",
    ort: "Friedhof Heimersheim",
    veranstalter: "Gemeinde",
    quelle: ["kg", "eigen"],
  }),
  t("2026-11-20", {
    titel: "Mundartabend",
    treffzeit: "19:00",
    treffpunkt: "Weingut Nelles",
    gruppen: PV,
    quelle: ["kg", "eigen"],
  }),
  t("2026-11-21", {
    titel: "Adventsausstellung Blumenberg",
    treffzeit: "17:30",
    beginn: "17:00",
    treffpunkt: "Blumenberg",
    veranstalter: "Blumis",
    quelle: ["kg", "eigen"],
    pruefen: "KG-Plan: 17:30 – eigene Liste: 17:00",
  }),
  t("2026-11-21", {
    titel: "Prinzenproklamation Ahrweiler",
    treffzeit: "18:30",
    beginn: "19:00",
    treffpunkt: "Häusje",
    ort: "Bürgerzentrum Ahrweiler",
    veranstalter: "Ahrweiler K.G.",
    bemerkung: "Einlass 17:45",
    quelle: ["kg", "eigen"],
    pruefen: "Beginn laut KG-Plan 19:00 – eigene Liste: 19:11",
  }),
  helfer("2026-11-26", "18:00", "Aufbau Weihnachtsmärktchen", "Mühle"),
  helfer("2026-11-27", "18:00", "Aufbau Weihnachtsmärktchen", "Mühle"),
  helfer("2026-11-28", "10:00", "Aufbau Weihnachtsmärktchen", "Mühle"),
  helfer("2026-11-28", "15:00", "Weihnachtsmärktchen", "Offergelds Mühle", {
    veranstalter: "KG Heimersheim",
    gruppen: ["familie"],
    quelle: ["kg", "eigen"],
    pruefen: "Eigene Liste: So. 29.11. 17:00 – KG-Plan: Sa. 28.11. 15:00 (So. ist Abbau)",
  }),
  helfer("2026-11-29", "15:00", "Abbau Weihnachtsmärktchen", "Mühle"),

  // ───────────── Dezember 2026 ─────────────
  t("2026-12-19", {
    titel: "Prinzenhausschmücken",
    treffzeit: "17:00",
    beginn: "18:00",
    treffpunkt: "Firma Prinz",
    ort: "Fenster Schmitt",
    veranstalter: "Funken",
    art: "intern",
    gruppen: ["prinz", "funken"],
    quelle: ["kg", "eigen"],
    pruefen: "KG-Plan: 17:00 Firma Prinz – eigene Liste: 18:00 Fenster Schmitt",
  }),

  // ───────────── Januar 2027 ─────────────
  t("2027-01-02", {
    titel: "Prunksitzung Bachem",
    treffzeit: "18:30",
    beginn: "19:11",
    treffpunkt: "Bachem Winzerverein",
    anmeldung: "eintrittskarte",
  }),
  t("2027-01-09", {
    titel: "Tollitätenabend Bad Neuenahr",
    beginn: "18:30",
    ort: "Bad Neuenahr",
    gruppen: PV,
    pruefen: "Treffpunkt im KG-Plan leer",
  }),
  t("2027-01-10", {
    titel: "Prunksitzung Ahrweiler",
    treffzeit: "14:00",
    beginn: "15:30",
    treffpunkt: "Bürgerzentrum Ahrweiler",
    anmeldung: "eintrittskarte",
  }),
  helfer("2027-01-13", "17:00", "Aufbau Sitzung"),
  helfer("2027-01-14", "17:00", "Aufbau Sitzung"),
  helfer("2027-01-15", "17:00", "Aufbau Sitzung"),
  t("2027-01-16", {
    titel: "Prunksitzung Heimersheim",
    treffzeit: "18:30",
    beginn: "19:11",
    treffpunkt: LF,
    veranstalter: "KG Heimersheim",
    art: "intern",
  }),
  t("2027-01-17", {
    titel: "Kindersitzung Heimersheim",
    treffzeit: "13:45",
    beginn: "14:11",
    treffpunkt: LF,
    veranstalter: "KG Heimersheim",
    art: "intern",
    gruppen: ["prinz", "familie"],
  }),
  helfer("2027-01-20", "17:00", "Aufbau Prinzenball"),
  t("2027-01-20", {
    titel: "Empfang VR Bank Hauptstelle",
    treffzeit: "19:00",
    treffpunkt: "Geschäftsstelle Bad Neuenahr",
    veranstalter: "VR Bank",
    anmeldung: "voranmeldung",
  }),
  helfer("2027-01-21", "17:00", "Aufbau Prinzenball"),
  t("2027-01-21", {
    titel: "Seniorennachmittag",
    beginn: "15:30",
    ort: "Container Heimersheim",
    quelle: ["eigen"],
  }),
  t("2027-01-22", {
    titel: "Prunksitzung + Proklamation Walporzheim",
    treffzeit: "18:30",
    beginn: "19:33",
    treffpunkt: "Festzelt Walporzheim",
    anmeldung: "eintrittskarte",
  }),
  t("2027-01-23", {
    titel: "Prinzenball",
    treffzeit: "18:30",
    beginn: "19:11",
    treffpunkt: LF,
    veranstalter: "KG Heimersheim",
    art: "intern",
    umfang: "alle",
    gruppen: ["familie"],
  }),
  t("2027-01-24", {
    titel: "Seniorensitzung Heimersheim",
    treffzeit: "14:00",
    treffpunkt: LF,
    veranstalter: "KG Heimersheim",
    art: "intern",
    umfang: "alle",
    gruppen: [],
  }),
  t("2027-01-27", {
    titel: "Tollitätentreff FAK",
    beginn: "18:30",
    veranstalter: "FAK",
    gruppen: PV,
    pruefen: "Treffpunkt im KG-Plan leer",
  }),
  t("2027-01-28", {
    titel: "Prinzenempfang Stadtanzeiger",
    beginn: "14:30",
    ort: "Wilhelmstr. 17",
    veranstalter: "Stadtanzeiger",
    quelle: ["eigen"],
  }),
  t("2027-01-29", {
    titel: "Krankenhaussitzung",
    treffpunkt: "Festzelt Walporzheim",
    pruefen: "Uhrzeit fehlt im KG-Plan",
  }),
  t("2027-01-29", {
    titel: "Prunksitzung Bad Neuenahr",
    treffzeit: "18:30",
    beginn: "19:00",
    treffpunkt: "Festzelt Bad Neuenahr",
    anmeldung: "eintrittskarte",
  }),
  t("2027-01-30", {
    titel: "Umzug Bachem",
    treffzeit: "14:30",
    beginn: "15:11",
    treffpunkt: "Bachem Winzerverein",
    umfang: "alle",
    gruppen: [],
  }),
  t("2027-01-30", {
    titel: "Empfang Christoph Schäfer",
    treffzeit: "17:00",
    treffpunkt: "Dornröschen",
    umfang: "alle",
    gruppen: [],
    status: "vorbehalt",
    pruefen: "Status im KG-Plan leer",
  }),
  t("2027-01-31", {
    titel: "Umzug Bad Neuenahr",
    treffzeit: "13:15",
    beginn: "14:11",
    treffpunkt: "Roter Platz",
    umfang: "alle",
    gruppen: [],
    bemerkung: "Prinz steht bei der Metzgerei Albrecht",
  }),

  // ───────────── Februar 2027 ─────────────
  t("2027-02-02", {
    titel: "Karnevalsmesse",
    treffzeit: "18:00",
    beginn: "18:30",
    treffpunkt: "Kirche Heimersheim",
    art: "intern",
    umfang: "alle",
    gruppen: [],
    pruefen: "Datum im KG-Plan verdruckt („Di. 0210.02“) – 02.02. angenommen",
  }),
  ...["Hagedorn", "Calvarienberg Realschule", "PJG"].map((titel) =>
    t("2027-02-03", {
      titel,
      tagesprogramm: "Besuche",
      status: "vorbehalt",
      pruefen: "Uhrzeit noch offen",
    }),
  ),
  t("2027-02-03", { titel: "Levana Schule", beginn: "13:30", tagesprogramm: "Besuche", status: "vorbehalt" }),
  t("2027-02-03", { titel: "Puya Sinzig", beginn: "15:30", tagesprogramm: "Besuche", status: "vorbehalt" }),
  t("2027-02-03", {
    titel: "Sitzung Augustinum",
    treffzeit: "18:00",
    beginn: "19:00",
    treffpunkt: "Augustinum",
    umfang: "alle",
    gruppen: [],
    bemerkung: "Einmarsch 19:00",
  }),

  // Weiberdonnerstag
  ...(
    [
      ["08:30", "Schule Heimersheim"],
      ["09:30", "Städt. Kiga Heimersheim"],
      ["10:30", "Kath. Kiga Heimersheim"],
      ["11:15", "Kindergarten Gimmigen"],
    ] as const
  ).map(([zeit, titel]) =>
    t("2027-02-04", { titel, beginn: zeit, tagesprogramm: "Weiberdonnerstag", status: "vorbehalt" }),
  ),
  t("2027-02-04", {
    titel: "Rundfahrt Bus",
    treffzeit: "11:45",
    beginn: "12:00",
    treffpunkt: "Roter Platz",
    tagesprogramm: "Weiberdonnerstag",
    status: "vorbehalt",
    umfang: "alle",
    gruppen: [],
    hinweis: "Abfahrt 12:00 Uhr!",
  }),
  ...(
    [
      ["12:30", "Frutania Grafschaft", null],
      ["13:45", "Maranatha", null],
      ["14:30", "Klinik Dr. Külz", null],
      ["15:00", "Stadtverwaltung Mitarbeiterparty", null],
      ["16:15", "St. Martin Ahrweiler", "KG-Plan: 16:00/16:15"],
      ["17:00", "Möhnen Bölingen", null],
      ["18:00", "Möhnen Gimmigen", null],
      ["19:15", "Möhnen Heimersheim", null],
    ] as const
  ).map(([zeit, titel, pruefen]) =>
    t("2027-02-04", {
      titel,
      beginn: zeit,
      ort: titel === "Möhnen Heimersheim" ? LF : null,
      tagesprogramm: "Weiberdonnerstag",
      status: "vorbehalt",
      umfang: "alle",
      gruppen: [],
      bemerkung: "mit dem Bus",
      pruefen,
    }),
  ),

  // Freitag
  helfer("2027-02-05", "10:00", "Vorbereitung Afterzochparty"),
  t("2027-02-05", {
    titel: "Besuch Hospiz",
    treffzeit: "16:00",
    treffpunkt: "Hospiz",
    status: "vorbehalt",
  }),
  t("2027-02-05", {
    titel: "Besuch Horst Albrecht",
    treffzeit: "17:00",
    treffpunkt: "Bad Neuenahr",
    status: "vorbehalt",
    umfang: "alle",
    gruppen: [],
  }),
  t("2027-02-05", {
    titel: "Gemeinschaftssitzung Ahrweiler",
    treffzeit: "19:00",
    treffpunkt: "Ahrweiler",
    ort: "Bürgerzentrum Ahrweiler",
    umfang: "alle",
    gruppen: [],
  }),

  // Karnevalssamstag – Umzug im Ort
  t("2027-02-06", {
    id: "2027-02-06-festzug",
    titel: "Festzug durchs Dorf zum Aufstellplatz",
    treffzeit: "13:00",
    beginn: "14:11",
    treffpunkt: "Westtor",
    tagesprogramm: "Karnevalsumzug",
    art: "intern",
    umfang: "alle",
    gruppen: ["familie"],
    bemerkung: "Zoch 14:11",
  }),
  t("2027-02-06", {
    titel: "Afterzoochparty",
    anschluss_an: "2027-02-06-festzug",
    treffpunkt: LF,
    tagesprogramm: "Karnevalsumzug",
    art: "intern",
    umfang: "alle",
    gruppen: ["familie"],
  }),

  // Karnevalssonntag
  t("2027-02-07", {
    titel: "Zooch Walporzheim",
    treffzeit: "14:00",
    beginn: "15:11",
    treffpunkt: "Roter Platz",
    tagesprogramm: "Karnevalssonntag",
    umfang: "alle",
    gruppen: [],
  }),

  // Rosenmontag
  t("2027-02-08", {
    id: "2027-02-08-karnevalseroeffnung-ahrweiler",
    titel: "Karnevalseröffnung Ahrweiler",
    treffzeit: "10:30",
    beginn: "11:11",
    treffpunkt: "Roter Platz",
    tagesprogramm: "Rosenmontag",
    umfang: "alle",
    gruppen: [],
  }),
  t("2027-02-08", {
    titel: "Essen Eifelstube",
    anschluss_an: "2027-02-08-karnevalseroeffnung-ahrweiler",
    ort: "Eifelstube",
    tagesprogramm: "Rosenmontag",
    umfang: "alle",
    gruppen: [],
    status: "vorbehalt",
  }),
  t("2027-02-08", {
    titel: "Zooch Ahrweiler",
    beginn: "14:11",
    treffpunkt: "im Anschluss",
    tagesprogramm: "Rosenmontag",
    umfang: "alle",
    gruppen: [],
  }),

  // Veilchendienstag
  ...(
    [
      ["10:30", "Empfang KSK", "KSK Heimersheim"],
      ["11:30", "Empfang Volksbank", "Volksbank Heimersheim"],
      ["13:00", "Bürgermeisterempfang", "Rathaus"],
      ["15:00", "Weingut O. Schell", "Rech"],
      ["16:30", "Braun Spirituosen", "Heimersheim"],
      ["17:30", "Abschluss Weingut Nelles", "Heimersheim"],
    ] as const
  ).map(([zeit, titel, treffpunkt]) =>
    t("2027-02-09", {
      titel,
      treffzeit: zeit,
      treffpunkt,
      tagesprogramm: "Veilchendienstag",
      status: "vorbehalt",
      umfang: "alle",
      gruppen: [],
    }),
  ),

  // Aschermittwoch
  helfer("2027-02-10", "10:00", "Abschmücken beim Prinz und Festhalle", "beim Prinz / Halle", {
    tagesprogramm: "Aschermittwoch",
  }),
  t("2027-02-10", {
    titel: "Fischessen",
    treffzeit: "19:00",
    treffpunkt: "Köhlerhof",
    tagesprogramm: "Aschermittwoch",
    art: "intern",
    anmeldung: "voranmeldung",
  }),
];

const vergeben = new Set<string>();

export const startTermine: Termin[] = roh.map((r) => {
  const basis = r.id ?? `${r.datum}-${slug(r.titel)}`;
  let id = basis;
  for (let n = 2; vergeben.has(id); n++) id = `${basis}-${n}`;
  vergeben.add(id);
  return { ...r, id, gruppen: [...r.gruppen] };
});
