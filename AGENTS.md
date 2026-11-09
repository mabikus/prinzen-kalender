<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Projekt

Prinzen-Kalender: Termine, Treffpunkte, Gruppen (wer ist dabei?) und Eintrittskarten der Karnevalssession, mit Kalender-Abos (ICS) und Verwaltung.

- Datenmodell: `src/lib/types.ts` – muss zu `supabase/migrations/*.sql` passen.
- Startdaten: `src/data/session-2026-27.ts` → `npm run seed:sql` erzeugt `supabase/seed.sql`.
- Datenzugriff nur über `src/lib/daten.ts` (Supabase / lokale Datei / Startdaten).
- Gruppenlogik, Filter, Kartenbedarf: `src/lib/labels.ts`.
- Zeitlogik (Start/Ende, „im Anschluss“, Sortierung): `src/lib/zeit.ts`; Kalender-Feed: `src/lib/ics.ts`.
- Bearbeiten: Server Actions in `src/app/verwaltung/aktionen.ts` – jede Aktion prüft `darfBearbeiten()`.
- Zugriffsschutz: `src/proxy.ts` + `src/lib/zugang.ts`; Bearbeiten-Recht: `src/lib/bearbeiten.ts`.
- Oberfläche und Texte auf Deutsch.
