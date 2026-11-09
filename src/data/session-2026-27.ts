// Startdaten Session 2026/27.
// Zusammengeführt aus dem Terminplan der KG Heimersheim (Fotos) und der eigenen
// Liste "05_Termine_Session_26-27.xlsx".
//
// Regeln beim Übertragen:
// - KG-Plan "Uhrzeit" + "Treffpunkt"  -> treffzeit / treffpunkt
//   (ohne Treffpunkt ist die Uhrzeit die Zeit vor Ort -> beginn)
// - "Beginn 19:11" aus dem Veranstaltungstext -> beginn
// - Teilnahme-Spalte: Kästchen -> abfrage, "Nur Prinz + Vorstand" -> vorstand,
//   "Alle" -> alle, "Jeder Verfügbare" -> helfer
// - Termine nur aus der eigenen Liste -> besetzung "wir"
// - Unstimmigkeiten zwischen den Listen stehen im Feld `pruefen`.
//
// Diese Datei ist nur der Startbestand. Mit `npm run seed:sql` wird daraus
// supabase/seed.sql erzeugt; danach wird in Supabase gepflegt.

import type { Termin } from "../lib/types";

type Eingabe = Partial<Omit<Termin, "id" | "datum" | "titel">> & {
  titel: string;
  id?: string;
};

const LF = "Landskroner Festhalle";
const EINTRITTSKARTE = "Nur mit vorbestellter Eintrittskarte";

function t(datum: string, e: Eingabe): Omit<Termin, "id"> & { id?: string } {
  return {
    datum,
    treffzeit: null,
    beginn: null,
    einlass: null,
    ende: null,
    anschluss_an: null,
    tagesprogramm: null,
    veranstalter: null,
    treffpunkt: null,
    ort: null,
    kategorie: "sonstiges",
    status: "bestaetigt",
    besetzung: "abfrage",
    familie: false,
    fahrt: "auto",
    fahrt_details: null,
    fahrer: null,
    hinweis: null,
    bemerkung: null,
    quelle: ["kg"],
    pruefen: null,
    ...e,
  };
}

