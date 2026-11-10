<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Projekt

Prinzen-Kalender: Termine, Treffpunkte, Gruppen (wer ist dabei?) und Eintrittskarten der Karnevalssession –
öffentliche Ansicht mit Kalender-Abos (ICS) und eine Verwaltung mit Login und Desktop-Kalender.
Stack wie Inkfuchs: Next.js 16 (App Router, Cache Components) · Better Auth · Drizzle ORM (1.0 rc) · Postgres (Supabase) ·
Tailwind 4 · Radix · lucide · sonner · cmdk. Oberfläche und Texte auf Deutsch.

- Datenbank: Schema `src/db/schema.ts` → `npm run db:generate` erzeugt Migrationen in `drizzle/`.
  `npm run db:einrichten` (läuft vor jedem Produktions-Build) wendet sie an und spielt beim ersten Mal die Startdaten ein.
- Datenzugriff nur über `src/lib/daten.ts` (mit Protokoll). Ohne `DATABASE_URL`: Startdaten, nur lesen.
- Login: `src/lib/auth.ts` (Better Auth, Passwort + Passkeys), Sitzung `src/lib/sitzung.ts`, Benutzer `src/lib/benutzer.ts`.
  Nur Administratoren; genau ein Super-Admin (Trigger in `drizzle/*_sicherheit` schützt ihn).
- Verwaltung: `src/app/verwaltung/*`, alle Änderungen über `src/app/verwaltung/aktionen.ts` (jede Aktion prüft die Anmeldung).
- Verwaltung im Design der KBN-App: Schrift Plus Jakarta Sans/Bricolage (nur unter `[data-verwaltung]`), Seitenleiste
  `src/components/admin/shell.tsx` (Menüpunkte in `menue.ts`; Zahnrad → Einstellungen mit eigenem Menü), Listen nur über
  `src/components/ui/daten-tabelle.tsx` (Pills, Suche mit „/“, sortierbare Spalten, Blätterleiste, Karten am Handy).
- UI-Bausteine aus Inkfuchs: `src/components/ui/*` – Farben nur über Tokens in `globals.css` (Rot-Weiß), keine Hex-Werte.
- Kalender: `src/components/kalender/*` – Rechenlogik in `geometrie.ts` (mit Vitest-Tests).
- Gruppenlogik, Filter, Kartenbedarf: `src/lib/labels.ts`; Zeitlogik: `src/lib/zeit.ts`; Feed: `src/lib/ics.ts`.
- Zugriffsschutz Ansicht: `src/proxy.ts` + `src/lib/zugang.ts`.
- Darstellung (App-Name, Unterzeile, Logo): Verwaltung → Darstellung, Tabelle `einstellungen`, Laden über `src/lib/marke-laden.ts`
  (`"use cache"` + `cacheTag("marke")`, nach dem Speichern `updateTag`). Bild-Adressen tragen `?v=<logo_stand>`.
- Prüfen vor dem Commit: `npx tsc --noEmit`, `npm run lint`, `npm test`.
