# 👑 Prinzen-Kalender

Planungskalender für die Karnevalssession 2026/27. Er zeigt Termine, Treffzeiten und Treffpunkte, **wer dabei ist** (Gruppen) und **wie viele Eintrittskarten** gebraucht werden. Dazu gibt es Kalender-Abos für alle Geräte und eine **Verwaltung** mit Login und Desktop-Kalender.

**Technik** (wie Inkfuchs):
- Next.js 16 (App Router, Cache Components)
- Better Auth: Passwort und Passkeys
- Drizzle ORM und Postgres (Supabase)
- Tailwind 4, Radix, lucide, sonner, cmdk
- Hosting auf Vercel

## Bereiche

| Bereich | Adresse | Zugang |
|---|---|---|
| Ansicht (Termine, Monat, Abo) | `/` | Geheimer Link `/?k=<ZUGANG_TOKEN>` |
| Kalender-Abos | `/kalender/<ZUGANG_TOKEN>/<filter>.ics` | Token in der Adresse |
| Verwaltung | `/verwaltung` | Login (nur Administratoren) |
| Ersteinrichtung | `/einrichtung` | Nur solange es noch kein Konto gibt |

### Verwaltung

- **Kalender** (Tag, Woche, Monat):
  - Termine ziehen verschiebt sie, unten ziehen ändert die Dauer, Ziehen auf freier Fläche legt einen neuen Termin an.
  - **Rechtsklick-Menüs**: Details, Bearbeiten, Status, Kopieren / Einfügen, Duplizieren, Löschen, Neuer Termin um …
  - Doppelklick bearbeitet. Die Detail-Seitenleiste zeigt den gewählten Termin.
  - Tastatur: `T` heute, `←` `→` blättern, `D` `W` `M` Ansicht, `N` neu, `E` bearbeiten, `⌫` löschen, `⌘C` / `⌘V` kopieren und einfügen, `⌘Z` rückgängig, `?` Hilfe.
- **Termine**: Liste mit Suche und Filtern (kommend, prüfen, Karten), Bearbeiten-Seite mit Verlauf.
- **Gruppen**: Kürzel, Name, Personenzahl (für die Kartenberechnung), „zählt zu Alle“.
- **Benutzer**: nur Administratoren, keine Rechte-Stufen.
  - Den **Super-Admin** gibt es genau einmal. Er wird bei der Einrichtung angelegt und kann weder gelöscht noch deaktiviert werden; das sichert die Datenbank zusätzlich ab.
  - Weitere Administratoren kommen per **Einladungslink** (zum Weitergeben per WhatsApp oder E-Mail). Für vergessene Passwörter gibt es einen **Passwort-Link**.
  - Konten lassen sich deaktivieren und löschen.
- **Mein Konto**: Name, Passwort, **Passkeys** (Face ID, Fingerabdruck), angemeldete Geräte.
- **Protokoll**: wer hat wann was geändert. Bei jedem Termin ist der Verlauf sichtbar.
- **⌘K**: Suche über Seiten, Aktionen und Termine.

## Einrichtung

### 1. Supabase mit Vercel verbinden

Am einfachsten über die **Supabase-Integration in Vercel** (Projekt → Storage/Integrations → Supabase). Sie setzt
`POSTGRES_URL`, `SUPABASE_JWT_SECRET` usw. automatisch – die App nutzt diese Variablen direkt.
Alternativ eine eigene `DATABASE_URL` (Supabase → Connect → „Transaction pooler“) eintragen.

SQL von Hand ist **nicht nötig**: Tabellen und Startdaten legt die App beim Deploy selbst an.

### 2. Vercel → Settings → Environment Variables (zusätzlich)

| Variable | Wert |
|---|---|
| `SUPERADMIN_EMAIL` | deine E-Mail – nur damit geht die Ersteinrichtung (**wichtig**, sonst kann sich der Erste als Super-Admin anlegen) |
| `ZUGANG_TOKEN` | geheimes Wort für den Ansichts-Link (Buchstaben, Ziffern, `-`) |
| `BETTER_AUTH_SECRET` | optional – ohne wird `SUPABASE_JWT_SECRET` der Integration verwendet |

Danach **Deployments → ⋯ → Redeploy**. Im Build-Log: `db:einrichten – Startdaten eingespielt (11 Gruppen, 82 Termine)`.

### 3. Super-Admin anlegen

`https://<deine-domain>/einrichtung` öffnen, Name und Passwort festlegen und danach unter **Mein Konto** einen Passkey hinzufügen.

## Lokal entwickeln

```bash
npm install
cp .env.example .env.local   # DATABASE_URL auf eine lokale Postgres-Datenbank, BETTER_AUTH_SECRET setzen
npm run db:einrichten        # Migrationen + Startdaten
npm run dev
```

| Befehl | Zweck |
|---|---|
| `npm run db:generate` | neue Migration nach Änderungen an `src/db/schema.ts` |
| `npm run db:einrichten` | Migrationen anwenden (+ Startdaten, wenn leer) |
| `npm test` | Unit-Tests (Vitest) |
| `npm run lint` | ESLint |

Ohne `DATABASE_URL` läuft die Ansicht mit den Startdaten aus dem Repo, nur lesend, ohne Login.

## Kalender-Abo

Mögliche Filter sind `alle`, jede Gruppen-ID (z. B. `senat`), `karten`, `intern` und `extern`. Die Seite **/abo** zeigt fertige Buttons für Apple, Google und Outlook.

- Apple aktualisiert etwa stündlich (einstellbar bis 15 Minuten), Google nur alle 8–24 Stunden.
- Jeder Termin hat eine feste UID. Änderungen ersetzen also den Eintrag und erzeugen keine Duplikate.

## Sicherheit

- **Ansicht**: nur mit geheimem Link, nicht indexiert (`robots: noindex`).
- **Anmeldung**:
  - Passwörter speichert Better Auth als Hash (scrypt).
  - Fehlversuche sind begrenzt (10 pro Minute und Adresse sowie pro Konto).
  - Sitzungen werden bei jeder Anfrage geprüft, damit Deaktivieren sofort wirkt.
- **Datenbank**:
  - Alle Tabellen haben RLS ohne Freigaben, über die öffentliche Supabase-API ist also nichts lesbar.
  - Zugriff gibt es nur über die Server-Verbindung.
- **Server-Aktionen**: Jede Aktion prüft selbst, ob ein Administrator angemeldet ist.
