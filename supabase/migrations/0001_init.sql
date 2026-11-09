-- Prinzen-Kalender – Grundschema
-- Ausführen im Supabase Dashboard: SQL Editor -> diese Datei einfügen -> Run
-- (oder mit der Supabase CLI: supabase db push)

create type termin_status as enum ('bestaetigt', 'vorbehalt');
create type termin_besetzung as enum ('wir', 'vorstand', 'hofstaat', 'alle', 'abfrage', 'helfer');
create type termin_fahrt as enum ('auto', 'abholung', 'bus', 'zu_fuss', 'offen');
create type termin_kategorie as enum (
  'proklamation', 'sitzung', 'umzug', 'empfang', 'besuch',
  'arbeitseinsatz', 'feier', 'intern', 'sonstiges'
);

create table termine (
  id            text primary key default gen_random_uuid()::text,
  datum         date not null,
  treffzeit     time,          -- wann wir uns am Treffpunkt treffen
  beginn        time,          -- offizieller Beginn
  einlass       time,
  ende          time,          -- optional, sonst geschätzt
  anschluss_an  text references termine(id) on delete set null, -- "im Anschluss an …"
  titel         text not null,
  tagesprogramm text,          -- z. B. 'Weiberdonnerstag'
  veranstalter  text,
  treffpunkt    text,
  ort           text,          -- Veranstaltungsort, falls anders als Treffpunkt
  kategorie     termin_kategorie not null default 'sonstiges',
  status        termin_status    not null default 'bestaetigt',
  besetzung     termin_besetzung not null default 'wir',
  familie       boolean          not null default false,
  fahrt         termin_fahrt     not null default 'auto',
  fahrt_details text,          -- z. B. 'Abholung durch Funken 10:30 beim Sepp'
  fahrer        text,
  hinweis       text,          -- z. B. 'Nur mit vorbestellter Eintrittskarte'
  bemerkung     text,
  quelle        text[]           not null default '{}',
  pruefen       text,          -- offene Unstimmigkeit
  erstellt_am   timestamptz      not null default now(),
  geaendert_am  timestamptz      not null default now()
);

create index termine_datum_idx on termine (datum);

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
alter table termine enable row level security;
