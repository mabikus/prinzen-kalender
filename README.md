# 👑 Prinzen-Kalender

Planungskalender für die Karnevalssession 2026/27 mit allen Terminen, Treffzeiten und Treffpunkten, der Besetzung (wer ist dabei?) und der Fahrt (Auto, Abholung, Bus, zu Fuß). Die Termine lassen sich als **Kalender-Abo** auf allen Geräten einbinden.

**Technik:** Next.js 16 · Supabase (Postgres) · Vercel

## Funktionen (Phase 1)

- **Terminliste**: nach Monat und Tag gruppiert, mit der Karte „Als Nächstes“ und Filtern (Alle, Vorstand, Hofstaat, Familie, Auto, Arbeitseinsätze)
- **Monatsansicht**: farbig nach Besetzung
- **Termin-Detail**: Treffen, Einlass, Beginn, Ende, Besetzung, Fahrt, Hinweise; Treffpunkte als Kartenlinks; einzelner Termin als `.ics`
- **Kalender-Abos**: ein Feed pro Filter, also z. B. einer nur für den Vorstand. Unterstützt werden Apple, Google und Outlook.
- **Zugriffsschutz**: Zugang per geheimem Link, Abo-URLs mit Token, Seite nicht von Suchmaschinen indexiert
- **Vor dem Supabase-Anschluss**: Die App zeigt dann die Startdaten aus dem Repo an.

## Datenmodell

| Feld | Bedeutung |
|---|---|
| `treffzeit` / `treffpunkt` | Wann und wo wir uns treffen. Mit dieser Zeit beginnt der Kalendereintrag. |
| `beginn` / `ort` / `einlass` | Offizieller Beginn und Veranstaltungsort |
| `ende` | Optional. Fehlt es, wird die Dauer je Kategorie geschätzt. |
| `anschluss_an` | „Im Anschluss an“ einen anderen Termin, für Termine ohne eigene Uhrzeit |
| `tagesprogramm` | Klammer für mehrere Programmpunkte, z. B. *Weiberdonnerstag* |
| `besetzung` | `wir` (Prinz(en) + Adjutant) ⊂ `vorstand` ⊂ `hofstaat` ⊂ `alle`; dazu `abfrage` (Kästchen im KG-Plan) und `helfer` („Viele Hände“) |
| `familie` | Frau & Kinder dabei |
| `fahrt` / `fahrt_details` / `fahrer` | `auto` (Standard), `abholung`, `bus`, `zu_fuss`, `offen` |
| `status` | `bestaetigt` / `vorbehalt` |
| `hinweis` | z. B. „Nur mit vorbestellter Eintrittskarte“ |
| `quelle` / `pruefen` | Herkunft (`kg` = KG-Terminplan, `eigen` = eigene Liste) und offene Unstimmigkeiten |

## Einrichtung

### 1. Supabase

1. Auf [supabase.com](https://supabase.com) ein neues Projekt anlegen, Region **Frankfurt (eu-central-1)**.
2. Im **SQL Editor** nacheinander ausführen:
   - `supabase/migrations/0001_init.sql` (Tabelle anlegen)
   - `supabase/seed.sql` (Termine der Session 2026/27)
3. Unter **Project Settings → API** die Project URL und den **Secret key** kopieren.

Termine pflegt ihr danach im **Table Editor** (Tabelle `termine`). Die Felder `besetzung`, `fahrt`, `status` und `kategorie` sind dort Auswahllisten.

### 2. Vercel

1. Das Repo in Vercel importieren (Framework: Next.js).
2. Unter **Environment Variables** eintragen (siehe `.env.example`):
   - `ZUGANG_TOKEN`: ein langes, zufälliges Wort, z. B. `openssl rand -base64 18 | tr '+/' '-_'`
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
3. Deployen.
4. Den Einladungslink `https://<domain>/?k=<ZUGANG_TOKEN>` in der Gruppe teilen. Danach merkt sich jeder Browser den Zugang.

Wird das Token geändert, verlieren alle Zugänge und Abos ihre Gültigkeit und müssen neu eingerichtet werden.

### Lokal entwickeln

```bash
npm install
cp .env.example .env.local   # optional – ohne Werte laufen die Startdaten
npm run dev
```

Startdaten geändert? Dann mit `npm run seed:sql` die Datei `supabase/seed.sql` neu erzeugen.

## Kalender-Abo

Feed-URL: `/kalender/<ZUGANG_TOKEN>/<filter>.ics`. Mögliche Filter sind `alle`, `vorstand`, `hofstaat`, `familie`, `auto` und `helfer`. Die Seite **/abo** zeigt fertige Buttons für Apple, Google und Outlook.

- **Apple**: Aktualisierung etwa stündlich; in den Einstellungen bis auf 15 Minuten einstellbar.
- **Google**: Aktualisierung nur etwa alle 8–24 Stunden. Darauf hat die App keinen Einfluss. Für kurzfristige Änderungen deshalb immer die Webseite prüfen.
- Jeder Termin hat eine feste UID. Änderungen aktualisieren also den bestehenden Eintrag und erzeugen keine Duplikate.

## Ausblick

- **Phase 2**: Login (Supabase Auth per E-Mail-Link), Bearbeitungsformular in der App, Warnungen bei Überschneidungen und zu wenig Sitzplätzen im Auto, Personen und Gruppen als eigene Tabellen
- **Später**: Mitbringliste pro Termin (Orden, Wurfmaterial, Ornat), Druckansicht im Stil des KG-Plans, Import neuer KG-Listen
