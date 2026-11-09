// Erzeugt iCalendar-Dateien (RFC 5545) für Kalender-Abos.
// Funktioniert mit Apple Kalender, Google Kalender, Outlook, Thunderbird usw.

import { ANMELDUNG, ART, personenBedarf, STATUS, werText } from "./labels";
import { adresseText } from "./adresse";
import type { Daten, Termin } from "./types";
import { naechsterTag, verschiebe, zeitplan, ZEITZONE } from "./zeit";

const UID_DOMAIN = "prinzen-kalender";

/** Text-Werte escapen (RFC 5545, 3.3.11) */
function text(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Zeilen nach 75 Oktetts umbrechen, ohne UTF-8-Zeichen zu zerschneiden. */
function falte(zeile: string): string {
  const enc = new TextEncoder();
  if (enc.encode(zeile).length <= 75) return zeile;
  const teile: string[] = [];
  let aktuell = "";
  let laenge = 0;
  for (const ch of zeile) {
    const l = enc.encode(ch).length;
    const max = teile.length === 0 ? 75 : 74; // Folgezeilen beginnen mit Leerzeichen
    if (laenge + l > max) {
      teile.push(aktuell);
      aktuell = "";
      laenge = 0;
    }
    aktuell += ch;
    laenge += l;
  }
  teile.push(aktuell);
  return teile.join("\r\n ");
}

function lokal(datum: string, zeit: string): string {
  return `${datum.replace(/-/g, "")}T${zeit.replace(":", "")}00`;
}

function utcStempel(d = new Date()): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${ZEITZONE}`,
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

export function beschreibung(t: Termin, daten: Daten, link?: string): string {
  const z: string[] = [];
  if (t.treffzeit || t.treffpunkt)
    z.push(`Treffen: ${[t.treffzeit, t.treffpunkt].filter(Boolean).join(" – ")}`);
  if (t.anschluss_an) {
    const v = daten.termine.find((x) => x.id === t.anschluss_an);
    z.push(`Im Anschluss${v ? ` an: ${v.titel}` : ""}`);
  }
  if (t.beginn || t.ort) z.push(`Beginn: ${[t.beginn, t.ort].filter(Boolean).join(" – ")}`);
  const adresse = adresseText(t);
  if (adresse) z.push(`Adresse: ${adresse}`);
  if (t.veranstalter) z.push(`Veranstalter: ${t.veranstalter}`);
  z.push(`Wer: ${werText(t, daten.gruppen)}`);
  if (t.anmeldung) {
    const b = personenBedarf(t, daten.gruppen);
    z.push(
      `${ANMELDUNG[t.anmeldung].label}: ${b.summe}${b.ohneAngabe.length ? "+" : ""} Personen` +
        (t.karten_bestellt != null ? ` (bestellt: ${t.karten_bestellt})` : ""),
    );
  }
  if (t.status === "vorbehalt") z.push(`Status: ${STATUS.vorbehalt}`);
  if (t.hinweis) z.push(`Wichtig: ${t.hinweis}`);
  if (t.bemerkung) z.push(t.bemerkung);
  if (link) z.push("", link);
  return z.join("\n");
}

export function kalender(
  termine: Termin[],
  opts: { name: string; basisUrl?: string; daten: Daten },
): string {
  const plan = zeitplan(opts.daten.termine);
  const stempel = utcStempel();

  const zeilen = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sessionskalender//Session 2026-27//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${text(opts.name)}`,
    `X-WR-TIMEZONE:${ZEITZONE}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    ...VTIMEZONE,
  ];

  for (const t of termine) {
    const z = plan.get(t.id);
    const link = opts.basisUrl ? `${opts.basisUrl}/termin/${encodeURIComponent(t.id)}` : undefined;
    const titel = [
      t.status === "vorbehalt" ? "(vorb.)" : null,
      t.tagesprogramm ? `${t.tagesprogramm}: ${t.titel}` : t.titel,
      t.anmeldung ? `(${ANMELDUNG[t.anmeldung].kurz})` : null,
    ]
      .filter(Boolean)
      .join(" ");
    // Mit Adresse: Veranstaltungsort mit Adresse (Karten-Apps finden ihn genau), sonst Treffpunkt → Ort
    const adresse = adresseText(t);
    const ort = adresse
      ? [t.ort ?? t.treffpunkt, adresse].filter(Boolean).join(", ")
      : [t.treffpunkt && t.treffpunkt !== "im Anschluss" ? t.treffpunkt : null, t.ort].filter(Boolean).join(" → ");

    zeilen.push("BEGIN:VEVENT", `UID:${t.id}@${UID_DOMAIN}`, `DTSTAMP:${stempel}`);
    if (!z || z.ganztags || z.start === null || z.ende === null) {
      zeilen.push(
        `DTSTART;VALUE=DATE:${t.datum.replace(/-/g, "")}`,
        `DTEND;VALUE=DATE:${naechsterTag(t.datum).replace(/-/g, "")}`,
      );
    } else {
      const s = verschiebe(t.datum, z.start);
      const e = verschiebe(t.datum, z.ende);
      zeilen.push(
        `DTSTART;TZID=${ZEITZONE}:${lokal(s.datum, s.zeit)}`,
        `DTEND;TZID=${ZEITZONE}:${lokal(e.datum, e.zeit)}`,
      );
    }
    zeilen.push(
      `SUMMARY:${text(titel)}`,
      `DESCRIPTION:${text(beschreibung(t, opts.daten, link))}`,
      `STATUS:${t.status === "vorbehalt" ? "TENTATIVE" : "CONFIRMED"}`,
      `CATEGORIES:${text(ART[t.art])}`,
      "TRANSP:OPAQUE",
    );
    if (ort) zeilen.push(`LOCATION:${text(ort)}`);
    if (link) zeilen.push(`URL:${link}`);
    zeilen.push("END:VEVENT");
  }

  zeilen.push("END:VCALENDAR");
  return zeilen.map(falte).join("\r\n") + "\r\n";
}