/** Arbeitseinsatz "Jeder Verfügbare (Viele Hände …)" */
function helfer(datum: string, zeit: string, titel: string, treffpunkt = LF) {
  return t(datum, {
    titel,
    treffzeit: zeit,
    treffpunkt,
    kategorie: "arbeitseinsatz",
    besetzung: "helfer",
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
    einlass: "17:33",
    beginn: "19:11",
    treffpunkt: LF,
    veranstalter: "KG Heimersheim",
    kategorie: "proklamation",
    familie: true,
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
    kategorie: "feier",
    fahrt: "abholung",
    fahrt_details: "Abholung durch Funken 10:30 beim Sepp",
    quelle: ["kg", "eigen"],
    pruefen:
      "KG-Plan: Treffpunkt 10:30 Roter Platz – eigene Liste: Abholung durch Funken 10:30 beim Sepp",
  }),
  t("2026-11-08", {
    titel: "FAK Eröffnungsparty",
    anschluss_an: "2026-11-08-sessionseroeffnung",
    treffpunkt: LF,
    veranstalter: "FAK",
    kategorie: "feier",
  }),
  helfer("2026-11-09", "18:00", "Abbau"),
  t("2026-11-11", {
    titel: "Terminabsprache",
    beginn: "18:00",
    veranstalter: "Reni",
    ort: "bei Reni",
    kategorie: "intern",
    besetzung: "wir",
    quelle: ["eigen"],
    pruefen: "Uhrzeit in der eigenen Liste unleserlich – 18:00 angenommen",
  }),
  t("2026-11-12", {
    titel: "Corpstreffen",
    beginn: "21:30",
    veranstalter: "Corps à la Suite",
    ort: "Poststuben Heppingen",
    kategorie: "intern",
    besetzung: "wir",
    quelle: ["eigen"],
  }),
  t("2026-11-13", {
    titel: "Prinzenproklamation Bad Neuenahr",
    treffzeit: "18:30",
    beginn: "19:00",
    treffpunkt: "Häusje",
    ort: "Augustinum Bad Neuenahr",
    veranstalter: "K.G. Schinnebröder",
    kategorie: "proklamation",
    quelle: ["kg", "eigen"],
  }),
  t("2026-11-14", {
    titel: "Proklamation Ringen",
    beginn: "19:00",
    veranstalter: "Windböggele",
    ort: "Halle Ringen",
    kategorie: "proklamation",
    besetzung: "wir",
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
    kategorie: "feier",
    besetzung: "vorstand",
    quelle: ["kg", "eigen"],
    pruefen: "Eigene Liste: Datum 20.01.2026 – vermutlich Tippfehler für 20.11.",
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
    einlass: "17:45",
    beginn: "19:00",
    treffpunkt: "Häusje",
    ort: "Bürgerzentrum Ahrweiler",
    veranstalter: "Ahrweiler K.G.",
    kategorie: "proklamation",
    quelle: ["kg", "eigen"],
    pruefen: "Beginn laut KG-Plan 19:00 – eigene Liste: 19:11",
  }),
  helfer("2026-11-26", "18:00", "Aufbau Weihnachtsmärktchen", "Mühle"),
  helfer("2026-11-27", "18:00", "Aufbau Weihnachtsmärktchen", "Mühle"),
  helfer("2026-11-28", "10:00", "Aufbau Weihnachtsmärktchen", "Mühle"),
  t("2026-11-28", {
    titel: "Weihnachtsmärktchen",
    treffzeit: "15:00",
    treffpunkt: "Offergelds Mühle",
    veranstalter: "KG Heimersheim",
    kategorie: "feier",
    besetzung: "helfer",
    familie: true,
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
    fahrt: "offen",
    quelle: ["kg", "eigen"],
    pruefen: "KG-Plan: 17:00 Firma Prinz – eigene Liste: 18:00 Fenster Schmitt",
  }),

  // ───────────── Januar 2027 ─────────────
  t("2027-01-02", {
    titel: "Prunksitzung Bachem",
    treffzeit: "18:30",
    beginn: "19:11",
    treffpunkt: "Bachem Winzerverein",
    kategorie: "sitzung",
    hinweis: EINTRITTSKARTE,
  }),
  t("2027-01-09", {
    titel: "Tollitätenabend Bad Neuenahr",
    beginn: "18:30",
    ort: "Bad Neuenahr",
    kategorie: "feier",
    besetzung: "vorstand",
    pruefen: "Treffpunkt im KG-Plan leer",
  }),
  t("2027-01-10", {
    titel: "Prunksitzung Ahrweiler",
    treffzeit: "14:00",
    beginn: "15:30",
    treffpunkt: "Bürgerzentrum Ahrweiler",
    kategorie: "sitzung",
    hinweis: EINTRITTSKARTE,
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
    kategorie: "sitzung",
  }),
  t("2027-01-17", {
    titel: "Kindersitzung Heimersheim",
    treffzeit: "13:45",
    beginn: "14:11",
    treffpunkt: LF,
    veranstalter: "KG Heimersheim",
    kategorie: "sitzung",
    familie: true,
  }),
  helfer("2027-01-20", "17:00", "Aufbau Prinzenball"),
  t("2027-01-20", {
    titel: "Empfang VR Bank Hauptstelle",
    treffzeit: "19:00",
    treffpunkt: "Geschäftsstelle Bad Neuenahr",
    veranstalter: "VR Bank",
    kategorie: "empfang",
    hinweis: "Nur mit Voranmeldung",
  }),
  helfer("2027-01-21", "17:00", "Aufbau Prinzenball"),
  t("2027-01-21", {
    titel: "Seniorennachmittag",
    beginn: "15:30",
    ort: "Container Heimersheim",
    status: "vorbehalt",
    besetzung: "wir",
    quelle: ["eigen"],
    pruefen:
      "Eigene Liste: „So. 21.01.2027“ – der 21.01. ist ein Donnerstag. Evtl. So. 24.01. gemeint (KG-Plan: Seniorensitzung 14:00 Festhalle)?",
  }),
  t("2027-01-22", {
    titel: "Prunksitzung + Proklamation Walporzheim",
    treffzeit: "18:30",
    beginn: "19:33",
    treffpunkt: "Festzelt Walporzheim",
    kategorie: "sitzung",
    hinweis: EINTRITTSKARTE,
  }),
  t("2027-01-23", {
    titel: "Prinzenball",
    treffzeit: "18:30",
    beginn: "19:11",
    treffpunkt: LF,
    veranstalter: "KG Heimersheim",
    kategorie: "feier",
    besetzung: "alle",
    familie: true,
  }),
  t("2027-01-24", {
    titel: "Seniorensitzung Heimersheim",
    treffzeit: "14:00",
    treffpunkt: LF,
    veranstalter: "KG Heimersheim",
    kategorie: "sitzung",
    besetzung: "alle",
  }),
  t("2027-01-27", {
    titel: "Tollitätentreff FAK",
    beginn: "18:30",
    veranstalter: "FAK",
    kategorie: "feier",
    besetzung: "vorstand",
    pruefen: "Treffpunkt im KG-Plan leer",
  }),
  t("2027-01-28", {
    titel: "Prinzenempfang Stadtanzeiger",
    beginn: "14:30",
    ort: "Wilhelmstr. 17",
    veranstalter: "Stadtanzeiger",
    kategorie: "empfang",
    besetzung: "wir",
    quelle: ["eigen"],
  }),
  t("2027-01-29", {
    titel: "Krankenhaussitzung",
    treffpunkt: "Festzelt Walporzheim",
    kategorie: "sitzung",
    pruefen: "Uhrzeit fehlt im KG-Plan",
  }),
  t("2027-01-29", {
    titel: "Prunksitzung Bad Neuenahr",
    treffzeit: "18:30",
    beginn: "19:00",
    treffpunkt: "Festzelt Bad Neuenahr",
    kategorie: "sitzung",
    hinweis: EINTRITTSKARTE,
  }),
  t("2027-01-30", {
    titel: "Umzug Bachem",
    treffzeit: "14:30",
    beginn: "15:11",
    treffpunkt: "Bachem Winzerverein",
    kategorie: "umzug",
    besetzung: "alle",
  }),
  t("2027-01-30", {
    titel: "Empfang Christoph Schäfer",
    treffzeit: "17:00",
    treffpunkt: "Dornröschen",
    kategorie: "empfang",
    besetzung: "alle",
    status: "vorbehalt",
    pruefen: "Status im KG-Plan leer",
  }),
  t("2027-01-31", {
    titel: "Umzug Bad Neuenahr",
    treffzeit: "13:15",
    beginn: "14:11",
    treffpunkt: "Roter Platz",
    kategorie: "umzug",
    besetzung: "alle",
    bemerkung: "Prinz steht bei der Metzgerei Albrecht",
  }),

  // ───────────── Februar 2027 ─────────────
  t("2027-02-02", {
    titel: "Karnevalsmesse",
    treffzeit: "18:00",
    beginn: "18:30",
    treffpunkt: "Kirche Heimersheim",
    besetzung: "alle",
    pruefen: "Datum im KG-Plan verdruckt („Di. 0210.02“) – 02.02. angenommen",
  }),
  ...["Hagedorn", "Calvarienberg Realschule", "PJG"].map((titel) =>
    t("2027-02-03", {
      titel: `Besuch ${titel}`,
      kategorie: "besuch",
      status: "vorbehalt",
      pruefen: "Uhrzeit noch offen",
    }),
  ),
  t("2027-02-03", {
    titel: "Besuch Levana Schule",
    beginn: "13:30",
    kategorie: "besuch",
    status: "vorbehalt",
  }),
  t("2027-02-03", {
    titel: "Besuch Puya Sinzig",
    beginn: "15:30",
    kategorie: "besuch",
    status: "vorbehalt",
  }),
  t("2027-02-03", {
    titel: "Sitzung Augustinum",
    treffzeit: "18:00",
    beginn: "19:00",
    treffpunkt: "Augustinum",
    kategorie: "sitzung",
    besetzung: "alle",
    bemerkung: "Einmarsch 19:00",
  }),

  // Weiberdonnerstag
  ...(
    [
      ["08:30", "Schule Heimersheim", "abfrage", "auto"],
      ["09:30", "Städt. Kiga Heimersheim", "abfrage", "auto"],
      ["10:30", "Kath. Kiga Heimersheim", "abfrage", "auto"],
      ["11:15", "Kindergarten Gimmigen", "abfrage", "auto"],
    ] as const
  ).map(([zeit, titel, besetzung, fahrt]) =>
    t("2027-02-04", {
      titel,
      beginn: zeit,
      tagesprogramm: "Weiberdonnerstag",
      kategorie: "besuch",
      status: "vorbehalt",
      besetzung,
      fahrt,
    }),
  ),
  t("2027-02-04", {
    titel: "Rundfahrt Bus",
    treffzeit: "11:45",
    beginn: "12:00",
    treffpunkt: "Roter Platz",
    tagesprogramm: "Weiberdonnerstag",
    kategorie: "besuch",
    status: "vorbehalt",
    besetzung: "alle",
    fahrt: "bus",
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
      kategorie: "besuch",
      status: "vorbehalt",
      besetzung: "alle",
      fahrt: "bus",
      pruefen,
    }),
  ),

  // Freitag
  t("2027-02-05", {
    titel: "Vorbereitung Afterzochparty",
    treffzeit: "10:00",
    treffpunkt: LF,
    kategorie: "arbeitseinsatz",
    besetzung: "helfer",
  }),
  t("2027-02-05", {
    titel: "Besuch Hospiz",
    treffzeit: "16:00",
    treffpunkt: "Hospiz",
    kategorie: "besuch",
    status: "vorbehalt",
  }),
  t("2027-02-05", {
    titel: "Besuch Horst Albrecht",
    treffzeit: "17:00",
    treffpunkt: "Bad Neuenahr",
    kategorie: "besuch",
    status: "vorbehalt",
    besetzung: "alle",
  }),
  t("2027-02-05", {
    titel: "Gemeinschaftssitzung Ahrweiler",
    treffzeit: "19:00",
    treffpunkt: "Ahrweiler",
    ort: "Bürgerzentrum Ahrweiler",
    kategorie: "sitzung",
    besetzung: "alle",
  }),

  // Karnevalssamstag – Umzug im Ort
  t("2027-02-06", {
    id: "2027-02-06-festzug",
    titel: "Festzug durchs Dorf zum Aufstellplatz",
    treffzeit: "13:00",
    beginn: "14:11",
    treffpunkt: "Westtor",
    tagesprogramm: "Karnevalsumzug",
    kategorie: "umzug",
    besetzung: "alle",
    familie: true,
    fahrt: "zu_fuss",
    bemerkung: "Zoch 14:11",
  }),
  t("2027-02-06", {
    titel: "Afterzoochparty",
    anschluss_an: "2027-02-06-festzug",
    treffpunkt: LF,
    tagesprogramm: "Karnevalsumzug",
    kategorie: "feier",
    besetzung: "alle",
    familie: true,
    fahrt: "zu_fuss",
  }),

  // Karnevalssonntag
  t("2027-02-07", {
    titel: "Zooch Walporzheim",
    treffzeit: "14:00",
    beginn: "15:11",
    treffpunkt: "Roter Platz",
    tagesprogramm: "Karnevalssonntag",
    kategorie: "umzug",
    besetzung: "alle",
  }),

  // Rosenmontag
  t("2027-02-08", {
    id: "2027-02-08-karnevalseroeffnung-ahrweiler",
    titel: "Karnevalseröffnung Ahrweiler",
    treffzeit: "10:30",
    beginn: "11:11",
    treffpunkt: "Roter Platz",
    tagesprogramm: "Rosenmontag",
    kategorie: "feier",
    besetzung: "alle",
  }),
  t("2027-02-08", {
    titel: "Essen Eifelstube",
    anschluss_an: "2027-02-08-karnevalseroeffnung-ahrweiler",
    ort: "Eifelstube",
    tagesprogramm: "Rosenmontag",
    kategorie: "feier",
    besetzung: "alle",
    status: "vorbehalt",
  }),
  t("2027-02-08", {
    titel: "Zooch Ahrweiler",
    beginn: "14:11",
    treffpunkt: "im Anschluss",
    tagesprogramm: "Rosenmontag",
    kategorie: "umzug",
    besetzung: "alle",
  }),

  // Veilchendienstag
  ...(
    [
      ["10:30", "Empfang KSK", "KSK Heimersheim", "empfang"],
      ["11:30", "Empfang Volksbank", "Volksbank Heimersheim", "empfang"],
      ["13:00", "Bürgermeisterempfang", "Rathaus", "empfang"],
      ["15:00", "Weingut O. Schell", "Rech", "besuch"],
      ["16:30", "Braun Spirituosen", "Heimersheim", "besuch"],
      ["17:30", "Abschluss Weingut Nelles", "Heimersheim", "feier"],
    ] as const
  ).map(([zeit, titel, treffpunkt, kategorie]) =>
    t("2027-02-09", {
      titel,
      treffzeit: zeit,
      treffpunkt,
      tagesprogramm: "Veilchendienstag",
      kategorie,
      status: "vorbehalt",
      besetzung: "alle",
    }),
  ),

  // Aschermittwoch
  t("2027-02-10", {
    titel: "Abschmücken beim Prinz und Festhalle",
    treffzeit: "10:00",
    treffpunkt: "beim Prinz / Halle",
    tagesprogramm: "Aschermittwoch",
    kategorie: "arbeitseinsatz",
    besetzung: "helfer",
  }),
  t("2027-02-10", {
    titel: "Fischessen",
    treffzeit: "19:00",
    treffpunkt: "Köhlerhof",
    tagesprogramm: "Aschermittwoch",
    kategorie: "feier",
    hinweis: "Nur mit Voranmeldung",
  }),
];

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const vergeben = new Set<string>();

export const startTermine: Termin[] = roh.map((r) => {
  const basis = r.id ?? `${r.datum}-${slug(r.titel)}`;
  let id = basis;
  for (let n = 2; vergeben.has(id); n++) id = `${basis}-${n}`;
  vergeben.add(id);
  return { ...r, id };
});
