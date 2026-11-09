"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BEARBEITEN_COOKIE, bearbeitenToken, darfBearbeiten } from "@/lib/bearbeiten";
import {
  ladeDaten,
  loescheGruppe,
  loescheTermin,
  speichereGruppe,
  speichereTermin,
  speichernMoeglich,
} from "@/lib/daten";
import { istFarbe } from "@/lib/labels";
import { slug } from "@/lib/slug";
import type { Anmeldung, Art, Gruppe, Status, Termin, Umfang } from "@/lib/types";

// Jede Aktion prüft selbst das Bearbeiten-Recht – Server Actions sind auch
// direkt per POST erreichbar.
async function pruefeRecht() {
  if (!(await darfBearbeiten())) throw new Error("Keine Berechtigung zum Bearbeiten.");
  const ok = speichernMoeglich();
  if (ok !== true) throw new Error(ok);
}

function text(fd: FormData, name: string): string | null {
  const v = fd.get(name);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function zahl(fd: FormData, name: string): number | null {
  const v = text(fd, name);
  if (v === null) return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

function uhrzeit(fd: FormData, name: string): string | null {
  const v = text(fd, name);
  if (v === null) return null;
  const m = /^(\d{1,2})[:.](\d{2})/.exec(v);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) throw new Error(`Ungültige Uhrzeit bei „${name}“: ${v}`);
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

function auswahl<T extends string>(fd: FormData, name: string, erlaubt: readonly T[], standard: T): T {
  const v = fd.get(name);
  return erlaubt.includes(v as T) ? (v as T) : standard;
}

// ───────────── Anmelden ─────────────

export async function anmelden(fd: FormData) {
  const token = bearbeitenToken();
  if (token && fd.get("passwort") === token) {
    (await cookies()).set(BEARBEITEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
    });
    redirect("/verwaltung");
  }
  redirect("/verwaltung?fehler=passwort");
}

export async function abmelden() {
  (await cookies()).delete(BEARBEITEN_COOKIE);
  redirect("/verwaltung");
}

// ───────────── Termine ─────────────

export async function terminSpeichern(fd: FormData) {
  await pruefeRecht();
  const daten = await ladeDaten();

  const datum = text(fd, "datum");
  const titel = text(fd, "titel");
  if (!datum || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) throw new Error("Bitte ein gültiges Datum angeben.");
  if (!titel) throw new Error("Bitte einen Titel angeben.");

  const vorhanden = text(fd, "id");
  const alt = vorhanden ? daten.termine.find((t) => t.id === vorhanden) : undefined;
  let id = alt?.id;
  if (!id) {
    const basis = `${datum}-${slug(titel)}`;
    id = basis;
    for (let n = 2; daten.termine.some((t) => t.id === id); n++) id = `${basis}-${n}`;
  }

  const gruppenIds = new Set(daten.gruppen.map((g) => g.id));
  const anschluss = text(fd, "anschluss_an");

  const termin: Termin = {
    id,
    datum,
    treffzeit: uhrzeit(fd, "treffzeit"),
    treffpunkt: text(fd, "treffpunkt"),
    beginn: uhrzeit(fd, "beginn"),
    ort: text(fd, "ort"),
    ende: uhrzeit(fd, "ende"),
    anschluss_an: anschluss && anschluss !== id && daten.termine.some((t) => t.id === anschluss) ? anschluss : null,
    titel,
    tagesprogramm: text(fd, "tagesprogramm"),
    veranstalter: text(fd, "veranstalter"),
    art: auswahl<Art>(fd, "art", ["intern", "extern"], "extern"),
    status: auswahl<Status>(fd, "status", ["bestaetigt", "vorbehalt"], "bestaetigt"),
    umfang: auswahl<Umfang>(fd, "umfang", ["auswahl", "alle", "jeder_verfuegbare"], "auswahl"),
    gruppen: fd
      .getAll("gruppen")
      .filter((g): g is string => typeof g === "string" && gruppenIds.has(g)),
    anmeldung: (() => {
      const a = fd.get("anmeldung");
      return a === "eintrittskarte" || a === "voranmeldung" ? (a as Anmeldung) : null;
    })(),
    karten_bestellt: zahl(fd, "karten_bestellt"),
    hinweis: text(fd, "hinweis"),
    bemerkung: text(fd, "bemerkung"),
    quelle: alt?.quelle ?? [],
    pruefen: text(fd, "pruefen"),
  };

  await speichereTermin(termin);
  redirect(`/termin/${encodeURIComponent(id)}`);
}

export async function terminLoeschen(fd: FormData) {
  await pruefeRecht();
  const id = text(fd, "id");
  if (id) await loescheTermin(id);
  redirect("/verwaltung");
}

// ───────────── Gruppen ─────────────

/** Diese Schlüssel sind schon Filter-Namen und dürfen keine Gruppen-ID sein. */
const RESERVIERT = new Set(["alle", "karten", "intern", "extern"]);

export async function gruppeSpeichern(fd: FormData) {
  await pruefeRecht();
  const daten = await ladeDaten();

  const name = text(fd, "name");
  if (!name) throw new Error("Bitte einen Namen angeben.");
  const kuerzel = text(fd, "kuerzel") ?? name.slice(0, 3);

  const vorhanden = text(fd, "id");
  let id = vorhanden && daten.gruppen.some((g) => g.id === vorhanden) ? vorhanden : null;
  if (!id) {
    const basis = slug(name) || slug(kuerzel) || "gruppe";
    id = RESERVIERT.has(basis) ? `${basis}-gruppe` : basis;
    for (let n = 2; daten.gruppen.some((g) => g.id === id); n++) id = `${basis}-${n}`;
  }

  const farbe = fd.get("farbe");
  const gruppe: Gruppe = {
    id,
    kuerzel,
    name,
    beschreibung: text(fd, "beschreibung"),
    personen: zahl(fd, "personen"),
    farbe: istFarbe(farbe) ? farbe : "grau",
    in_alle: fd.get("in_alle") === "on",
    sortierung: zahl(fd, "sortierung") ?? (Math.max(0, ...daten.gruppen.map((g) => g.sortierung)) + 10),
  };

  await speichereGruppe(gruppe);
  redirect("/verwaltung/gruppen");
}

export async function gruppeLoeschen(fd: FormData) {
  await pruefeRecht();
  const id = text(fd, "id");
  if (id) await loescheGruppe(id);
  redirect("/verwaltung/gruppen");
}
