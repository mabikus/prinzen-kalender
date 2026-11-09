# 👑 Prinzen-Kalender

Planungskalender für die Karnevalssession 2026/27. Er zeigt Termine, Treffzeiten und Treffpunkte, **wer dabei ist** (Gruppen) und **wie viele Eintrittskarten** gebraucht werden. Die Termine lassen sich als **Kalender-Abo** auf allen Geräten einbinden.

**Technik:** Next.js 16 · Supabase (Postgres) · Vercel

## Funktionen

- **Terminliste**: Karte „Als Nächstes“, dazu Filter je Gruppe sowie für Karten/Anmeldung, Intern und Extern. Tagesprogramme mit vielen Punkten (z. B. *Weiberdonnerstag*) sind zu einer Karte zusammengefasst und lassen sich aufklappen.
- **Monatsansicht**: farbig nach Gruppe; „Alle“ ist rot, „Jeder Verfügbare“ grau.
- **Termin-Detail**: Treffen, Beginn, Ende (optional, sonst geschätzt), wer dabei ist, und der **Kartenbedarf**. Dieser wird aus den Personenzahlen der Gruppen errechnet und dem bestellten Stand gegenübergestellt. Treffpunkte öffnen die Karte.
- **Kalender-Abos (ICS)**: ein Feed für alles und einer **pro Gruppe**. Buttons für Apple, Google und Outlook.
- **Verwaltung** (`/verwaltung`):
  - **Gruppen** anlegen und bearbeiten: Kürzel, Name, Personenzahl, Farbe und ob die Gruppe zu „Alle“ zählt.
  - **Termine** anlegen, bearbeiten und löschen. „Wer ist dabei?“ lässt sich per Schnellbutton **Alle** oder **Jeder Verfügbare** setzen, oder man kreuzt einzelne Gruppen an.
- **Zugriffsschutz**: Zugang per geheimem Link, Bearbeiten mit Passwort, die Seite wird nicht von Suchmaschinen indexiert.

## Datenmodell

**Gruppen**: `id` (steht auch in der Abo-URL), `kuerzel`, `name`, `beschreibung`, `personen`, `farbe`, `in_alle` (z. B. Familie: nein), `sortierung`

**Termine**:

| Feld | Bedeutung |
|---|---|
| `treffzeit` / `treffpunkt` | Wann und wo wir uns treffen. Mit dieser Zeit beginnt der Kalendereintrag. |
| `beginn` / `ort` | Offizieller Beginn und Veranstaltungsort |
| `ende` | Optional. Fehlt es, wird die Dauer geschätzt. |
| `anschluss_an` | „Im Anschluss an“ einen anderen Termin, für Termine ohne eigene Uhrzeit |
| `tagesprogramm` | Fasst Programmpunkte eines Tages zusammen, z. B. *Weiberdonnerstag* |
| `veranstalter`, `art` | Veranstalter; `intern` (eigene KG) oder `extern` |
| `status` | `bestaetigt` / `vorbehalt` |
| `umfang` + Gruppen | `alle`, `jeder_verfuegbare` oder `auswahl`; welche Gruppen angekreuzt sind, steht in der Tabelle `termin_gruppen` |
| `anmeldung` / `karten_bestellt` | `eintrittskarte` / `voranmeldung` und wie viele bereits bestellt sind |
| `hinweis`, `bemerkung`, `pruefen` | Wichtiger Hinweis (rot), freie Bemerkung, offene Frage |

## Einrichtung

### 1. Supabase

1. Auf [supabase.com](https://supabase.com) ein neues Projekt anlegen, Region **Frankfurt (eu-central-1)**.
2. Im **SQL Editor** nacheinander ausführen:
   - `supabase/migrations/0001_init.sql` (Tabellen anlegen)
   - `supabase/seed.sql` (Gruppen und Termine der Session 2026/27)
3. Unter **Project Settings → API** die Project URL und den **Secret key** kopieren.

### 2. Vercel

1. Das Repo in Vercel importieren (Framework: Next.js).
2. Unter **Environment Variables** eintragen (siehe `.env.example`):
   - `ZUGANG_TOKEN`: ein langes, zufälliges Wort, z. B. `openssl rand -base64 18 | tr '+/' '-_'`
   - `BEARBEITEN_TOKEN`: Passwort für die Verwaltung
   - `SUPABASE_URL` und `SUPABASE_SECRET_KEY`
3. Deployen.
4. Den Einladungslink `https://<domain>/?k=<ZUGANG_TOKEN>` in der Gruppe teilen. Danach merkt sich jeder Browser den Zugang.

Ohne Supabase zeigt die App auf Vercel nur die Startdaten an, Bearbeiten ist dann nicht möglich.

### Lokal entwickeln

```bash
npm install
npm run dev
```

Ohne Supabase-Werte speichert die App lokal in `.daten/daten.json`. Die Datei ist nicht im Git; zum Zurücksetzen einfach löschen.

Startdaten geändert? Dann mit `npm run seed:sql` die Datei `supabase/seed.sql` neu erzeugen.

## Kalender-Abo

Feed-URL: `/kalender/<ZUGANG_TOKEN>/<filter>.ics`. Als Filter gehen `alle`, jede Gruppen-ID (z. B. `senat`), `karten`, `intern` und `extern`. Die Seite **/abo** zeigt fertige Buttons.

- **Apple**: Aktualisierung etwa stündlich; in den Einstellungen bis auf 15 Minuten einstellbar.
- **Google**: Aktualisierung nur etwa alle 8–24 Stunden. Für kurzfristige Änderungen deshalb die Webseite prüfen.
- Jeder Termin hat eine feste UID. Änderungen aktualisieren also den bestehenden Eintrag und erzeugen keine Duplikate.

## Ausblick

- Warnung bei Überschneidungen
- Personen in Gruppen (Namen statt nur Anzahl), Zu- und Absagen pro Termin
- Druckansicht im Stil des KG-Plans, Import neuer KG-Listen
