// Datenbank-Schema (Drizzle). Änderungen hier, dann `npm run db:generate` → neue Migration in drizzle/.
// Feldnamen in snake_case wie in der Datenbank; TypeScript-Namen in camelCase nur bei den Better-Auth-Tabellen,
// weil Better Auth diese Namen erwartet.

import { sql } from "drizzle-orm";
import {
  bytea,
  type AnyPgColumn,
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  time,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

const zeitstempel = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// ───────────── Kalender ─────────────

export const terminStatus = pgEnum("termin_status", ["bestaetigt", "vorbehalt"]);
export const terminArt = pgEnum("termin_art", ["intern", "extern"]);
export const terminUmfang = pgEnum("termin_umfang", ["auswahl", "alle"]);
export const terminAnmeldung = pgEnum("termin_anmeldung", ["eintrittskarte"]);
export const gruppenFarbe = pgEnum("gruppen_farbe", [
  "rot",
  "orange",
  "gelb",
  "gruen",
  "tuerkis",
  "blau",
  "lila",
  "pink",
  "grau",
]);

/** Gruppen (Prinz, Senat, Elferrat, Funken, …) – frei pflegbar */
export const gruppen = pgTable("gruppen", {
  id: text("id").primaryKey(),
  kuerzel: text("kuerzel").notNull(),
  name: text("name").notNull(),
  beschreibung: text("beschreibung"),
  personen: integer("personen"),
  farbe: gruppenFarbe("farbe").notNull().default("grau"),
  in_alle: boolean("in_alle").notNull().default(true),
  sortierung: integer("sortierung").notNull().default(0),
});

export const termine = pgTable(
  "termine",
  {
    id: text("id").primaryKey(),
    datum: date("datum", { mode: "string" }).notNull(),
    treffzeit: time("treffzeit"),
    treffpunkt: text("treffpunkt"),
    beginn: time("beginn"),
    ort: text("ort"),
    strasse: text("strasse"),
    plz: text("plz"),
    stadt: text("stadt"),
    ende: time("ende"),
    anschluss_an: text("anschluss_an").references((): AnyPgColumn => termine.id, { onDelete: "set null" }),
    titel: text("titel").notNull(),
    tagesprogramm: text("tagesprogramm"),
    veranstalter: text("veranstalter"),
    art: terminArt("art").notNull().default("extern"),
    status: terminStatus("status").notNull().default("bestaetigt"),
    umfang: terminUmfang("umfang").notNull().default("auswahl"),
    anmeldung: terminAnmeldung("anmeldung"),
    karten_bestellt: integer("karten_bestellt"),
    /** Abweichende Personenzahl je Gruppe nur für diesen Termin (Gruppen-ID → Anzahl) */
    /** Nur mit PIN sichtbar (z. B. Vorstandstermine) – nicht in der normalen Ansicht und nicht im normalen Abo */
    vertraulich: boolean("vertraulich").notNull().default(false),
    personen: jsonb("personen").$type<Record<string, number>>().notNull().default(sql`'{}'::jsonb`),
    hinweis: text("hinweis"),
    bemerkung: text("bemerkung"),
    quelle: text("quelle").array().notNull().default(sql`'{}'::text[]`),
    pruefen: text("pruefen"),
    erstellt_am: timestamp("erstellt_am", { withTimezone: true }).notNull().defaultNow(),
    geaendert_am: timestamp("geaendert_am", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("termine_datum_idx").on(t.datum)],
);

/** Darstellung der App (eine Zeile, id = "app"): Name, Unterzeile, Logo – in der Verwaltung änderbar */
export const einstellungen = pgTable("einstellungen", {
  id: text("id").primaryKey(),
  app_name: text("app_name").notNull(),
  untertitel: text("untertitel").notNull(),
  /** PNG 512×512 (weißer Hintergrund) und 144×144; null = mitgeliefertes Logo */
  logo: bytea("logo"),
  logo_klein: bytea("logo_klein"),
  /** Zählt bei jedem neuen Logo hoch – hängt als ?v= an den Bild-Adressen (kein altes Logo aus Zwischenspeichern) */
  logo_stand: integer("logo_stand").notNull().default(0),
  /** PIN für vertrauliche Termine (4–8 Ziffern); null = keine vertraulichen Termine freischaltbar.
   *  Bewusst lesbar gespeichert: die Verwaltung soll sie anzeigen und weitergeben können. */
  pin: text("pin"),
  /** Schlüssel für Push-Mitteilungen (VAPID) – beim ersten Gebrauch automatisch erzeugt */
  vapid_oeffentlich: text("vapid_oeffentlich"),
  vapid_privat: text("vapid_privat"),
  geaendert_am: timestamp("geaendert_am", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** Welche Gruppen sind bei einem Termin angekreuzt? */
export const terminGruppen = pgTable(
  "termin_gruppen",
  {
    termin_id: text("termin_id")
      .notNull()
      .references(() => termine.id, { onDelete: "cascade" }),
    gruppe_id: text("gruppe_id")
      .notNull()
      .references(() => gruppen.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.termin_id, t.gruppe_id] })],
);

/** Wer hat wann was geändert */
export const protokoll = pgTable(
  "protokoll",
  {
    id: serial("id").primaryKey(),
    zeitpunkt: timestamp("zeitpunkt", { withTimezone: true }).notNull().defaultNow(),
    benutzer_id: text("benutzer_id"),
    benutzer_name: text("benutzer_name"),
    aktion: text("aktion").notNull(),
    objekt_id: text("objekt_id"),
    titel: text("titel"),
    details: jsonb("details"),
  },
  (t) => [index("protokoll_zeitpunkt_idx").on(t.zeitpunkt), index("protokoll_objekt_idx").on(t.objekt_id)],
);

/** Einladungen und Passwort-Links für Administratoren (kein E-Mail-Versand nötig) */
export const einladungen = pgTable("einladungen", {
  id: text("id").primaryKey(), // zufälliges Token, steht im Link
  zweck: text("zweck").$type<"einladung" | "passwort">().notNull(),
  email: text("email").notNull(),
  name: text("name"),
  benutzer_id: text("benutzer_id"), // bei "passwort": wessen Passwort
  erstellt_von: text("erstellt_von"),
  erstellt_am: timestamp("erstellt_am", { withTimezone: true }).notNull().defaultNow(),
  laeuft_ab: timestamp("laeuft_ab", { withTimezone: true }).notNull(),
  eingeloest_am: timestamp("eingeloest_am", { withTimezone: true }),
});

// ───────────── Better Auth ─────────────
// Feldnamen wie von Better Auth erwartet (Kern + Passkey-Plugin + Rate-Limit in der Datenbank).

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  /** "superadmin" (genau einer, nicht löschbar) oder "admin" */
  role: text("role").$type<"superadmin" | "admin">().notNull().default("admin"),
  /** Deaktiviert: kann sich nicht anmelden */
  banned: boolean("banned").notNull().default(false),
  ...zeitstempel,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...zeitstempel,
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...zeitstempel,
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...zeitstempel,
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const passkey = pgTable(
  "passkey",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    credentialID: text("credential_id").notNull(),
    counter: integer("counter").notNull(),
    deviceType: text("device_type").notNull(),
    backedUp: boolean("backed_up").notNull(),
    transports: text("transports"),
    aaguid: text("aaguid"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("passkey_user_idx").on(t.userId)],
);

export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

/** Geräte mit eingeschalteten Push-Mitteilungen (ohne Konto – nur die Adresse des Push-Dienstes) */
export const pushAbos = pgTable("push_abos", {
  endpoint: text("endpoint").primaryKey(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  /** Freischalt-Schlüssel (PIN-Cookie) beim Anmelden – nur dann auch Mitteilungen zu vertraulichen Terminen */
  pin_schluessel: text("pin_schluessel"),
  erstellt_am: timestamp("erstellt_am", { withTimezone: true }).notNull().defaultNow(),
  zuletzt_zugestellt: timestamp("zuletzt_zugestellt", { withTimezone: true }),
  /** Mitteilungen bei neuen, geänderten und abgesagten Terminen */
  aenderungen: boolean("aenderungen").notNull().default(true),
  /** Erinnerung so viele Minuten vor Treffzeit/Beginn (null = keine) */
  erinnerung_minuten: integer("erinnerung_minuten"),
});

/** Schon verschickte Erinnerungen – jede nur einmal; verschobener Termin = neuer Zeitpunkt = neue Erinnerung */
export const pushErinnerungen = pgTable(
  "push_erinnerungen",
  {
    endpoint: text("endpoint")
      .notNull()
      .references(() => pushAbos.endpoint, { onDelete: "cascade" }),
    termin_id: text("termin_id").notNull(),
    start: timestamp("start", { withTimezone: true }).notNull(),
    gesendet_am: timestamp("gesendet_am", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.endpoint, t.termin_id, t.start] })],
);
