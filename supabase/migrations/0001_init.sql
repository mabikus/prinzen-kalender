-- Prinzen-Kalender – Grundschema
-- Ausführen im Supabase Dashboard: SQL Editor -> diese Datei einfügen -> Run
-- (oder mit der Supabase CLI: supabase db push)

create type termin_status   as enum ('bestaetigt', 'vorbehalt');
create type termin_art      as enum ('intern', 'extern');
create type termin_umfang   as enum ('auswahl', 'alle', 'jeder_verfuegbare');
create type termin_anmeldung as enum ('eintrittskarte', 'voranmeldung');
create type gruppen_farbe   as enum ('rot', 'orange', 'gelb', 'gruen', 'tuerkis', 'blau', 'lila', 'pink', 'grau');

-- Gruppen (Prinz, Senat, Elferrat, Funken, …) – frei pflegbar
create table gruppen (
  id           text primary key,              -- fester Schlüssel, steht in der Abo-URL
  kuerzel      text not null,
  name         text not null,
  beschreibung text,
  personen     integer check (personen >= 0), -- für die Berechnung der Eintrittskarten
  farbe        gruppen_farbe not null default 'grau',
  in_alle      boolean not null default true, -- zählt zu "Alle" / "Jeder Verfügbare"
  sortierung   integer not null default 0
);

create table termine (
  id              text primary key default gen_random_uuid()::text,
  datum           date not null,
  treffzeit       time,          -- wann wir uns am Treffpunkt treffen
  treffpunkt      text,
  beginn          time,          -- offizieller Beginn
  ort             text,          -- Veranstaltungsort, falls anders als Treffpunkt
  ende            time,          -- optional, sonst geschätzt
  anschluss_an    text references termine(id) on delete set null, -- "im Anschluss an …"
  titel           text not null,
  tagesprogramm   text,          -- z. B. 'Weiberdonnerstag' – fasst Termine zusammen
  veranstalter    text,
  art             termin_art    not null default 'extern',
  status          termin_status not null default 'bestaetigt',
  umfang          termin_umfang not null default 'auswahl',
  anmeldung       termin_anmeldung,  -- Eintrittskarte / Voranmeldung nötig?
  karten_bestellt integer check (karten_bestellt >= 0),
  hinweis         text,
  bemerkung       text,
  quelle          text[] not null default '{}',
  pruefen         text,          -- offene Unstimmigkeit
  erstellt_am     timestamptz not null default now(),
  geaendert_am    timestamptz not null default now()
);

create index termine_datum_idx on termine (datum);

-- Welche Gruppen sind bei einem Termin angekreuzt?
create table termin_gruppen (
  termin_id text not null references termine(id) on delete cascade,
  gruppe_id text not null references gruppen(id) on delete cascade,
  primary key (termin_id, gruppe_id)
);

create or replace function setze_geaendert_am() returns trigger
language plpgsql as $$
begin
  new.geaendert_am := now();
  return new;
end $$;

create trigger termine_geaendert_am
  before update on termine
  for each row execute function setze_geaendert_am();

-- Zugriff nur über den Server (Secret Key). Öffentliche Schlüssel sehen nichts.
alter table gruppen        enable row level security;
alter table termine        enable row level security;
alter table termin_gruppen enable row level security;
